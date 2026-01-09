/**
 * Audit Logs Schema: Immutable logging for all mutations
 * Fire-and-forget async pattern - does not slow down user response
 */

import { jsonb, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { immutableTimestamp } from './base'

// =============================================================================
// AUDIT LOGS
// =============================================================================

/**
 * Async mutation logging table.
 * Every Create/Update/Delete action is recorded here for audit trail.
 * 
 * Special actions:
 * - USER_IMPERSONATE: When admin uses users:impersonate permission
 * - GOD_MODE_LOGIN: DEPRECATED - replaced by USER_IMPERSONATE
 */
export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id'), // Nullable for system actions
    action: varchar('action', { length: 100 }).notNull(), // e.g., CREATE_MEDIA, USER_IMPERSONATE
    entityTable: varchar('entity_table', { length: 100 }).notNull(), // e.g., media_contents
    entityId: varchar('entity_id', { length: 100 }), // The ID of the affected record
    previousState: jsonb('previous_state'), // Data before change (for UPDATE/DELETE)
    newState: jsonb('new_state'), // Data after change (for CREATE/UPDATE)
    ipAddress: varchar('ip_address', { length: 45 }), // IPv4 or IPv6
    userAgent: text('user_agent'),
    metadata: jsonb('metadata'), // Extra context (e.g., impersonator info)
    ...immutableTimestamp, // Only created_at - logs are immutable!
})

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert

// =============================================================================
// AUDIT ACTION CONSTANTS
// =============================================================================

/**
 * Standard audit actions for consistency.
 * Use these constants instead of raw strings.
 */
export const AUDIT_ACTIONS = {
    // Auth actions
    USER_LOGIN: 'USER_LOGIN',
    USER_LOGOUT: 'USER_LOGOUT',
    USER_IMPERSONATE: 'USER_IMPERSONATE', // Admin impersonating user

    // CRUD actions (format: VERB_TABLE)
    CREATE_USER: 'CREATE_USER',
    UPDATE_USER: 'UPDATE_USER',
    DELETE_USER: 'DELETE_USER',

    CREATE_MEDIA: 'CREATE_MEDIA',
    UPDATE_MEDIA: 'UPDATE_MEDIA',
    DELETE_MEDIA: 'DELETE_MEDIA',
    ARCHIVE_MEDIA: 'ARCHIVE_MEDIA',

    CREATE_KORDA: 'CREATE_KORDA',
    UPDATE_KORDA: 'UPDATE_KORDA',
    DELETE_KORDA: 'DELETE_KORDA',

    CREATE_ROLE: 'CREATE_ROLE',
    UPDATE_ROLE: 'UPDATE_ROLE',
    DELETE_ROLE: 'DELETE_ROLE',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]
