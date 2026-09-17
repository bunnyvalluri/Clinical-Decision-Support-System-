# HealthNova AI — Responsive Design & Mobile Ergonomics

HealthNova AI supports clinical workflows across three primary form factors:
- **Mobile (Smartphones, 320px – 640px):** Point-of-care triage, nurse bed visits, emergency alert acknowledgment, patient mobile portal.
- **Tablet (iPads, Surface Tablets, 641px – 1024px):** Physician rounds, bedside charts, medical whiteboard discussions.
- **Desktop (Workstations, 1025px – 1920px+):** High-density informatics, MLOps monitoring, patient census management.

---

## 1. Apple Human Interface Guidelines (HIG) Touch Standard

- **Minimum Touch Target:** Interactive components maintain a minimum physical target size of **44x44px** via the `.touch-target` class and standard button heights (`h-9`, `h-10`, `h-11`).
- **Safe Area Insets:** Dynamic safe area padding (`pt-safe`, `pb-safe`, `pl-safe`, `pr-safe`) ensures content is not obscured by camera notches or home indicators on modern mobile devices.

---

## 2. Navigation Adaptations

| Element | Mobile (< 768px) | Tablet / Desktop (>= 768px) |
|---|---|---|
| **Primary Sidebar** | Hidden by default; opened via Radix `Sheet` drawer | Persistent, fixed-width `w-72` sidebar |
| **Quick Actions** | Floating bottom bar (`MobileFloatingNavigation`) | Header action bar & Command palette |
| **Search** | Integrated inside mobile command drawer | Fixed search input in top header (Cmd+K) |
| **Breadcrumbs** | Automatically collapsed to current page | Full hierarchical trail with root link |

---

## 3. Responsive Tables & Data Density

- **Desktop:** Full tabular layout using `Table`, `TableHeader`, `TableRow`, `TableCell`.
- **Mobile:** Wide medical data tables provide smooth horizontal scrolling with snap indicators (`.snap-x-mandatory`) or convert to `PatientSummaryCard` / `VitalSignCard` list representations to prevent horizontal layout breakages.

---

## 4. Typography Scale

Fluid headings scale automatically with viewport width:

- `.fluid-h1`: `clamp(1.5rem, 3.5vw + 0.5rem, 2.5rem)`
- `.fluid-h2`: `clamp(1.25rem, 2.5vw + 0.5rem, 1.875rem)`
- `.fluid-h3`: `clamp(1.125rem, 1.5vw + 0.5rem, 1.5rem)`
- `.tabular-nums`: Used for all clinical measurements, timestamps, and percentages to prevent layout jitter.
