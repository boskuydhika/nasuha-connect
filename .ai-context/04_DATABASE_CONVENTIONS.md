# 04 - Database Naming Conventions & Schema Rules

## 1. Naming Conventions
* **Tables:** `snake_case`, **PLURAL**.
    * ✅ `users`, `events`, `event_registrations`
    * ❌ `User`, `event`, `eventRegistration`
* **Columns:** `snake_case`.
    * ✅ `created_at`, `is_active`, `full_name`
    * ❌ `createdAt`, `isActive`, `FullName`
* **Primary Keys:** Always `id` (BigInt/UUID depending on scale, default `serial` is okay for now, `uuid` preferred for security).
* **Foreign Keys:** `singular_table_name_id`.
    * ✅ `user_id`, `event_id`
    * ❌ `userid`, `id_event`

## 2. Standard Columns (Must Have in Every Table)
Every table must include:
* `id`: Primary Key.
* `created_at`: Timestamp (Default `now()`).
* `updated_at`: Timestamp (Updated via trigger/application logic).
* `deleted_at`: Timestamp (Nullable) -> **Soft Delete** strategy is preferred for critical data (Financial/Members).

## 3. Indexes & Constraints
* Foreign Keys must always have proper Constraints (`ON DELETE CASCADE` or `SET NULL`) based on logic.
* Add Indexes on columns frequently used in `WHERE` clauses (e.g., `user_id`, `event_date`, `status`).

## 4. Drizzle Specifics
* Define relations explicitly using `relations()` api in Drizzle schema for easy querying.
* Separate schema files per domain if the DB grows large (e.g., `schema/auth.ts`, `schema/finance.ts`).