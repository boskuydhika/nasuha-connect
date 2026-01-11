# TECHNICAL-DEBT.md - Prioritized Improvements

> **Last Updated:** 2026-01-11 22:00 WIB  
> **Reviewed By:** Claude Opus 4.5 + Gemini 3 Pro

---

## ✅ TIER 1: COMPLETED

*All critical fixes implemented and tested!*

| # | Issue | Status | Notes |
|:---|:---|:---|:---|
| 1 | **Env Validation** | ✅ DONE | `apps/api/src/config.ts` |
| 2 | **Rate Limiting** | ✅ DONE | Login 5/min, Register 3/min - TESTED |
| 3 | **Database Indexes** | ✅ DONE | Added via SQL Editor |
| 4 | **Pino Logger** | ✅ DONE | `apps/api/src/lib/logger.ts` |

---

## ⚠️ TIER 2: SAMBIL JALAN (Important)

*Kerjain barengan pas develop fitur baru.*

| # | Issue | Description |
|:---|:---|:---|
| 5 | **Extended Seeding** | Dummy users (50), media (20), categories |
| 6 | **Password Strength** | Zod: min 8 char, uppercase, number |
| 7 | **OpenAPI/Swagger** | `@hono/zod-openapi` dokumentasi otomatis |
| 8 | ~~Better Health Check~~ | ✅ Already done (checks DB connectivity) |

---

## ⏳ TIER 3: BEFORE PRODUCTION

*Kerjain kalau MVP Fase 1 udah stable.*

| # | Issue | Description |
|:---|:---|:---|
| 9 | **Unit/Integration Tests** | Auth routes + critical logic |
| 10 | **Migrations vs Push** | Switch ke `db:generate` + `db:migrate` |
| 11 | **CI/CD Pipeline** | `.github/workflows/ci.yml` |
| 12 | **Sentry/GlitchTip** | Error monitoring + alerting |
| 13 | **Refresh Token** | JWT expiry + refresh pattern |
| 14 | **Forgot Password** | Password reset via email |
| 15 | **Graceful Shutdown** | Handle SIGTERM/SIGINT |

---

## ✅ Already Good

| Item | Status |
|:---|:---|
| Constitution Files (`.ai-context/`) | ✅ |
| Dynamic RBAC | ✅ |
| Soft Delete Pattern | ✅ |
| Async Audit Logging | ✅ |
| Zod Shared Schemas | ✅ |
| Phone Normalization | ✅ |
| No API Versioning | ✅ |
| Basic Seeding | ✅ |
| **Env Validation (fail-fast)** | ✅ NEW |
| **Rate Limiting (auth)** | ✅ NEW |
| **Pino Structured Logger** | ✅ NEW |
| **Database Indexes** | ✅ NEW |
| **Frontend Setup (Tailwind v4)** | ✅ NEW |
| **Login Page (Premium UI)** | ✅ NEW |
| **Dashboard Shell (Custom)** | ✅ NEW |

---

## 📋 Next Steps for Agent

1. ✅ ~~TIER 1 Complete~~
2. ✅ ~~Frontend Setup & Login~~
3. ✅ ~~Build Dashboard Shell~~
4. **Media Gallery Implementation** - Cards, Upload, Filter
5. **Users Management** - Table, Role assignment

---

## 🔗 References

- [Hono Rate Limiter](https://github.com/rhinobase/hono-rate-limiter)
- [Pino Logger](https://getpino.io/)
- [Sentry for Node](https://docs.sentry.io/platforms/javascript/guides/node/)
- [Drizzle Indexes](https://orm.drizzle.team/docs/indexes-constraints)
