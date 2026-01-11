/**
 * Structured Logger using Pino
 * Replaces console.log with proper log levels
 */

import pino from 'pino'
import { config } from '../config'

// =============================================================================
// LOGGER SETUP
// =============================================================================

const isProd = config.NODE_ENV === 'production'

export const logger = pino({
    level: isProd ? 'info' : 'debug',
    transport: isProd
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        },
})

// =============================================================================
// CONVENIENCE METHODS
// =============================================================================

/**
 * Log API request/response
 */
export function logRequest(method: string, path: string, status: number, durationMs: number) {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'
    logger[level]({ method, path, status, durationMs }, `${method} ${path} ${status}`)
}

/**
 * Log error with context
 */
export function logError(context: string, error: unknown, extra?: Record<string, unknown>) {
    logger.error({ err: error, context, ...extra }, `[${context}] Error`)
}

/**
 * Log audit event
 */
export function logAuditEvent(action: string, userId: string, details?: Record<string, unknown>) {
    logger.info({ action, userId, ...details }, `[AUDIT] ${action}`)
}
