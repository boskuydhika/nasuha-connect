/**
 * Standard API Response Types
 * Consistent response format across all endpoints
 */

import type { Context } from 'hono'

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface ApiSuccessResponse<T = unknown> {
    success: true
    data: T
    meta?: {
        page?: number
        limit?: number
        total?: number
        totalPages?: number
    }
}

export interface ApiErrorResponse {
    success: false
    error: {
        code: string
        message: string
        details?: unknown
    }
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

/**
 * Success response helper
 */
export function success<T>(c: Context, data: T, meta?: ApiSuccessResponse['meta']) {
    const response: ApiSuccessResponse<T> = { success: true, data }
    if (meta) response.meta = meta
    return c.json(response)
}

/**
 * Paginated success response helper
 */
export function paginated<T>(
    c: Context,
    data: T[],
    { page, limit, total }: { page: number; limit: number; total: number }
) {
    return c.json({
        success: true,
        data,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    } satisfies ApiSuccessResponse<T[]>)
}

/**
 * Error response helper
 */
export function error(
    c: Context,
    code: string,
    message: string,
    status: 400 | 401 | 403 | 404 | 409 | 422 | 500 = 400,
    details?: unknown
) {
    const response: ApiErrorResponse = {
        success: false,
        error: { code, message },
    }
    if (details) response.error.details = details
    return c.json(response, status)
}

// =============================================================================
// COMMON ERROR CODES
// =============================================================================

export const ERROR_CODES = {
    // Auth errors
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',

    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',

    // Resource errors
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',

    // Server errors
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
} as const
