/**
 * Drizzle Kit Configuration
 * 
 * IMPORTANT: Uses DIRECT_URL for migrations (port 5432)
 * The regular DATABASE_URL uses Transaction Pooler (port 6543) which hangs during migrations
 */

import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

// Prefer DIRECT_URL for migrations (port 5432), fallback to DATABASE_URL
const migrationUrl = process.env.DIRECT_URL || process.env.DATABASE_URL

if (!migrationUrl) {
    throw new Error('DIRECT_URL or DATABASE_URL environment variable is required')
}

export default defineConfig({
    schema: './schema/index.ts',
    out: './migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: migrationUrl,
    },
    verbose: true,
    strict: true,
})
