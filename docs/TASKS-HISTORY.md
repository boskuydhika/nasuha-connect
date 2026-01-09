# TASKS-HISTORY.md - NASUHA Connect Changelog

Dokumentasi perubahan dan fitur yang diimplementasikan.

---

## [2026-01-10] - Fase 1: Database Schema Setup

### Added
- **packages/db** - Drizzle ORM package untuk database schemas
  - `schema/base.ts` - Reusable timestamp helpers (created_at, updated_at, deleted_at)
  - `schema/auth.ts` - Tables: `users`, `roles`, `permissions`, `role_permissions`, `kordas`
  - `schema/media.ts` - Tables: `media_contents`, `media_categories` dengan enum `media_type`
  - `schema/logs.ts` - Table: `audit_logs` dengan action constants
  - `drizzle.config.ts` - Konfigurasi untuk Supabase PostgreSQL

- **packages/schema** - Shared Zod validation schemas
  - `common.ts` - Phone normalization (any format → 08), WhatsApp link helper
  - `auth.ts` - Validasi users, roles, kordas, login, impersonation
  - `media.ts` - Conditional validation (COPYWRITING: description required, IMAGE/VIDEO: fileUrl required)

### Design Decisions
- **Dynamic RBAC:** Roles dan permissions disimpan di database, bukan ENUM hardcode
- **Soft Delete:** Semua business tables memiliki `deleted_at` column
- **User Impersonation:** Menggantikan god-mode dengan permission `users:impersonate`
- **Phone Format:** Disimpan dengan leading `0`, dikonversi ke `62` untuk WhatsApp links

### Dependencies Installed
- `drizzle-orm` ^0.38.3
- `drizzle-kit` ^0.30.4
- `postgres` ^3.4.5
- `zod` ^3.24.1
