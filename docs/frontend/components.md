# Reusable UI Component Library

The frontend implements a strictly typed, headless-inspired UI component library located in `frontend/src/components/ui/`.

---

## 1. Component Catalog

### 1.1 `Button` (`components/ui/button.tsx`)
Supports 6 visual variants (`default`, `secondary`, `destructive`, `outline`, `ghost`, `link`) and 4 sizes (`sm`, `md`, `lg`, `icon`), with built-in loading spinners.

### 1.2 `Badge` (`components/ui/badge.tsx`)
Displays clinical risk tiers with color-coded tokens and optional pulsing indicator dots:
- `LOW`: Green background (`bg-emerald-500/10 text-emerald-400 border-emerald-500/20`)
- `MEDIUM`: Amber background (`bg-amber-500/10 text-amber-400 border-amber-500/20`)
- `HIGH`: Rose background (`bg-rose-500/10 text-rose-400 border-rose-500/20`)
- `CRITICAL`: Purple background (`bg-purple-500/10 text-purple-400 border-purple-500/20`)

### 1.3 `Modal` (`components/ui/modal.tsx`)
Accessible dialogue overlay supporting keyboard ESC dismissal, focus trapping, backdrop blur, and custom action footers (used for Clinician Overrides and confirmation dialogs).

### 1.4 `Table` (`components/ui/table.tsx`)
Paginated, sortable clinical data table with responsive horizontal scrolling, sticky header rows, and empty/loading state slots.

### 1.5 `Card` (`components/ui/card.tsx`)
Glassmorphism cards with subtle border highlights (`border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md`).

### 1.6 `Chart` (`components/ui/chart.tsx`)
Responsive SVG charts visualizing risk distributions, 24-hour prediction activity, and latency trends.
