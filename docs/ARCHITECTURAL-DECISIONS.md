# ARCHITECTURAL-DECISIONS.md - NASUHA Connect

Dokumentasi keputusan arsitektur penting beserta alasannya.

---

## ADR-001: Drizzle ORM vs Prisma

**Tanggal:** 2026-01-10  
**Status:** Accepted

### Konteks
Perlu memilih ORM untuk PostgreSQL dengan fokus pada Type Safety dan performa.

### Keputusan
Menggunakan **Drizzle ORM**.

### Alasan
1. **Type-safe Query Builder** - Full TypeScript inference tanpa codegen
2. **Lightweight** - Bundle size jauh lebih kecil dari Prisma
3. **SQL-like Syntax** - Lebih mudah diprediksi dan di-debug
4. **Serverless Ready** - Tidak perlu connection pooling di client
5. **Bun Compatible** - Native support untuk Bun runtime

### Konsekuensi
- Learning curve untuk developer yang terbiasa dengan Prisma
- Perlu manual migration management via `drizzle-kit`

---

## ADR-002: Dynamic RBAC vs Hardcoded Roles

**Tanggal:** 2026-01-10  
**Status:** Accepted

### Konteks
Organisasi NASUHA berkembang - bisa saja ada role baru seperti "Event Coordinator" atau "Finance Admin".

### Keputusan
Menggunakan tabel `roles` + `permissions` + `role_permissions` (bukan ENUM).

### Alasan
1. **Flexibility** - Role baru bisa ditambah tanpa deploy ulang
2. **Granular Permissions** - Kontrol akses per fitur (e.g., `media:create`, `users:impersonate`)
3. **Audit Trail** - Mudah tracking siapa punya akses apa
4. **Scalability** - Siap untuk multi-tenant jika perlu

### Konsekuensi
- Query permission sedikit lebih kompleks (perlu join tables)
- Perlu UI Admin Panel untuk manage roles (implemented later)

---

## ADR-003: Soft Delete vs Hard Delete

**Tanggal:** 2026-01-10  
**Status:** Accepted

### Konteks
Sesuai dengan `04_DATABASE_CONVENTIONS.md` - data kritis tidak boleh hilang.

### Keputusan
Semua business tables (users, media, kordas) menggunakan Soft Delete via `deleted_at` column.

### Alasan
1. **Data Recovery** - Bisa restore data yang tidak sengaja dihapus
2. **Audit Compliance** - Riwayat data tetap ada untuk investigasi
3. **Referential Integrity** - FK tidak broken saat "delete"

### Konsekuensi
- Semua query SELECT harus filter `WHERE deleted_at IS NULL`
- Perlu helper function untuk konsistensi
- Storage sedikit lebih besar (tapi acceptable)

---

## ADR-004: User Impersonation vs God-Mode

**Tanggal:** 2026-01-10  
**Status:** Accepted

### Konteks
Developer perlu cara untuk debug user issues. Awalnya direncanakan "god-mode" password.

### Keputusan
Menggunakan **User Impersonation** via permission `users:impersonate`.

### Alasan
1. **Lebih Aman** - Tidak ada master password yang bisa bocor
2. **Traceable** - Setiap impersonation tercatat di `audit_logs`
3. **Permission-based** - Hanya admin tertentu yang bisa impersonate
4. **Standard Practice** - Sesuai dengan Admin Panel modern (Stripe, Firebase, etc.)

### Konsekuensi
- Perlu implement token exchange flow di API nanti
- UI perlu indicator "You are viewing as [User Name]"

---

## ADR-005: Phone Number Normalization

**Tanggal:** 2026-01-10  
**Status:** Accepted

### Konteks
User input nomor HP bisa bermacam format: `+6281...`, `6281...`, `081...`, `81...`.

### Keputusan
Semua nomor dinormalisasi ke format `08...` saat validasi Zod.

### Alasan
1. **Consistency** - Satu format untuk semua query dan dedupe
2. **Local Friendly** - Format lokal lebih familiar untuk Indonesia
3. **Easy Conversion** - Tinggal replace `0` → `62` untuk WhatsApp/international

### Implementasi
```typescript
// Input apapun → Output 08...
phoneSchema.transform((val) => {
  const digits = val.replace(/\D/g, '')
  if (digits.startsWith('62')) return '0' + digits.slice(2)
  if (digits.startsWith('0')) return digits
  return '0' + digits
})
```

### Konsekuensi
- Helper function `formatWhatsAppLink()` untuk generate link wa.me/62...

---

## ADR-006: No URI Versioning

**Tanggal:** 2026-01-11  
**Status:** Accepted

### Konteks
Banyak API menggunakan versioning seperti `/api/v1/...` tapi menambah kompleksitas.

### Keputusan
Menggunakan **NO URI VERSIONING** (inspired by Eko Kurniawan Khannedy).

### Alasan
1. **Simplicity** - URL lebih bersih dan mudah diingat
2. **Single Source of Truth** - Hanya satu versi API yang aktif
3. **Backward Compatibility** - Handle via header atau query param jika perlu
4. **Less Maintenance** - Tidak perlu maintain multiple API versions

### Implementasi
```
✅ /api/media
✅ /api/categories
❌ /api/v1/media
❌ /api/v2/media
```

### Konsekuensi
- Breaking changes harus dikomunikasikan dengan jelas ke client
- Deprecation strategy via response headers jika perlu

---

## ADR-007: Frontend Stack & Mobile-First Design

**Tanggal:** 2026-01-11  
**Status:** Accepted

### Keputusan
Frontend stack:
- **React** + **Vite** (TypeScript)
- **TailwindCSS** (Styling)
- **Shadcn/UI** (Component Library)

### Design Philosophy
- **Mobile-First** - Design for mobile screens first
- **Drawers/Bottom Sheets** - For mobile actions
- **Cards** - For mobile data display
- **Touch-friendly** - Minimum touch target 44px

### Alasan
1. **Shadcn/UI** - Beautiful, accessible, customizable components
2. **TailwindCSS** - Utility-first, rapid development
3. **Mobile-First** - Target audience adalah member NASUHA yang akses via HP
