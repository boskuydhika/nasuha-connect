/**
 * App Configuration
 * Validates environment variables at startup (fail-fast pattern)
 */

import 'dotenv/config'
import { z } from 'zod'

// =============================================================================
// ENV SCHEMA
// =============================================================================

const envSchema = z.object({
    // Database
    DATABASE_URL: z
        .string({ required_error: 'DATABASE_URL is required' })
        .url('DATABASE_URL must be a valid URL'),

    // JWT
    JWT_SECRET: z
        .string({ required_error: 'JWT_SECRET is required' })
        .min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),

    // API
    API_PORT: z.coerce.number().default(3000),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),

    // Node env
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// =============================================================================
// VALIDATION & EXPORT
// =============================================================================

function validateEnv() {
    const result = envSchema.safeParse(process.env)

    if (!result.success) {
        console.error('❌ Invalid environment variables:')
        console.error(result.error.flatten().fieldErrors)
        console.error('\nPlease check your .env file!')
        process.exit(1)
    }

    return result.data
}

// Validate at module load time (startup)
export const config = validateEnv()

// Type export
export type Config = z.infer<typeof envSchema>
