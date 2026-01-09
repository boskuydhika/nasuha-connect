# 05 - UI/UX Design System Guidelines

## 1. Visual Philosophy
* **Style:** Clean, Modern, Professional, trustworthy.
* **Theme:** **Dark Mode First** (Sesuai preferensi developer), but fully support Light Mode toggle.
* **Library:** **Shadcn UI** is the Source of Truth. Do not invent custom weird buttons unless necessary.

## 2. Component Usage Rules
* **Layout:** Use a consistent `DashboardLayout` for authenticated pages.
* **Responsive:**
    * **Mobile First approach.** Design for small screens first, then `md:`, `lg:`.
    * Touch targets must be min 44px on mobile (Buttons/Inputs).
* **Feedback:**
    * Use `Skeleton` loaders while fetching data (No spinning spinners unless for submit actions).
    * Use `Toaster` (Sonner) for success/error notifications.

## 3. Color Palette (Tailwind)
* **Primary:** NASUHA Green/Gold (Customize `globals.css` variable `--primary`).
* **Destructive:** Red (For Delete/Reject actions).
* **Muted:** Gray (For secondary text/subtitles).

## 4. Iconography
* Use **Lucide React**.
* Consistency: Use the same icon for the same action across the app (e.g., always `Trash2` for delete, not mixed with `Trash`).