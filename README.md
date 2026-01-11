# NASUHA Connect

Platform digital untuk **Keluarga Besar NASUHA** (Komunitas Anti-Riba). Mendigitalisasi dakwah, manajemen keanggotaan, event, dan transparansi keuangan.

> **Motto:** "Bersahabat di Dunia, Bertetangga di Surga"

---

## 🚀 Quick Start

```bash
# Install dependencies (dari root)
bun install

# Setup database
cd packages/db
cp .env.example .env  # Edit dengan Supabase credentials
bun run db:push       # Push schema ke database
bun run db:seed       # Seed default data

# Setup API
cd apps/api
cp .env.example .env  # Edit dengan DATABASE_URL dan JWT_SECRET

# Run development
cd ../..              # Kembali ke root
bun run dev           # Jalankan semua apps
```

**Dev Credentials:**
- Email: `admin@nasuha.id`
- Password: `admin123`

---

## 📁 Project Structure

```
nasuha-connect/
├── apps/
│   ├── api/          # Hono backend (port 3000)
│   │   ├── src/
│   │   │   ├── lib/      # Helpers (auth, db, response, audit)
│   │   │   └── routes/   # API routes (auth, media, categories)
│   │   └── .env          # DATABASE_URL, JWT_SECRET
│   │
│   └── web/          # Vite + React frontend (port 5173)
│       └── src/          # React components
│
├── packages/
│   ├── db/           # Drizzle ORM schemas
│   │   ├── schema/       # Table definitions (auth, media, logs)
│   │   ├── seed.ts       # Default data seeder
│   │   └── .env          # DATABASE_URL
│   │
│   └── schema/       # Zod validation schemas
│       ├── common.ts     # Phone normalization, helpers
│       ├── auth.ts       # User, login, impersonate schemas
│       └── media.ts      # Media content schemas
│
├── docs/             # Documentation
│   ├── TASKS-HISTORY.md          # Changelog
│   ├── ARCHITECTURAL-DECISIONS.md # ADRs
│   └── CURRENT-STATUS.md         # Project status & next steps
│
└── .ai-context/      # AI Agent Constitution (BACA INI DULU!)
    ├── 01_PROJECT_BLUEPRINT.md   # Visi, misi, roadmap
    ├── 02_TECH_STACK_RULES.md    # Tech stack & API philosophy
    ├── 03_AGENT_PERSONA_SOP.md   # Cara kerja AI agent
    ├── 04_DATABASE_CONVENTIONS.md # Naming conventions
    └── 05_UI_UX_DESIGN_SYSTEM.md # Mobile-first design rules
```

---

## 🔌 API Endpoints

> **NO URI VERSIONING** - Routes tanpa prefix `/v1` (Eko PZN Philosophy)

### Auth
| Method | Endpoint | Auth | Description |
|:---|:---|:---|:---|
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| POST | `/api/auth/register` | ✅ | Create user (admin) |
| GET | `/api/auth/me` | ✅ | Get current profile |
| POST | `/api/auth/impersonate` | ✅ | Impersonate user |

### Media
| Method | Endpoint | Permission | Description |
|:---|:---|:---|:---|
| GET | `/api/media` | `media:read` | List media |
| POST | `/api/media` | `media:create` | Create media |
| PATCH | `/api/media/:id` | `media:update` | Update media |
| DELETE | `/api/media/:id` | `media:delete` | Soft delete |

### Categories
| GET | `/api/categories` | `media:read` | List categories |
| POST | `/api/categories` | `media:create` | Create category |

---

## 🛠️ Tech Stack

| Layer | Technology |
|:---|:---|
| Runtime | **Bun** v1.3.5+ |
| Monorepo | **Turborepo** |
| Backend | **Hono** |
| Frontend | **React** + Vite |
| Database | **PostgreSQL** (Supabase) |
| ORM | **Drizzle ORM** |
| Validation | **Zod** |
| UI | **Shadcn UI** + TailwindCSS |

---

## 📋 Development Roadmap

| Phase | Status | Description |
|:---|:---|:---|
| **Fase 1** | 🔄 In Progress | Media & Marketing Center |
| Fase 2 | ⏳ Planned | Event Management System |
| Fase 3 | ⏳ Planned | Membership & CRM |
| Fase 4 | ⏳ Planned | Financial Dashboard |

### Fase 1 Checklist
- [x] Database schema (Drizzle)
- [x] Zod validation schemas
- [x] API routes (auth, media, categories)
- [x] JWT authentication
- [x] Permission-based access control
- [ ] Frontend setup (Shadcn UI + TailwindCSS)
- [ ] Login page
- [ ] Media gallery UI
- [ ] Supabase Storage integration

---

## 📖 For AI Agents

**BACA `.ai-context/` FOLDER DULU!** Itu adalah "Konstitusi" project ini.

1. **01_PROJECT_BLUEPRINT.md** - Pahami visi & roadmap
2. **02_TECH_STACK_RULES.md** - Tech stack & API philosophy
3. **03_AGENT_PERSONA_SOP.md** - Cara kerja & coding standards
4. **04_DATABASE_CONVENTIONS.md** - Naming & soft delete rules
5. **05_UI_UX_DESIGN_SYSTEM.md** - Mobile-first & Shadcn UI

Lalu baca `docs/CURRENT-STATUS.md` untuk status terkini dan next steps.

---

## 📄 License

Private - NASUHA Organization
