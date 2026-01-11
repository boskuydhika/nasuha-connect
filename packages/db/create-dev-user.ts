/**
 * Create Dev User Script
 * Creates a super_admin user for testing
 * 
 * Run with: bun run create-dev-user.ts
 */

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import { users, roles } from './schema'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
}

const client = postgres(connectionString, { prepare: false })
const db = drizzle(client)

async function main() {
    const email = 'admin@nasuha.id'
    const password = 'admin123' // Change this in production!

    console.log('🔑 Creating dev user...\n')

    try {
        // Check if user exists
        const existing = await db.select().from(users).where(eq(users.email, email))

        if (existing.length > 0) {
            console.log(`⚠️  User ${email} already exists`)
            console.log(`   ID: ${existing[0].id}`)
            await client.end()
            return
        }

        // Get super_admin role
        const superAdminRole = await db.select().from(roles).where(eq(roles.name, 'super_admin'))

        if (superAdminRole.length === 0) {
            console.log('❌ super_admin role not found. Run db:seed first!')
            await client.end()
            return
        }

        // Hash password
        const passwordHash = await Bun.password.hash(password)

        // Create user
        const [newUser] = await db
            .insert(users)
            .values({
                email,
                fullName: 'Admin NASUHA',
                phone: '081234567890',
                passwordHash,
                roleId: superAdminRole[0].id,
                kordaId: null, // DPP level
                isActive: true,
            })
            .returning()

        console.log('✅ Dev user created!')
        console.log(`   Email: ${email}`)
        console.log(`   Password: ${password}`)
        console.log(`   ID: ${newUser.id}`)
        console.log(`   Role: super_admin`)
        console.log('\n🔐 Use this to login via POST /api/auth/login')
    } catch (err) {
        console.error('❌ Error:', err)
    } finally {
        await client.end()
    }
}

main()
