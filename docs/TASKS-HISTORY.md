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

---

## [2026-01-11] - Auth Routes & Testing

### Added
- **apps/api/src/routes/auth.ts** - Authentication endpoints:
  - `POST /api/auth/login` - User login, returns JWT token
  - `POST /api/auth/register` - Create user (admin only)
  - `GET /api/auth/me` - Get current user profile with permissions
  - `POST /api/auth/impersonate` - Impersonate user (requires `users:impersonate`)

- **packages/db/create-dev-user.ts** - Script to create dev super_admin user

### Fixed
- `.env` file encoding issue (PowerShell echo creates unicode, fixed with ASCII)

### Tested
- Login API verified working ✅
- JWT token generation confirmed
- Permission checking functional

---

## [2026-01-11] - Documentation Update for Handoff

### Updated
- **README.md** - Comprehensive project overview with:
  - Quick start guide
  - Project structure
  - API endpoints table
  - Tech stack
  - Instructions for AI agents

- **docs/CURRENT-STATUS.md** (NEW) - Project status including:
  - Completed items checklist
  - In-progress work
  - Prioritized TODO list
  - Key design decisions
  - API testing commands

### Constitution Updates
- **.ai-context/02_TECH_STACK_RULES.md** - Added API Philosophy (No URI Versioning)
- **.ai-context/05_UI_UX_DESIGN_SYSTEM.md** - Enhanced Mobile-First Design section

---

## [2026-01-11] - TIER 1 Critical Fixes Implementation

### Added
- **apps/api/src/config.ts** - Zod env validation at startup (fail-fast pattern)
- **apps/api/src/lib/logger.ts** - Pino structured logger (replaces console.log)
- **hono-rate-limiter** - Rate limiting package installed

### Changed
- **apps/api/src/routes/auth.ts** - Added rate limiting:
  - Login: 5 attempts/minute per IP
  - Register: 3 attempts/minute per IP
- **apps/api/src/index.ts** - Uses config.ts + Pino logger + better health check
- **apps/api/src/lib/auth.ts** - Uses config.JWT_SECRET instead of process.env
- **packages/db/schema/media.ts** - Added 4 indexes (defined in schema)
- **packages/db/drizzle.config.ts** - Prioritize DIRECT_URL for migrations

### Database (via SQL Editor)
```sql
CREATE INDEX media_contents_type_idx ON media_contents(type);
CREATE INDEX media_contents_korda_id_idx ON media_contents(korda_id);
CREATE INDEX media_contents_uploaded_by_idx ON media_contents(uploaded_by);
CREATE INDEX media_contents_is_archived_idx ON media_contents(is_archived);
```

### Tested
- ✅ Env validation works at startup
- ✅ Health check shows `database: connected`
- ✅ Login returns JWT token
- ✅ Rate limiting: attempts 1-5 return 401, attempts 6-7 return 429

### Known Limitations
- Direct Connection (port 5432) not available on IPv4-only networks
- Use Transaction Pooler (port 6543) for app, SQL Editor for DDL

---

## [2026-01-11] - Frontend Setup & Login Page

### Added
- **apps/web** - Initialized Shadcn UI + Tailwind CSS v4
- **apps/web/src/pages/auth/login.tsx** - Premium Split Layout Login Page
- **apps/web/src/components/ui** - Manual setup of Button, Input, Card, Toaster
- **apps/web/src/index.css** - CSS-First Tailwind v4 Configuration

### Design System (Implemented)
- **Font:** Inter (Standard Google Fonts)
- **Theme:** Dark Mode Default (Zinc 950)
- **Login UI:** Split Layout (Brand Left / Form Right)

### Verifications
- ✅ Vite Proxy configured (`/api` -> `localhost:3000`)
- ✅ Login API Integration tested via Browser
- ✅ Error Handling (Invalid Credentials) verified
- ✅ UI Feedback (Sonner/Toaster) fixed and verified
