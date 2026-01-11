# TECHNICAL-DEBT.md - Prioritized Improvements

> **Last Updated:** 2026-01-11 17:41 WIB  
> **Reviewed By:** Claude Opus 4 + Gemini 2.5 Pro

Dokumentasi teknikal debt dan prioritas perbaikan berdasarkan code review.

---

## 🚨 TIER 1: WAJIB SEKARANG (Critical & Quick Win)

*Kerjain sebelum lanjut fitur lain. Estimasi: 2-3 jam total.*

| # | Issue | Description | Est. Time |
|:---|:---|:---|:---|
| 1 | **Env Validation** | Fail-fast at startup, bukan crash mid-request | 30 min |
| 2 | **Rate Limiting** | Proteksi brute-force di `/auth/login` dan `/auth/register` | 30 min |
| 3 | **Database Indexes** | Index di `users(email)`, `kordas(code)`, `media(type, kordaId)` | 30 min |
| 4 | **Pino Logger** | Replace `console.log/error` dengan structured logger | 45 min |

### Implementation Notes:

#### 1. Env Validation
```typescript
// apps/api/src/config.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  API_PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
})

export const config = envSchema.parse(process.env)
```

#### 2. Rate Limiting
```bash
bun add hono-rate-limiter
```

#### 3. Database Indexes
```typescript
// packages/db/schema/auth.ts
export const users = pgTable('users', {...}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
}))
```

---

## ⚠️ TIER 2: SAMBIL JALAN (Important)

*Kerjain barengan pas develop fitur baru. Jangan ditumpuk di akhir.*

| # | Issue | Description |
|:---|:---|:---|
| 5 | **Extended Seeding** | Dummy users (50), media (20), categories untuk testing UI |
| 6 | **Password Strength** | Zod validation: min 8 char, uppercase, number |
| 7 | **OpenAPI/Swagger** | `@hono/zod-openapi` - dokumentasi otomatis tiap bikin route |
| 8 | **Better Health Check** | Check database connectivity, bukan cuma return `{status: 'ok'}` |

---

## ⏳ TIER 3: NANTI AJA (Before Production)

*Kerjain kalau FASE 1 MVP udah stable.*

| # | Issue | Description |
|:---|:---|:---|
| 9 | **Unit/Integration Tests** | Minimal auth routes + critical business logic |
| 10 | **Migrations vs Push** | Switch dari `db:push` ke `db:generate` + `db:migrate` |
| 11 | **CI/CD Pipeline** | `.github/workflows/ci.yml` - typecheck, lint, test on push |
| 12 | **Sentry/GlitchTip** | Error monitoring dengan alerting ke Email/Telegram |
| 13 | **Refresh Token** | JWT expiry + refresh token pattern |
| 14 | **Forgot Password** | Password reset via email |
| 15 | **Graceful Shutdown** | Handle SIGTERM/SIGINT properly |

---

## ✅ Already Good

| Item | Status |
|:---|:---|
| Constitution Files (`.ai-context/`) | ✅ Comprehensive |
| Dynamic RBAC | ✅ Flexible |
| Soft Delete Pattern | ✅ Consistent |
| Async Audit Logging | ✅ Non-blocking |
| Zod Shared Schemas | ✅ Type-safe |
| Phone Normalization | ✅ Smart helper |
| No API Versioning | ✅ Clean URLs |
| Basic Seeding (roles/permissions/kordas) | ✅ Done |

---

## 📋 Action Plan untuk Next Session

Agent berikutnya harus:
1. **Eksekusi TIER 1** dulu (Env Validation, Rate Limiting, Indexes, Pino)
2. **Extend Seeding** dengan dummy users & media
3. **Lanjut Frontend Setup** (TailwindCSS + Shadcn UI)
4. **Catat progress** di `TASKS-HISTORY.md`

---

## 🔗 References

- [Hono Rate Limiter](https://github.com/rhinobase/hono-rate-limiter)
- [Pino Logger](https://getpino.io/)
- [Sentry for Node](https://docs.sentry.io/platforms/javascript/guides/node/)
- [Drizzle Indexes](https://orm.drizzle.team/docs/indexes-constraints)
