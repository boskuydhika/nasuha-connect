import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required')
}

export default defineConfig({
    schema: './schema/index.ts',
    out: './migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
    // Use Supabase Transaction Pooler (port 6543) for serverless
    verbose: true,
    strict: true,
})
