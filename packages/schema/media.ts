/**
 * Media Zod Schemas
 * Validation for media content with conditional rules based on type
 */

import { z } from 'zod'
import { requiredString, slugSchema, uuidSchema } from './common'

// =============================================================================
// ENUMS
// =============================================================================

export const MediaTypeEnum = z.enum(['IMAGE', 'VIDEO', 'COPYWRITING'])
export type MediaType = z.infer<typeof MediaTypeEnum>

// =============================================================================
// MEDIA CATEGORY SCHEMAS
// =============================================================================

export const createMediaCategorySchema = z.object({
    name: requiredString.max(100, 'Nama kategori maksimal 100 karakter'),
    slug: slugSchema,
    description: z.string().nullable().optional(),
})

export const updateMediaCategorySchema = createMediaCategorySchema.partial()

export type CreateMediaCategory = z.infer<typeof createMediaCategorySchema>
export type UpdateMediaCategory = z.infer<typeof updateMediaCategorySchema>

// =============================================================================
// MEDIA CONTENT SCHEMAS
// =============================================================================

/**
 * Base schema for media content fields.
 */
const mediaContentBase = z.object({
    title: requiredString.max(255, 'Judul maksimal 255 karakter'),
    description: z.string().nullable().optional(),
    type: MediaTypeEnum,
    fileUrl: z.string().url('URL file tidak valid').nullable().optional(),
    fileSizeBytes: z.number().int().positive().nullable().optional(),
    thumbnailUrl: z.string().url('URL thumbnail tidak valid').nullable().optional(),
    categoryId: uuidSchema.nullable().optional(),
    kordaId: uuidSchema.nullable().optional(), // null = DPP/National
    isFeatured: z.boolean().default(false),
})

/**
 * Create media content schema with conditional validation.
 * - COPYWRITING: description REQUIRED, fileUrl optional
 * - IMAGE/VIDEO: fileUrl REQUIRED, description optional
 */
export const createMediaContentSchema = mediaContentBase.superRefine((data, ctx) => {
    // Validate COPYWRITING: description is required
    if (data.type === 'COPYWRITING') {
        if (!data.description || data.description.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['description'],
                message: 'Deskripsi wajib diisi untuk konten Copywriting',
            })
        }
    }

    // Validate IMAGE/VIDEO: fileUrl is required
    if (data.type === 'IMAGE' || data.type === 'VIDEO') {
        if (!data.fileUrl) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['fileUrl'],
                message: `URL file wajib diisi untuk konten ${data.type}`,
            })
        }
    }
})

/**
 * Update media content schema.
 * All fields optional, but still validates conditional rules if type is provided.
 */
export const updateMediaContentSchema = mediaContentBase.partial().superRefine((data, ctx) => {
    // Only validate if type is explicitly being updated
    if (data.type === 'COPYWRITING' && data.description !== undefined) {
        if (!data.description || data.description.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['description'],
                message: 'Deskripsi wajib diisi untuk konten Copywriting',
            })
        }
    }

    if ((data.type === 'IMAGE' || data.type === 'VIDEO') && data.fileUrl !== undefined) {
        if (!data.fileUrl) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['fileUrl'],
                message: `URL file wajib diisi untuk konten ${data.type}`,
            })
        }
    }
})

export type CreateMediaContent = z.infer<typeof createMediaContentSchema>
export type UpdateMediaContent = z.infer<typeof updateMediaContentSchema>

// =============================================================================
// QUERY SCHEMAS
// =============================================================================

/**
 * Query params for listing media contents.
 */
export const mediaQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: MediaTypeEnum.optional(),
    categoryId: uuidSchema.optional(),
    kordaId: uuidSchema.optional(),
    isFeatured: z.coerce.boolean().optional(),
    isArchived: z.coerce.boolean().default(false),
    search: z.string().optional(),
})

export type MediaQuery = z.infer<typeof mediaQuerySchema>
