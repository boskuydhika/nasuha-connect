/**
 * Auth Schema: Users, Roles, Permissions, Kordas
 * Dynamic role system with granular permissions - NO hardcoded ENUMs!
 */

import { relations } from 'drizzle-orm'
import {
    boolean,
    pgTable,
    primaryKey,
    text,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core'
import { timestamps } from './base'

// =============================================================================
// KORDAS (Regional Branches)
// =============================================================================

/**
 * Regional branches (Koordinator Daerah).
 * Dynamically managed by Super Admin/DPP - no hardcoded data!
 */
export const kordas = pgTable('kordas', {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 20 }).unique().notNull(), // e.g., BEKASI, JAKARTA-TIMUR
    name: varchar('name', { length: 255 }).notNull(), // e.g., "Korda Bekasi"
    city: varchar('city', { length: 100 }),
    province: varchar('province', { length: 100 }),
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps,
})

export const kordasRelations = relations(kordas, ({ many }) => ({
    users: many(users),
}))

// =============================================================================
// ROLES & PERMISSIONS (Dynamic RBAC)
// =============================================================================

/**
 * Dynamic role definitions.
 * Managed by Super Admin/Dev via admin panel.
 */
export const roles = pgTable('roles', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).unique().notNull(), // e.g., super_admin, korda_admin
    displayName: varchar('display_name', { length: 100 }).notNull(), // e.g., "Super Admin"
    description: text('description'),
    isSystem: boolean('is_system').default(false).notNull(), // System roles can't be deleted
    ...timestamps,
})

export const rolesRelations = relations(roles, ({ many }) => ({
    users: many(users),
    rolePermissions: many(rolePermissions),
}))

/**
 * Granular permission definitions.
 * Format: module:action (e.g., media:create, users:impersonate)
 */
export const permissions = pgTable('permissions', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).unique().notNull(), // e.g., media:create
    displayName: varchar('display_name', { length: 100 }).notNull(), // e.g., "Create Media"
    module: varchar('module', { length: 50 }).notNull(), // e.g., media, users, korda
    createdAt: timestamps.createdAt,
})

export const permissionsRelations = relations(permissions, ({ many }) => ({
    rolePermissions: many(rolePermissions),
}))

/**
 * Many-to-many: Roles <-> Permissions
 */
export const rolePermissions = pgTable(
    'role_permissions',
    {
        roleId: uuid('role_id')
            .notNull()
            .references(() => roles.id, { onDelete: 'cascade' }),
        permissionId: uuid('permission_id')
            .notNull()
            .references(() => permissions.id, { onDelete: 'cascade' }),
    },
    (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })]
)

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
    role: one(roles, {
        fields: [rolePermissions.roleId],
        references: [roles.id],
    }),
    permission: one(permissions, {
        fields: [rolePermissions.permissionId],
        references: [permissions.id],
    }),
}))

// =============================================================================
// USERS
// =============================================================================

/**
 * Core user table.
 * Phone stored with leading 0 (normalized via Zod before insert).
 */
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }), // Stored as 08xxx (normalized)
    passwordHash: text('password_hash'), // Nullable for social login
    roleId: uuid('role_id')
        .notNull()
        .references(() => roles.id),
    kordaId: uuid('korda_id').references(() => kordas.id), // Nullable = DPP/National
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps,
})

export const usersRelations = relations(users, ({ one }) => ({
    role: one(roles, {
        fields: [users.roleId],
        references: [roles.id],
    }),
    korda: one(kordas, {
        fields: [users.kordaId],
        references: [kordas.id],
    }),
}))

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Korda = typeof kordas.$inferSelect
export type NewKorda = typeof kordas.$inferInsert

export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert

export type Permission = typeof permissions.$inferSelect
export type NewPermission = typeof permissions.$inferInsert

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
