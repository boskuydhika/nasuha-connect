# 02 - Technical Stack & Rules

## 1. Core Technology Stack
Kami menggunakan ekosistem **Bun** untuk performa tinggi dan **TypeScript** untuk keamanan kode.

| Layer | Technology | Version / Note |
| :--- | :--- | :--- |
| **Runtime & PM** | **Bun** | v1.3.5+ (Strictly enforced via `packageManager`) |
| **Monorepo** | **Turborepo** | v2.x (Latest) |
| **Backend API** | **Hono** | RPC-style preferred over REST where possible |
| **Frontend** | **React** + Vite | TypeScript Only. No Class Components. |
| **Database** | **PostgreSQL** | Hosted on **Supabase** (Use Transaction Pooler port 6543) |
| **ORM** | **Drizzle ORM** | No Raw SQL strings allowed. |
| **Validation** | **Zod** | Validasi di kedua sisi (FE & BE). |
| **State Mgmt** | **TanStack Query** | v5. Wajib untuk Server State. |
| **UI Library** | **Shadcn UI** | + Tailwind CSS + Lucide Icons. |

## 2. Future-Proofing Architecture
Sistem ini didesain untuk dikembangkan menjadi **Mobile Apps (React Native/Expo)** dan skalabilitas ribuan user.
1.  **API First Design:** Backend Hono harus mengembalikan JSON standar yang konsisten, terdokumentasi via `@hono/zod-openapi`.
2.  **Shared Packages:** Logika bisnis, Tipe TypeScript, dan Validasi Zod harus diletakkan di `packages/` agar bisa di-import oleh Web (sekarang) dan Mobile (nanti).
3.  **Authentication:** Gunakan pendekatan stateless (JWT) yang aman, siap untuk multi-platform auth.

## 3. API Philosophy (CRITICAL)
* **NO URI VERSIONING:** Routes harus bersih tanpa prefix versi (Inspired by Eko Kurniawan Khannedy).
    * ✅ `/api/media`, `/api/auth/login`
    * ❌ `/api/v1/media`, `/api/v2/auth/login`
* **Backward Compatibility:** Jika ada breaking changes, handle via header atau query param, bukan URI version.
* **Standard Response Format:**
    * Success: `{ success: true, data: {...}, meta?: {...} }`
    * Error: `{ success: false, error: { code: string, message: string } }`

## 4. Storage Strategy
* **Provider:** Supabase Storage (S3 Compatible).
* **Structure:** `/public/flyers` (Public access), `/private/receipts` (Auth required).
* **Optimization:** Gambar harus di-compress sebelum upload (gunakan `sharp` atau sejenisnya di backend/edge).

## 5. Data Safety & Logging Strategy (CRITICAL)
* **Soft Delete:** ALL critical data (Users, Transactions, Members) MUST implement Soft Delete (`deleted_at`). Hard delete is strictly forbidden except for cleaning up logs.
* **Audit Logging:**
    * Setiap aksi *mutasi* data (Create, Update, Delete) harus dicatat di tabel terpisah (`audit_logs` atau schema terpisah).
    * Data yang dicatat: `who` (user_id), `what` (action), `where` (resource/table), `when` (timestamp), `metadata` (JSON snapshot before/after).
    * **Performance:** Logging harus bersifat *asynchronous* (fire-and-forget) agar tidak memperlambat respon user.

## 6. Deployment Environment
* **Development:** Localhost (Bun).
* **Frontend Production:** Cloudflare Pages / Vercel.
* **Backend Production:** Supabase Edge Functions / Railway / VPS (Dockerized).