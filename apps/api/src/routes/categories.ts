/**
 * Category Routes
 * CRUD endpoints for media categories
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, and, isNull } from 'drizzle-orm'

import { db, mediaCategories, AUDIT_ACTIONS } from '../lib/db'
import { success, error, ERROR_CODES } from '../lib/response'
import { authMiddleware, requirePermission } from '../lib/auth'
import { logAudit, getClientInfo } from '../lib/audit'
import { createMediaCategorySchema, updateMediaCategorySchema } from '@nasuha/schema'

// =============================================================================
// ROUTE SETUP
// =============================================================================

const categories = new Hono()

// =============================================================================
// GET /categories - List all categories
// =============================================================================

categories.get(
    '/',
    authMiddleware,
    requirePermission('media:read'),
    async (c) => {
        try {
            const results = await db.query.mediaCategories.findMany({
                where: isNull(mediaCategories.deletedAt),
                orderBy: (categories, { asc }) => [asc(categories.name)],
            })

            return success(c, results)
        } catch (err) {
            console.error('[GET /categories]', err)
            return error(c, ERROR_CODES.DATABASE_ERROR, 'Gagal mengambil data kategori', 500)
        }
    }
)

// =============================================================================
// GET /categories/:id - Get single category
// =============================================================================

categories.get(
    '/:id',
    authMiddleware,
    requirePermission('media:read'),
    async (c) => {
        const id = c.req.param('id')

        try {
            const result = await db.query.mediaCategories.findFirst({
                where: and(eq(mediaCategories.id, id), isNull(mediaCategories.deletedAt)),
            })

            if (!result) {
                return error(c, ERROR_CODES.NOT_FOUND, 'Kategori tidak ditemukan', 404)
            }

            return success(c, result)
        } catch (err) {
            console.error('[GET /categories/:id]', err)
            return error(c, ERROR_CODES.DATABASE_ERROR, 'Gagal mengambil data kategori', 500)
        }
    }
)

// =============================================================================
// POST /categories - Create category
// =============================================================================

categories.post(
    '/',
    authMiddleware,
    requirePermission('media:create'), // Same permission as media for now
    zValidator('json', createMediaCategorySchema),
    async (c) => {
        const user = c.get('user')
        const body = c.req.valid('json')
        const clientInfo = getClientInfo(c)

        try {
            // Check slug uniqueness
            const existing = await db.query.mediaCategories.findFirst({
                where: eq(mediaCategories.slug, body.slug),
            })

            if (existing) {
                return error(c, ERROR_CODES.ALREADY_EXISTS, 'Slug kategori sudah digunakan', 409)
            }

            const [inserted] = await db
                .insert(mediaCategories)
                .values({
                    name: body.name,
                    slug: body.slug,
                    description: body.description,
                })
                .returning()

            logAudit({
                userId: user.id,
                action: 'CREATE_CATEGORY',
                entityTable: 'media_categories',
                entityId: inserted.id,
                newState: inserted,
                ...clientInfo,
            })

            return success(c, inserted)
        } catch (err) {
            console.error('[POST /categories]', err)
            return error(c, ERROR_CODES.DATABASE_ERROR, 'Gagal membuat kategori', 500)
        }
    }
)

// =============================================================================
// PATCH /categories/:id - Update category
// =============================================================================

categories.patch(
    '/:id',
    authMiddleware,
    requirePermission('media:update'),
    zValidator('json', updateMediaCategorySchema),
    async (c) => {
        const id = c.req.param('id')
        const user = c.get('user')
        const body = c.req.valid('json')
        const clientInfo = getClientInfo(c)

        try {
            const existing = await db.query.mediaCategories.findFirst({
                where: and(eq(mediaCategories.id, id), isNull(mediaCategories.deletedAt)),
            })

            if (!existing) {
                return error(c, ERROR_CODES.NOT_FOUND, 'Kategori tidak ditemukan', 404)
            }

            // Check slug uniqueness if changing
            if (body.slug && body.slug !== existing.slug) {
                const slugExists = await db.query.mediaCategories.findFirst({
                    where: eq(mediaCategories.slug, body.slug),
                })
                if (slugExists) {
                    return error(c, ERROR_CODES.ALREADY_EXISTS, 'Slug kategori sudah digunakan', 409)
                }
            }

            const [updated] = await db
                .update(mediaCategories)
                .set({
                    ...body,
                    updatedAt: new Date(),
                })
                .where(eq(mediaCategories.id, id))
                .returning()

            logAudit({
                userId: user.id,
                action: 'UPDATE_CATEGORY',
                entityTable: 'media_categories',
                entityId: id,
                previousState: existing,
                newState: updated,
                ...clientInfo,
            })

            return success(c, updated)
        } catch (err) {
            console.error('[PATCH /categories/:id]', err)
            return error(c, ERROR_CODES.DATABASE_ERROR, 'Gagal mengupdate kategori', 500)
        }
    }
)

// =============================================================================
// DELETE /categories/:id - Soft delete category
// =============================================================================

categories.delete(
    '/:id',
    authMiddleware,
    requirePermission('media:delete'),
    async (c) => {
        const id = c.req.param('id')
        const user = c.get('user')
        const clientInfo = getClientInfo(c)

        try {
            const existing = await db.query.mediaCategories.findFirst({
                where: and(eq(mediaCategories.id, id), isNull(mediaCategories.deletedAt)),
            })

            if (!existing) {
                return error(c, ERROR_CODES.NOT_FOUND, 'Kategori tidak ditemukan', 404)
            }

            const [deleted] = await db
                .update(mediaCategories)
                .set({
                    deletedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(mediaCategories.id, id))
                .returning()

            logAudit({
                userId: user.id,
                action: 'DELETE_CATEGORY',
                entityTable: 'media_categories',
                entityId: id,
                previousState: existing,
                ...clientInfo,
            })

            return success(c, { id: deleted.id, deleted: true })
        } catch (err) {
            console.error('[DELETE /categories/:id]', err)
            return error(c, ERROR_CODES.DATABASE_ERROR, 'Gagal menghapus kategori', 500)
        }
    }
)

export default categories
