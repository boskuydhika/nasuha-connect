/**
 * Base column helpers for consistent schema definitions across all tables.
 * Following NASUHA Connect Database Conventions (04_DATABASE_CONVENTIONS.md)
 */

import { timestamp } from 'drizzle-orm/pg-core'

/**
 * Standard timestamp columns for all business tables.
 * - created_at: Auto-set on insert
 * - updated_at: Auto-updated on every update
 * - deleted_at: For soft delete (null = not deleted)
 */
export const timestamps = {
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
}

/**
 * Timestamp columns for immutable tables (like audit_logs).
 * Only has created_at - no updates or deletes allowed.
 */
export const immutableTimestamp = {
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}
