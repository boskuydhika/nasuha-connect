# 05 - UI/UX Design System Guidelines

## 1. Visual Philosophy ("Premium Tech")
* **Style:** Clean, Professional, "Linear-like" aesthetics.
* **Theme:** **Dark Mode Default**. Use `Zinc 950` (`#09090b`) instead of pure black for warmth.
* **Depth:** Avoid heavy drop shadows in Dark Mode. Use **Inner Borders** (`ring-1 ring-white/10`) to define edges and depth.
* **Library:** **Shadcn UI** is the Source of Truth.

## 2. Typography
* **Primary Font:** **Inter** (Google Fonts).
* **Rationale:** Gold standard for legibility, "super rapi", consistent across devices.
* **Settings:** Use tight letter-spacing (`-0.01em` to `-0.02em`) for Headings to give a tighter, premium feel.

## 3. Component Usage Rules
* **Layout Strategy:**
    * **Desktop Login:** Split Grid Layout or Grid Pattern Background. Never use a boring centered card on a white background.
    * **Mobile Login:** **Native Feel**. No visible card borders. Inputs full-width. Touch targets min 44px.
* **Micro-interactions:**
    * **Inputs:** `focus-within:ring-2` with `transition-all duration-200`.
    * **Buttons:** `active:scale-95` (tactile feedback).
* **Lists/Data:**
    * **Mobile:** Cards with "Swipe Actions" (future).
    * **Desktop:** Data Tables (TanStack Table).

## 4. Color Palette (Tailwind)
* **Primary:** NASUHA Green/Gold (Customize `globals.css` variable `--primary`).
* **Destructive:** Red (For Delete/Reject actions).
* **Muted:** Gray (For secondary text/subtitles).

## 5. Iconography
* Use **Lucide React**.
* Consistency: Use the same icon for the same action.