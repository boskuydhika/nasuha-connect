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

---

## [2026-01-11] - Database Seed Script

### Added
- **packages/db/seed.ts** - Seed script untuk data awal
  - 3 default roles: `super_admin`, `korda_admin`, `member`
  - 21 permissions across 6 modules (users, roles, korda, media, audit)
  - Role-permission assignments (super_admin = all, korda_admin = limited, member = read-only)
  - 3 sample kordas: Bekasi, Jakarta Timur, Bandung

### Usage
```bash
cd packages/db
bun run db:seed
```

---

## [2026-01-11] - Media Center API Routes

### Added
- **apps/api** - Hono API server dengan fitur:
  - `src/lib/response.ts` - Standard API response helpers (success/error)
  - `src/lib/db.ts` - Database connection
  - `src/lib/auth.ts` - JWT middleware + permission checking
  - `src/lib/audit.ts` - Fire-and-forget audit logger
  - `src/routes/media.ts` - Full CRUD untuk media contents
  - `src/routes/categories.ts` - Full CRUD untuk categories

### API Endpoints
> **NO URI VERSIONING** - Routes are clean without version prefix (Eko PZN Philosophy)

| Method | Endpoint | Permission | Description |
|:---|:---|:---|:---|
| GET | `/api/media` | `media:read` | List media (paginated, filterable) |
| GET | `/api/media/:id` | `media:read` | Get single media |
| POST | `/api/media` | `media:create` | Create media |
| PATCH | `/api/media/:id` | `media:update` | Update media |
| DELETE | `/api/media/:id` | `media:delete` | Soft delete media |
| POST | `/api/media/:id/archive` | `media:archive` | Archive media |
| GET | `/api/categories` | `media:read` | List categories |
| POST | `/api/categories` | `media:create` | Create category |

### Features
- JWT authentication with permission-based access control
- Korda-level data isolation (korda_admin only sees their own data)
- Soft delete for all resources
- Audit logging for all mutations
