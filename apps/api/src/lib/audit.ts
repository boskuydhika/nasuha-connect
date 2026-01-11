/**
 * Audit Logger
 * Fire-and-forget async logging for mutations
 */

import { db, auditLogs, type NewAuditLog, type AuditAction } from './db'

interface AuditLogParams {
    userId?: string | null
    action: AuditAction | string
    entityTable: string
    entityId?: string | null
    previousState?: unknown
    newState?: unknown
    ipAddress?: string | null
    userAgent?: string | null
    metadata?: unknown
}

/**
 * Log an audit event asynchronously (fire-and-forget).
 * Does not block the response to the user.
 */
export function logAudit(params: AuditLogParams): void {
    // Fire-and-forget: don't await, don't throw
    const insertData: NewAuditLog = {
        userId: params.userId ?? null,
        action: params.action,
        entityTable: params.entityTable,
        entityId: params.entityId ?? null,
        previousState: params.previousState ?? null,
        newState: params.newState ?? null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        metadata: params.metadata ?? null,
    }

    db.insert(auditLogs)
        .values(insertData)
        .then(() => {
            // Logged successfully
        })
        .catch((err) => {
            // Log to console but don't fail the request
            console.error('[AUDIT LOG ERROR]', err)
        })
}

/**
 * Helper to extract client info from Hono context
 */
export function getClientInfo(c: { req: { header: (name: string) => string | undefined } }) {
    return {
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
        userAgent: c.req.header('user-agent') || 'unknown',
    }
}
