/**
 * Media Schema: Media Contents & Categories for Fase 1 Media Center
 * Supports: Images, Videos, Copywriting Text
 */

import { relations } from 'drizzle-orm'
import {
    boolean,
    index,
    integer,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core'
import { timestamps } from './base'
import { kordas, users } from './auth'

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Media content type enum.
 * This is the ONLY enum because it's a fixed business logic, not dynamic data.
 */
export const mediaTypeEnum = pgEnum('media_type', ['IMAGE', 'VIDEO', 'COPYWRITING'])

// =============================================================================
// MEDIA CATEGORIES
// =============================================================================

/**
 * Optional categorization for media contents.
 * Dynamically managed - new categories can be added anytime.
 */
export const mediaCategories = pgTable('media_categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(), // e.g., "TSN Flyers"
    slug: varchar('slug', { length: 100 }).unique().notNull(), // URL-friendly
    description: text('description'),
    ...timestamps,
})

export const mediaCategoriesRelations = relations(mediaCategories, ({ many }) => ({
    mediaContents: many(mediaContents),
}))

// =============================================================================
// MEDIA CONTENTS (Fase 1 Core)
// =============================================================================

/**
 * Main media storage for flyers, videos, and copywriting text.
 * Validation rules (enforced via Zod):
 * - COPYWRITING: description required, file_url optional
 * - IMAGE/VIDEO: file_url required, description optional
 */
export const mediaContents = pgTable('media_contents', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'), // Required for COPYWRITING type
    type: mediaTypeEnum('type').notNull(),
    fileUrl: text('file_url'), // Required for IMAGE/VIDEO types
    fileSizeBytes: integer('file_size_bytes'),
    thumbnailUrl: text('thumbnail_url'), // Auto-generated for videos
    categoryId: uuid('category_id').references(() => mediaCategories.id),
    uploadedBy: uuid('uploaded_by')
        .notNull()
        .references(() => users.id),
    kordaId: uuid('korda_id').references(() => kordas.id), // null = DPP/National
    isFeatured: boolean('is_featured').default(false).notNull(),
    // Auto-archive for content >3 months (handled by cron/scheduled task)
    isArchived: boolean('is_archived').default(false).notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps,
}, (table) => [
    index('media_contents_type_idx').on(table.type),
    index('media_contents_korda_id_idx').on(table.kordaId),
    index('media_contents_uploaded_by_idx').on(table.uploadedBy),
    index('media_contents_is_archived_idx').on(table.isArchived),
])

export const mediaContentsRelations = relations(mediaContents, ({ one }) => ({
    category: one(mediaCategories, {
        fields: [mediaContents.categoryId],
        references: [mediaCategories.id],
    }),
    uploader: one(users, {
        fields: [mediaContents.uploadedBy],
        references: [users.id],
    }),
    korda: one(kordas, {
        fields: [mediaContents.kordaId],
        references: [kordas.id],
    }),
}))

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type MediaCategory = typeof mediaCategories.$inferSelect
export type NewMediaCategory = typeof mediaCategories.$inferInsert

export type MediaContent = typeof mediaContents.$inferSelect
export type NewMediaContent = typeof mediaContents.$inferInsert

export type MediaType = (typeof mediaTypeEnum.enumValues)[number]
