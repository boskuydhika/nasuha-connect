# 04 - Database Naming Conventions & Schema Rules

## 1. Naming Conventions
* **Tables:** `snake_case`, **PLURAL**.
    * ✅ `users`, `events`, `event_registrations`, `audit_logs`
    * ❌ `User`, `event`, `eventRegistration`
* **Columns:** `snake_case`.
    * ✅ `created_at`, `is_active`, `full_name`
    * ❌ `createdAt`, `isActive`, `FullName`
* **Primary Keys:** Always `id` (BigInt/UUID depending on scale, default `serial` is okay for now, `uuid` preferred for security).
* **Foreign Keys:** `singular_table_name_id`.
    * ✅ `user_id`, `event_id`
    * ❌ `userid`, `id_event`

## 2. Standard Columns (Must Have in Every Table)
Every business table (except join tables) must include:
* `id`: Primary Key.
* `created_at`: Timestamp (Default `now()`).
* `updated_at`: Timestamp (Updated via trigger/application logic).
* `deleted_at`: Timestamp (Nullable). **This is MANDATORY for Soft Delete.**

## 3. Soft Delete Implementation (Drizzle Rules)
* **Query Rule:** Every `select` query MUST filter `where(isNull(table.deletedAt))` by default, unless explicitly asking for deleted data (e.g., for Audit Dashboard).
* **Delete Rule:** Use `db.update(table).set({ deletedAt: new Date() })` instead of `db.delete()`.

## 4. Audit Log Schema
To separate concerns, we use a dedicated structure for logs (to be potentially moved to a separate DB later).

**Table: `audit_logs`**
* `id`: UUID.
* `user_id`: UUID/Int (Actor).
* `action`: String (e.g., "CREATE_EVENT", "APPROVE_PAYMENT").
* `entity_table`: String (e.g., "events").
* `entity_id`: String/Int (The ID of the record changed).
* `previous_state`: JSONB (Data before change - for rollback).
* `new_state`: JSONB (Data after change).
* `ip_address`: String.
* `user_agent`: String.
* `created_at`: Timestamp.

## 5. Drizzle Specifics
* Define relations explicitly using `relations()` api in Drizzle schema for easy querying.
* Separate schema files per domain if the DB grows large (e.g., `schema/auth.ts`, `schema/finance.ts`, `schema/logs.ts`).