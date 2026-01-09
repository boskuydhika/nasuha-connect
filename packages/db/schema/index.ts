/**
 * Schema Index: Re-exports all tables and relations
 * Single entry point for drizzle-kit and application imports
 */

// Base helpers
export { timestamps, immutableTimestamp } from './base'

// Auth module
export {
    kordas,
    kordasRelations,
    roles,
    rolesRelations,
    permissions,
    permissionsRelations,
    rolePermissions,
    rolePermissionsRelations,
    users,
    usersRelations,
    // Types
    type Korda,
    type NewKorda,
    type Role,
    type NewRole,
    type Permission,
    type NewPermission,
    type User,
    type NewUser,
} from './auth'

// Media module
export {
    mediaTypeEnum,
    mediaCategories,
    mediaCategoriesRelations,
    mediaContents,
    mediaContentsRelations,
    // Types
    type MediaCategory,
    type NewMediaCategory,
    type MediaContent,
    type NewMediaContent,
    type MediaType,
} from './media'

// Logs module
export {
    auditLogs,
    AUDIT_ACTIONS,
    // Types
    type AuditLog,
    type NewAuditLog,
    type AuditAction,
} from './logs'
