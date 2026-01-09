/**
 * Database Client & Schema Exports
 * Main entry point for @nasuha/db package
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Re-export all schemas and types
export * from './schema'

// =============================================================================
// DATABASE CLIENT
// =============================================================================

/**
 * Creates a database connection using postgres.js driver.
 * Uses DATABASE_URL from environment.
 * 
 * For Supabase, use Transaction Pooler URL (port 6543) for serverless.
 */
function createDbClient() {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
        throw new Error(
            'DATABASE_URL is not set. Please configure your .env file.\n' +
            'For Supabase, use the Transaction Pooler URL (port 6543).'
        )
    }

    // Create postgres client
    const client = postgres(connectionString, {
        prepare: false, // Required for Supabase Transaction Pooler
    })

    // Create drizzle instance with all schemas
    return drizzle(client, { schema })
}

/**
 * Singleton database instance.
 * Lazy-initialized to avoid connection errors during import.
 */
let _db: ReturnType<typeof createDbClient> | null = null

export function getDb() {
    if (!_db) {
        _db = createDbClient()
    }
    return _db
}

// Export db instance for convenience (will throw if DATABASE_URL not set)
export const db = new Proxy({} as ReturnType<typeof createDbClient>, {
    get(_, prop) {
        return getDb()[prop as keyof ReturnType<typeof createDbClient>]
    },
})

// Export type for external use
export type Database = ReturnType<typeof createDbClient>
