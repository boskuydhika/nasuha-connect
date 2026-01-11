/**
 * Database Seed Script
 * Populates default roles, permissions, and sample data
 * 
 * Run with: bun run db:seed
 */

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import {
    roles,
    permissions,
    rolePermissions,
    kordas,
    type NewRole,
    type NewPermission,
} from './schema'

// =============================================================================
// CONFIGURATION
// =============================================================================

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
}

const client = postgres(connectionString, { prepare: false })
const db = drizzle(client)

// =============================================================================
// DEFAULT DATA DEFINITIONS
// =============================================================================

/**
 * Default roles for NASUHA Connect.
 * is_system = true means the role cannot be deleted.
 */
const DEFAULT_ROLES: NewRole[] = [
    {
        name: 'super_admin',
        displayName: 'Super Admin',
        description: 'Administrator DPP dengan akses penuh ke seluruh sistem',
        isSystem: true,
    },
    {
        name: 'korda_admin',
        displayName: 'Admin Korda',
        description: 'Administrator tingkat Korda (Koordinator Daerah)',
        isSystem: true,
    },
    {
        name: 'member',
        displayName: 'Member',
        description: 'Anggota Keluarga Besar NASUHA (Alumni LBU)',
        isSystem: true,
    },
]

/**
 * Default permissions grouped by module.
 * Format: module:action
 */
const DEFAULT_PERMISSIONS: NewPermission[] = [
    // Users module
    { name: 'users:read', displayName: 'Lihat User', module: 'users' },
    { name: 'users:create', displayName: 'Tambah User', module: 'users' },
    { name: 'users:update', displayName: 'Edit User', module: 'users' },
    { name: 'users:delete', displayName: 'Hapus User', module: 'users' },
    { name: 'users:impersonate', displayName: 'Impersonate User', module: 'users' },

    // Roles module
    { name: 'roles:read', displayName: 'Lihat Role', module: 'roles' },
    { name: 'roles:create', displayName: 'Tambah Role', module: 'roles' },
    { name: 'roles:update', displayName: 'Edit Role', module: 'roles' },
    { name: 'roles:delete', displayName: 'Hapus Role', module: 'roles' },
    { name: 'roles:assign', displayName: 'Assign Permission ke Role', module: 'roles' },

    // Korda module
    { name: 'korda:read', displayName: 'Lihat Korda', module: 'korda' },
    { name: 'korda:create', displayName: 'Tambah Korda', module: 'korda' },
    { name: 'korda:update', displayName: 'Edit Korda', module: 'korda' },
    { name: 'korda:delete', displayName: 'Hapus Korda', module: 'korda' },

    // Media module
    { name: 'media:read', displayName: 'Lihat Media', module: 'media' },
    { name: 'media:create', displayName: 'Upload Media', module: 'media' },
    { name: 'media:update', displayName: 'Edit Media', module: 'media' },
    { name: 'media:delete', displayName: 'Hapus Media', module: 'media' },
    { name: 'media:feature', displayName: 'Set Media Featured', module: 'media' },
    { name: 'media:archive', displayName: 'Archive Media', module: 'media' },

    // Audit module
    { name: 'audit:read', displayName: 'Lihat Audit Log', module: 'audit' },
]

/**
 * Permission assignments per role.
 * super_admin gets ALL permissions.
 * korda_admin gets limited permissions.
 * member gets read-only permissions.
 */
const ROLE_PERMISSION_MAP: Record<string, string[]> = {
    super_admin: [
        // Gets ALL permissions
        '*',
    ],
    korda_admin: [
        // Users - limited
        'users:read',
        // Korda - read only own
        'korda:read',
        // Media - full for own korda
        'media:read',
        'media:create',
        'media:update',
        'media:delete',
        'media:feature',
        'media:archive',
    ],
    member: [
        // Read-only
        'media:read',
    ],
}

/**
 * Sample Kordas for initial setup.
 */
const SAMPLE_KORDAS = [
    { code: 'BEKASI', name: 'Korda Bekasi', city: 'Bekasi', province: 'Jawa Barat' },
    { code: 'JAKARTA-TIMUR', name: 'Korda Jakarta Timur', city: 'Jakarta Timur', province: 'DKI Jakarta' },
    { code: 'BANDUNG', name: 'Korda Bandung', city: 'Bandung', province: 'Jawa Barat' },
]

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

async function seedRoles() {
    console.log('🌱 Seeding roles...')

    for (const role of DEFAULT_ROLES) {
        // Check if exists
        const existing = await db.select().from(roles).where(eq(roles.name, role.name))

        if (existing.length === 0) {
            await db.insert(roles).values(role)
            console.log(`  ✅ Created role: ${role.displayName}`)
        } else {
            console.log(`  ⏭️  Role exists: ${role.displayName}`)
        }
    }
}

async function seedPermissions() {
    console.log('🌱 Seeding permissions...')

    for (const permission of DEFAULT_PERMISSIONS) {
        const existing = await db.select().from(permissions).where(eq(permissions.name, permission.name))

        if (existing.length === 0) {
            await db.insert(permissions).values(permission)
            console.log(`  ✅ Created permission: ${permission.name}`)
        } else {
            console.log(`  ⏭️  Permission exists: ${permission.name}`)
        }
    }
}

async function seedRolePermissions() {
    console.log('🌱 Assigning permissions to roles...')

    // Get all roles and permissions from DB
    const allRoles = await db.select().from(roles)
    const allPermissions = await db.select().from(permissions)

    for (const [roleName, permissionNames] of Object.entries(ROLE_PERMISSION_MAP)) {
        const role = allRoles.find((r) => r.name === roleName)
        if (!role) {
            console.log(`  ⚠️  Role not found: ${roleName}`)
            continue
        }

        // Determine which permissions to assign
        let permsToAssign = allPermissions
        if (!permissionNames.includes('*')) {
            permsToAssign = allPermissions.filter((p) => permissionNames.includes(p.name))
        }

        for (const perm of permsToAssign) {
            // Check if already assigned
            const existing = await db
                .select()
                .from(rolePermissions)
                .where(eq(rolePermissions.roleId, role.id))

            const alreadyAssigned = existing.some((rp) => rp.permissionId === perm.id)

            if (!alreadyAssigned) {
                await db.insert(rolePermissions).values({
                    roleId: role.id,
                    permissionId: perm.id,
                })
                console.log(`  ✅ Assigned ${perm.name} → ${role.displayName}`)
            }
        }
    }
}

async function seedKordas() {
    console.log('🌱 Seeding sample kordas...')

    for (const korda of SAMPLE_KORDAS) {
        const existing = await db.select().from(kordas).where(eq(kordas.code, korda.code))

        if (existing.length === 0) {
            await db.insert(kordas).values(korda)
            console.log(`  ✅ Created korda: ${korda.name}`)
        } else {
            console.log(`  ⏭️  Korda exists: ${korda.name}`)
        }
    }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
    console.log('🚀 Starting database seed...\n')

    try {
        await seedRoles()
        await seedPermissions()
        await seedRolePermissions()
        await seedKordas()

        console.log('\n✨ Seed completed successfully!')
    } catch (error) {
        console.error('\n❌ Seed failed:', error)
        process.exit(1)
    } finally {
        await client.end()
    }
}

main()
