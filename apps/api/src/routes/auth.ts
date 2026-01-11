/**
 * Auth Routes
 * Login, register, and user management endpoints
 * 
 * Rate limited to prevent brute-force attacks
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { rateLimiter } from 'hono-rate-limiter'
import { eq, and, isNull } from 'drizzle-orm'

import { db, users, roles, AUDIT_ACTIONS } from '../lib/db'
import { success, error, ERROR_CODES } from '../lib/response'
import { authMiddleware, generateToken, requirePermission } from '../lib/auth'
import { logAudit, getClientInfo } from '../lib/audit'
import { logError } from '../lib/logger'
import { loginSchema, createUserSchema, impersonateUserSchema } from '@nasuha/schema'

// =============================================================================
// RATE LIMITER SETUP
// =============================================================================

/**
 * Rate limiter for login - 5 attempts per minute per IP
 */
const loginRateLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    limit: 5, // 5 attempts
    standardHeaders: 'draft-6',
    keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
    handler: (c) => {
        return c.json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Terlalu banyak percobaan login. Coba lagi dalam 1 menit.',
            },
        }, 429)
    },
})

/**
 * Rate limiter for register - 3 attempts per minute per IP
 */
const registerRateLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    limit: 3, // 3 attempts
    standardHeaders: 'draft-6',
    keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
    handler: (c) => {
        return c.json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Terlalu banyak percobaan registrasi. Coba lagi dalam 1 menit.',
            },
        }, 429)
    },
})

// =============================================================================
// ROUTE SETUP
// =============================================================================

const auth = new Hono()

// =============================================================================
// POST /auth/login - User login
// =============================================================================

auth.post(
    '/login',
    loginRateLimiter,
    zValidator('json', loginSchema),
    async (c) => {
        const body = c.req.valid('json')
        const clientInfo = getClientInfo(c)

        try {
            // Find user by email
            const user = await db.query.users.findFirst({
                where: and(eq(users.email, body.email.toLowerCase()), isNull(users.deletedAt)),
                with: {
                    role: true,
                    korda: true,
                },
            })

            if (!user) {
                return error(c, ERROR_CODES.UNAUTHORIZED, 'Email atau password salah', 401)
            }

            if (!user.isActive) {
                return error(c, ERROR_CODES.FORBIDDEN, 'Akun tidak aktif. Hubungi admin.', 403)
            }

            if (!user.passwordHash) {
                return error(c, ERROR_CODES.UNAUTHORIZED, 'Akun belum memiliki password', 401)
            }

            // Verify password using Bun's built-in password API
            const isValid = await Bun.password.verify(body.password, user.passwordHash)

            if (!isValid) {
                return error(c, ERROR_CODES.UNAUTHORIZED, 'Email atau password salah', 401)
            }

            // Generate JWT token
            const token = await generateToken({
                id: user.id,
                email: user.email,
                roleId: user.roleId,
                kordaId: user.kordaId,
            })

            // Audit log
            logAudit({
                userId: user.id,
                action: AUDIT_ACTIONS.USER_LOGIN,
                entityTable: 'users',
                entityId: user.id,
                ...clientInfo,
            })

            return success(c, {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    phone: user.phone,
                    role: user.role,
                    korda: user.korda,
                },
            })
        } catch (err) {
            logError('auth/login', err)
            return error(c, ERROR_CODES.INTERNAL_ERROR, 'Login gagal', 500)
        }
    }
)

// =============================================================================
// POST /auth/register - Register new user (admin only)
// =============================================================================

auth.post(
    '/register',
    registerRateLimiter,
    authMiddleware,
    requirePermission('users:create'),
    zValidator('json', createUserSchema),
    async (c) => {
        const currentUser = c.get('user')
        const body = c.req.valid('json')
        const clientInfo = getClientInfo(c)

        try {
            // Check if email already exists
            const existing = await db.query.users.findFirst({
                where: eq(users.email, body.email.toLowerCase()),
            })

            if (existing) {
                return error(c, ERROR_CODES.ALREADY_EXISTS, 'Email sudah terdaftar', 409)
            }

            // Verify role exists
            const role = await db.query.roles.findFirst({
                where: and(eq(roles.id, body.roleId), isNull(roles.deletedAt)),
            })

            if (!role) {
                return error(c, ERROR_CODES.INVALID_INPUT, 'Role tidak valid', 400)
            }

            // Hash password if provided
            let passwordHash: string | null = null
            if (body.password) {
                passwordHash = await Bun.password.hash(body.password)
            }

            // Create user
            const [newUser] = await db
                .insert(users)
                .values({
                    email: body.email.toLowerCase(),
                    fullName: body.fullName,
                    phone: body.phone,
                    passwordHash,
                    roleId: body.roleId,
                    kordaId: body.kordaId,
                    isActive: body.isActive ?? true,
                })
                .returning()

            // Audit log
            logAudit({
                userId: currentUser.id,
                action: AUDIT_ACTIONS.CREATE_USER,
                entityTable: 'users',
                entityId: newUser.id,
                newState: { ...newUser, passwordHash: '[REDACTED]' },
                ...clientInfo,
            })

            return success(c, {
                id: newUser.id,
                email: newUser.email,
                fullName: newUser.fullName,
                phone: newUser.phone,
                roleId: newUser.roleId,
                kordaId: newUser.kordaId,
                isActive: newUser.isActive,
            })
        } catch (err) {
            logError('auth/register', err)
            return error(c, ERROR_CODES.DATABASE_ERROR, 'Gagal mendaftarkan user', 500)
        }
    }
)

// =============================================================================
// GET /auth/me - Get current user profile
// =============================================================================

auth.get('/me', authMiddleware, async (c) => {
    const user = c.get('user')

    try {
        const fullUser = await db.query.users.findFirst({
            where: eq(users.id, user.id),
            with: {
                role: {
                    with: {
                        rolePermissions: {
                            with: {
                                permission: true,
                            },
                        },
                    },
                },
                korda: true,
            },
        })

        if (!fullUser) {
            return error(c, ERROR_CODES.NOT_FOUND, 'User tidak ditemukan', 404)
        }

        const permissions = fullUser.role.rolePermissions.map((rp) => rp.permission.name)

        return success(c, {
            id: fullUser.id,
            email: fullUser.email,
            fullName: fullUser.fullName,
            phone: fullUser.phone,
            role: {
                id: fullUser.role.id,
                name: fullUser.role.name,
                displayName: fullUser.role.displayName,
            },
            korda: fullUser.korda,
            permissions,
        })
    } catch (err) {
        logError('auth/me', err)
        return error(c, ERROR_CODES.INTERNAL_ERROR, 'Gagal mengambil profil', 500)
    }
})

// =============================================================================
// POST /auth/impersonate - Impersonate a user (admin only)
// =============================================================================

auth.post(
    '/impersonate',
    authMiddleware,
    requirePermission('users:impersonate'),
    zValidator('json', impersonateUserSchema),
    async (c) => {
        const currentUser = c.get('user')
        const body = c.req.valid('json')
        const clientInfo = getClientInfo(c)

        try {
            // Find target user
            const targetUser = await db.query.users.findFirst({
                where: and(eq(users.id, body.targetUserId), isNull(users.deletedAt)),
                with: {
                    role: true,
                    korda: true,
                },
            })

            if (!targetUser) {
                return error(c, ERROR_CODES.NOT_FOUND, 'User tidak ditemukan', 404)
            }

            // Generate token for target user
            const token = await generateToken({
                id: targetUser.id,
                email: targetUser.email,
                roleId: targetUser.roleId,
                kordaId: targetUser.kordaId,
            })

            // Audit log with impersonator info
            logAudit({
                userId: currentUser.id,
                action: AUDIT_ACTIONS.USER_IMPERSONATE,
                entityTable: 'users',
                entityId: targetUser.id,
                metadata: {
                    impersonatorId: currentUser.id,
                    impersonatorEmail: currentUser.email,
                    targetUserId: targetUser.id,
                    targetUserEmail: targetUser.email,
                    reason: body.reason,
                },
                ...clientInfo,
            })

            return success(c, {
                token,
                impersonating: {
                    id: targetUser.id,
                    email: targetUser.email,
                    fullName: targetUser.fullName,
                    role: targetUser.role,
                    korda: targetUser.korda,
                },
                warning: 'You are now impersonating this user. All actions will be logged.',
            })
        } catch (err) {
            logError('auth/impersonate', err)
            return error(c, ERROR_CODES.INTERNAL_ERROR, 'Gagal melakukan impersonation', 500)
        }
    }
)

export default auth
