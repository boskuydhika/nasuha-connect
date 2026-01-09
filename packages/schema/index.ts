/**
 * Schema Package Index
 * Re-exports all Zod schemas for shared validation
 */

// Common utilities
export {
    phoneSchema,
    phoneSchemaOptional,
    formatWhatsAppLink,
    uuidSchema,
    emailSchema,
    requiredString,
    slugSchema,
} from './common'

// Auth schemas
export {
    createKordaSchema,
    updateKordaSchema,
    createRoleSchema,
    updateRoleSchema,
    createPermissionSchema,
    createUserSchema,
    updateUserSchema,
    loginSchema,
    changePasswordSchema,
    impersonateUserSchema,
    // Types
    type CreateKorda,
    type UpdateKorda,
    type CreateRole,
    type UpdateRole,
    type CreatePermission,
    type CreateUser,
    type UpdateUser,
    type LoginInput,
    type ChangePassword,
    type ImpersonateUser,
} from './auth'

// Media schemas
export {
    MediaTypeEnum,
    createMediaCategorySchema,
    updateMediaCategorySchema,
    createMediaContentSchema,
    updateMediaContentSchema,
    mediaQuerySchema,
    // Types
    type MediaType,
    type CreateMediaCategory,
    type UpdateMediaCategory,
    type CreateMediaContent,
    type UpdateMediaContent,
    type MediaQuery,
} from './media'
