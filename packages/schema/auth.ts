/**
 * Auth Zod Schemas
 * Validation for users, roles, permissions, and kordas
 */

import { z } from 'zod'
import { emailSchema, phoneSchema, phoneSchemaOptional, requiredString, uuidSchema } from './common'

// =============================================================================
// KORDA SCHEMAS
// =============================================================================

export const createKordaSchema = z.object({
    code: requiredString
        .max(20, 'Kode korda maksimal 20 karakter')
        .toUpperCase()
        .regex(/^[A-Z0-9-]+$/, 'Kode hanya boleh huruf kapital, angka, dan tanda hubung'),
    name: requiredString.max(255, 'Nama korda maksimal 255 karakter'),
    city: z.string().max(100).nullable().optional(),
    province: z.string().max(100).nullable().optional(),
    isActive: z.boolean().default(true),
})

export const updateKordaSchema = createKordaSchema.partial()

export type CreateKorda = z.infer<typeof createKordaSchema>
export type UpdateKorda = z.infer<typeof updateKordaSchema>

// =============================================================================
// ROLE SCHEMAS
// =============================================================================

export const createRoleSchema = z.object({
    name: requiredString
        .max(100, 'Nama role maksimal 100 karakter')
        .toLowerCase()
        .regex(/^[a-z0-9_]+$/, 'Nama role hanya boleh huruf kecil, angka, dan underscore'),
    displayName: requiredString.max(100, 'Display name maksimal 100 karakter'),
    description: z.string().nullable().optional(),
    isSystem: z.boolean().default(false),
})

export const updateRoleSchema = createRoleSchema.partial()

export type CreateRole = z.infer<typeof createRoleSchema>
export type UpdateRole = z.infer<typeof updateRoleSchema>

// =============================================================================
// PERMISSION SCHEMAS
// =============================================================================

export const createPermissionSchema = z.object({
    name: requiredString
        .max(100, 'Nama permission maksimal 100 karakter')
        .toLowerCase()
        .regex(/^[a-z0-9:_]+$/, 'Nama permission format: module:action (contoh: media:create)'),
    displayName: requiredString.max(100, 'Display name maksimal 100 karakter'),
    module: requiredString
        .max(50, 'Module maksimal 50 karakter')
        .toLowerCase(),
})

export type CreatePermission = z.infer<typeof createPermissionSchema>

// =============================================================================
// USER SCHEMAS
// =============================================================================

export const createUserSchema = z.object({
    email: emailSchema,
    fullName: requiredString.max(255, 'Nama lengkap maksimal 255 karakter'),
    phone: phoneSchemaOptional,
    password: z
        .string()
        .min(8, 'Password minimal 8 karakter')
        .optional(), // Optional for social login
    roleId: uuidSchema,
    kordaId: uuidSchema.nullable().optional(), // null = DPP/National
    isActive: z.boolean().default(true),
})

export const updateUserSchema = createUserSchema.partial().omit({ password: true })

/**
 * Login schema.
 */
export const loginSchema = z.object({
    email: emailSchema,
    password: requiredString,
})

/**
 * Change password schema.
 */
export const changePasswordSchema = z.object({
    currentPassword: requiredString,
    newPassword: z.string().min(8, 'Password baru minimal 8 karakter'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
})

export type CreateUser = z.infer<typeof createUserSchema>
export type UpdateUser = z.infer<typeof updateUserSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ChangePassword = z.infer<typeof changePasswordSchema>

// =============================================================================
// IMPERSONATION SCHEMA
// =============================================================================

/**
 * Schema for admin impersonating a user.
 * Requires users:impersonate permission.
 */
export const impersonateUserSchema = z.object({
    targetUserId: uuidSchema,
    reason: z.string().max(500).optional(), // Optional reason for audit log
})

export type ImpersonateUser = z.infer<typeof impersonateUserSchema>
