/**
 * Database client for API
 * Re-exports db from @nasuha/db with proper initialization
 */

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@nasuha/db'

// Validate environment
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in apps/api/.env')
}

// Create postgres client
const client = postgres(process.env.DATABASE_URL, {
    prepare: false, // Required for Supabase Transaction Pooler
})

// Create drizzle instance with all schemas
export const db = drizzle(client, { schema })

// Re-export schema types for convenience
export * from '@nasuha/db'
