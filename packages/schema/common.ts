/**
 * Common Zod utilities and helpers
 * Used across all validation schemas
 */

import { z } from 'zod'

// =============================================================================
// PHONE NORMALIZATION
// =============================================================================

/**
 * Phone number schema with automatic normalization.
 * Accepts any format (+62, 62, 08, 8) and normalizes to 08 format.
 * 
 * Examples:
 * - "+6281234567890" → "081234567890"
 * - "6281234567890"  → "081234567890"
 * - "081234567890"   → "081234567890"
 * - "81234567890"    → "081234567890"
 */
export const phoneSchema = z
    .string()
    .min(10, 'Nomor HP minimal 10 digit')
    .max(15, 'Nomor HP maksimal 15 digit')
    .transform((val) => {
        // Remove all non-digit characters
        const digits = val.replace(/\D/g, '')

        // Normalize to 08 format
        if (digits.startsWith('62')) {
            // 6281... → 081...
            return '0' + digits.slice(2)
        }
        if (digits.startsWith('0')) {
            // Already in 08 format
            return digits
        }
        // 81... → 081...
        return '0' + digits
    })
    .refine(
        (val) => val.startsWith('08'),
        'Format nomor HP harus dimulai dengan 08'
    )

/**
 * Optional phone schema (nullable).
 */
export const phoneSchemaOptional = phoneSchema.nullable().optional()

// =============================================================================
// WHATSAPP HELPER
// =============================================================================

/**
 * Converts normalized phone (08...) to WhatsApp link format.
 * @param phone Phone number starting with 08
 * @returns WhatsApp URL like https://wa.me/6281234567890
 */
export function formatWhatsAppLink(phone: string): string {
    // Replace leading 0 with 62
    const internationalFormat = '62' + phone.slice(1)
    return `https://wa.me/${internationalFormat}`
}

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

/**
 * UUID schema for IDs.
 */
export const uuidSchema = z.string().uuid('ID tidak valid')

/**
 * Email schema with normalization.
 */
export const emailSchema = z
    .string()
    .email('Email tidak valid')
    .toLowerCase()
    .trim()

/**
 * Non-empty string schema.
 */
export const requiredString = z.string().min(1, 'Field ini wajib diisi').trim()

/**
 * Slug schema (URL-friendly string).
 */
export const slugSchema = z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung')
