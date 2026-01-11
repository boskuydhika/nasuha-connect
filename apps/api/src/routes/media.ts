/**
 * Media Routes
 * CRUD endpoints for media contents
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, and, isNull, desc, ilike, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db, mediaContents, mediaCategories, AUDIT_ACTIONS } from '../lib/db'
import { success, paginated, error, ERROR_CODES } from '../lib/response'
import { authMiddleware, requirePermission, type AuthUser } from '../lib/auth'
import { logAudit, getClientInfo } from '../lib/audit'
import {
    createMediaContentSchema,
    updateMediaContentSchema,
    mediaQuerySchema,
} from '@nasuha/schema'

// =============================================================================
// ROUTE SETUP
// =============================================================================

const media = new Hono()

// =============================================================================
// GET /media - List media contents
// =============================================================================

media.get(
    '/',
    authMiddleware,
    requirePermission('media:read'),
    zValidator('query', mediaQuerySchema),
    async (c) => {
        const user = c.get('user')
        const query = c.req.valid('query')

        try {
            // Build where conditions
            const conditions = [isNull(mediaContents.deletedAt)]

            // Filter by archived status
            if (!query.isArchived) {
                conditions.push(eq(mediaContents.isArchived, false))
            }

            // Filter by type
            if (query.type) {
                conditions.push(eq(mediaContents.type, query.type))
            }

            // Filter by category
            if (query.categoryId) {
                conditions.push(eq(mediaContents.categoryId, query.categoryId))
            }

            // Filter by korda (korda_admin only sees their own korda)
            if (user.roleName === 'korda_admin' && user.kordaId) {
                conditions.push(eq(mediaContents.kordaId, user.kordaId))
            } else if (query.kordaId) {
                conditions.push(eq(mediaContents.kordaId, query.kordaId))
            }

            // Filter by featured
            if (query.isFeatured !== undefined) {
                conditions.push(eq(mediaContents.isFeatured, query.isFeatured))
            }

            // Search by title
            if (query.search) {
                conditions.push(ilike(mediaContents.title, `%${query.search}%`))
            }

            // Count total
            const countResult = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(mediaContents)
                .where(and(...conditions))

            const total = countResult[0]?.count ?? 0

            // Fetch with pagination
            const offset = (query.page - 1) * query.limit
            const results = await db.query.mediaContents.findMany({
                where: and(...conditions),
                with: {
                    category: true,
                    uploader: {
                        columns: {
                            id: true,
                            fullName: true,
                        },
                    },
                    korda: {
                        columns: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                },
                orderBy: [desc(mediaContents.createdAt)],
                limit: query.limit,
                offset,
            })

            return paginated(c, results, {
                page: query.page,
                limit: query.limit,
                total,
            })
        } catch (err) {
            console.error('[GET /media]', err)
            return error(c, ERROR_CODES.DATABASE_ERROR, 'Gagal mengambil data media', 500)
        }
    }
)

// =============================================================================
// GET /media/:id - Get single media
// =============================================================================

media.get(
    '/:id',
    authMiddleware,
    requirePermission('media:read'),
    async (c) => {
        const id = c.req.param('id')

        try {
            const result = await db.query.mediaContents.findFirst({
                where: and(eq(mediaContents.id, id), isNull(mediaContents.deletedAt)),
                with: {
                    category: true,
                    uploader: {
                        columns: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                    korda: true,
                },
            })

            if (!result) {
                return error(c, ERROR_CODES.NOT_FOUND, 'Media tidak ditemukan', 404)
            }

            return success(c, result)
        } catch (err) {
            console.error('[GET /media/:id]', err)
            return error(c, ERROR_CODES.DATABASE_ERROR, 'Gagal mengambil data media', 500)
        }
    }
)

// =============================================================================
// POST /media - Create media
// =============================================================================

media.post(
    '/',
    authMiddleware,
    requirePermission('media:create'),
    zValidator('json', createMediaContentSchema),
    async (c) => {
        const user = c.get('user')
        const body = c.req.valid('json')
        const clientInfo = getClientInfo(c)

        try {
            // For korda_admin, force kordaId to their own korda
            const kordaId = user.roleName === 'korda_admin' ? user.kordaId : body.kordaId

            const [inserted] = await db
                .insert(mediaContents)
                .values({
                    title: body.title,
                    description: body.description,
                    type: body.type,
                    fileUrl: body.fileUrl,
                    fileSizeBytes: body.fileSizeBytes,
                    thumbnailUrl: body.thumbnailUrl,
                    categoryId: body.categoryId,
                    uploadedBy: user.id,
                    kordaId: kordaId,
                    isFeatured: body.isFeatured ?? false,
                })
                .returning()

            // Audit log (fire-and-forget)
            logAudit({
                userId: user.id,
                action: AUDIT_ACTIONS.CREATE_MEDIA,
                entityTable: 'media_contents',
                entityId: inserted.id,
                newState: inserted,
                ...clientInfo,
            })

            return success(c, inserted)
        } catch (err) {
            console.error('[POST /media]', err)
            return error(c, ERROR_CODES.DATABASE_ERROR, 'Gagal membuat media', 500)
        }
    }
)

// =============================================================================
// PATCH /media/:id - Update media
// =============================================================================

media.patch(
    '/:id',
    authMiddleware,
    requirePermission('media:update'),
    zValidator('json', updateMediaContentSchema),
    async (c) => {
        const id = c.req.param('id')
        const user = c.get('user')
        const body = c.req.valid('json')
        const clientInfo = getClientInfo(c)

        try {
            // Get existing record
            const existing = await db.query.mediaContents.findFirst({
                where: and(eq(mediaContents.id, id), isNull(mediaContents.deletedAt)),
            })

            if (!existing) {
                return error(c, ERROR_CODES.NOT_FOUND, 'Media tidak ditemukan', 404)
            }

            // Korda admin can only update their own korda's media
            if (user.roleName === 'korda_admin' && existing.kordaId !== user.kordaId) {
                return error(c, ERROR_CODES.FORBIDDEN, 'Tidak bisa mengedit media korda lain', 403)
            }

            // Update
            const [updated] = await db
                .update(mediaContents)
                .set({
                    ...body,
                    updatedAt: new Date(),
                })
                .where(eq(mediaContents.id, id))
                .returning()

            // Audit log
            logAudit({
                userId: user.id,
                action: AUDIT_ACTIONS.UPDATE_MEDIA,
                entityTable: 'media_contents',
                entityId: id,
                previousState: existing,
                newState: updated,
                ...clientInfo,
            })

            return success(c, updated)
        } catch (err) {
            console.error('[PATCH /media/:id]', err)
            return error(c, ERROR_CODES.DATABASE_ERROR, 'Gagal mengupdate media', 500)
        }
    }
)

// =============================================================================
// DELETE /media/:id - Soft delete media
// =============================================================================

media.delete(
    '/:id',
    authMiddleware,
    requirePermission('media:delete'),
    async (c) => {
        const id = c.req.param('id')
        const user = c.get('user')
        const clientInfo = getClientInfo(c)

        try {
            // Get existing record
            const existing = await db.query.mediaContents.findFirst({
                where: and(eq(mediaContents.id, id), isNull(mediaContents.deletedAt)),
            })

            if (!existing) {
                return error(c, ERROR_CODES.NOT_FOUND, 'Media tidak ditemukan', 404)
            }

            // Korda admin can only delete their own korda's media
            if (user.roleName === 'korda_admin' && existing.kordaId !== user.kordaId) {
                return error(c, ERROR_CODES.FORBIDDEN, 'Tidak bisa menghapus media korda lain', 403)
            }

            // Soft delete
            const [deleted] = await db
                .update(mediaContents)
                .set({
                    deletedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(mediaContents.id, id))
                .returning()

            // Audit log
            logAudit({
                userId: user.id,
                action: AUDIT_ACTIONS.DELETE_MEDIA,
                entityTable: 'media_contents',
                entityId: id,
                previousState: existing,
                ...clientInfo,
            })

            return success(c, { id: deleted.id, deleted: true })
        } catch (err) {
            console.error('[DELETE /media/:id]', err)
            return error(c, ERROR_CODES.DATABASE_ERROR, 'Gagal menghapus media', 500)
        }
    }
)

// =============================================================================
// POST /media/:id/archive - Archive media
// =============================================================================

media.post(
    '/:id/archive',
    authMiddleware,
    requirePermission('media:archive'),
    async (c) => {
        const id = c.req.param('id')
        const user = c.get('user')
        const clientInfo = getClientInfo(c)

        try {
            const existing = await db.query.mediaContents.findFirst({
                where: and(eq(mediaContents.id, id), isNull(mediaContents.deletedAt)),
            })

            if (!existing) {
                return error(c, ERROR_CODES.NOT_FOUND, 'Media tidak ditemukan', 404)
            }

            const [updated] = await db
                .update(mediaContents)
                .set({
                    isArchived: true,
                    archivedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(mediaContents.id, id))
                .returning()

            logAudit({
                userId: user.id,
                action: AUDIT_ACTIONS.ARCHIVE_MEDIA,
                entityTable: 'media_contents',
                entityId: id,
                previousState: existing,
                newState: updated,
                ...clientInfo,
            })

            return success(c, updated)
        } catch (err) {
            console.error('[POST /media/:id/archive]', err)
            return error(c, ERROR_CODES.DATABASE_ERROR, 'Gagal mengarsipkan media', 500)
        }
    }
)

export default media
