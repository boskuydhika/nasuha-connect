/**
 * Authentication Middleware
 * JWT verification and permission checking
 */

import type { Context, MiddlewareHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import * as jose from 'jose'
import { eq, and, isNull } from 'drizzle-orm'
import { db, users, roles, rolePermissions, permissions } from './db'
import { error, ERROR_CODES } from './response'

// =============================================================================
// TYPES
// =============================================================================

export interface JwtPayload {
    sub: string // user id
    email: string
    roleId: string
    kordaId: string | null
    iat: number
    exp: number
}

export interface AuthUser {
    id: string
    email: string
    fullName: string
    phone: string | null
    roleId: string
    roleName: string
    kordaId: string | null
    permissions: string[]
}

// Extend Hono context with auth user
declare module 'hono' {
    interface ContextVariableMap {
        user: AuthUser
        jwtPayload: JwtPayload
    }
}

// =============================================================================
// JWT HELPERS
// =============================================================================

function getJwtSecret() {
    const secret = process.env.JWT_SECRET
    if (!secret) {
        throw new Error('JWT_SECRET is not set')
    }
    return new TextEncoder().encode(secret)
}

/**
 * Generate JWT token for a user
 */
export async function generateToken(user: {
    id: string
    email: string
    roleId: string
    kordaId: string | null
}): Promise<string> {
    const secret = getJwtSecret()
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d'

    const token = await new jose.SignJWT({
        sub: user.id,
        email: user.email,
        roleId: user.roleId,
        kordaId: user.kordaId,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(secret)

    return token
}

/**
 * Verify JWT token
 */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
    try {
        const secret = getJwtSecret()
        const { payload } = await jose.jwtVerify(token, secret)
        return payload as unknown as JwtPayload
    } catch {
        return null
    }
}

// =============================================================================
// AUTH MIDDLEWARE
// =============================================================================

/**
 * Middleware to verify JWT token and attach user to context.
 * Returns 401 if token is invalid or missing.
 */
export const authMiddleware = createMiddleware(async (c, next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return error(c, ERROR_CODES.UNAUTHORIZED, 'Token tidak ditemukan', 401)
    }

    const token = authHeader.slice(7)
    const payload = await verifyToken(token)

    if (!payload) {
        return error(c, ERROR_CODES.INVALID_TOKEN, 'Token tidak valid atau sudah expired', 401)
    }

    // Fetch user with role and permissions
    const user = await db.query.users.findFirst({
        where: and(eq(users.id, payload.sub), isNull(users.deletedAt)),
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
        },
    })

    if (!user) {
        return error(c, ERROR_CODES.UNAUTHORIZED, 'User tidak ditemukan', 401)
    }

    if (!user.isActive) {
        return error(c, ERROR_CODES.FORBIDDEN, 'Akun tidak aktif', 403)
    }

    // Extract permission names
    const permissionNames = user.role.rolePermissions.map((rp) => rp.permission.name)

    // Set user in context
    c.set('user', {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        roleId: user.roleId,
        roleName: user.role.name,
        kordaId: user.kordaId,
        permissions: permissionNames,
    })
    c.set('jwtPayload', payload)

    await next()
})

// =============================================================================
// PERMISSION MIDDLEWARE
// =============================================================================

/**
 * Middleware factory to check if user has required permission(s).
 * Use after authMiddleware.
 * 
 * @example
 * app.post('/media', authMiddleware, requirePermission('media:create'), handler)
 */
export function requirePermission(...requiredPermissions: string[]): MiddlewareHandler {
    return createMiddleware(async (c, next) => {
        const user = c.get('user')

        if (!user) {
            return error(c, ERROR_CODES.UNAUTHORIZED, 'Unauthorized', 401)
        }

        // Check if user has ALL required permissions
        const hasAllPermissions = requiredPermissions.every((perm) =>
            user.permissions.includes(perm)
        )

        if (!hasAllPermissions) {
            return error(
                c,
                ERROR_CODES.FORBIDDEN,
                `Akses ditolak. Dibutuhkan permission: ${requiredPermissions.join(', ')}`,
                403
            )
        }

        await next()
    })
}

/**
 * Middleware factory to check if user has ANY of the required permissions.
 */
export function requireAnyPermission(...requiredPermissions: string[]): MiddlewareHandler {
    return createMiddleware(async (c, next) => {
        const user = c.get('user')

        if (!user) {
            return error(c, ERROR_CODES.UNAUTHORIZED, 'Unauthorized', 401)
        }

        const hasAnyPermission = requiredPermissions.some((perm) =>
            user.permissions.includes(perm)
        )

        if (!hasAnyPermission) {
            return error(
                c,
                ERROR_CODES.FORBIDDEN,
                `Akses ditolak. Dibutuhkan salah satu permission: ${requiredPermissions.join(', ')}`,
                403
            )
        }

        await next()
    })
}
