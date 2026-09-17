# HealthNova AI — Component Inventory & API Reference

This inventory documents all application-owned UI primitives and clinical components built with **shadcn/ui New York** and **Tailwind CSS v4**.

---

## 1. Core UI Primitives (`src/components/ui/`)

### `Button`
- **Location:** `src/components/ui/button.tsx`
- **Underlying Primitive:** Radix Slot (`@radix-ui/react-slot`)
- **Variants:** `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`, `success`
- **Sizes:** `default` (h-9), `sm` (h-8), `lg` (h-10), `icon` (h-9 w-9)
- **Props:** `isLoading?: boolean` (renders animated spinner and disables button), `asChild?: boolean`
- **Accessibility:** Full focus-visible rings (`focus-visible:ring-primary focus-visible:ring-offset-2`).

### `Badge`
- **Location:** `src/components/ui/badge.tsx`
- **Variants:** `default`, `secondary`, `destructive`, `outline`, `success`, `warning`, `info`, `riskLow`, `riskMedium`, `riskHigh`, `riskCritical`
- **Props:** Standard HTML div attributes, `variant`

### `Card` Suite
- **Location:** `src/components/ui/card.tsx`
- **Subcomponents:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- **Styling:** White surface, border `border-border`, subtle shadow `shadow-xs`.

### `Dialog` Suite
- **Location:** `src/components/ui/dialog.tsx`
- **Underlying Primitive:** Radix Dialog (`@radix-ui/react-dialog`)
- **Subcomponents:** `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose`
- **Accessibility:** Built-in focus trap, Esc key listener, WAI-ARIA `dialog` role.

### `AlertDialog` Suite
- **Location:** `src/components/ui/alert-dialog.tsx`
- **Underlying Primitive:** Radix AlertDialog (`@radix-ui/react-alert-dialog`)
- **Purpose:** Destructive administrative actions, model deletion, clinical overrides.

### `Sheet` Suite
- **Location:** `src/components/ui/sheet.tsx`
- **Underlying Primitive:** Radix Dialog (`@radix-ui/react-dialog`)
- **Sides:** `top`, `bottom`, `left`, `right` (default: `right`)
- **Purpose:** Mobile navigation drawer (`side="left"`), slide-over inspectors (`side="right"`).

### `Command` Suite
- **Location:** `src/components/ui/command.tsx`
- **Underlying Primitive:** `cmdk`
- **Subcomponents:** `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandSeparator`
- **Shortcut:** `Cmd+K` / `Ctrl+K` global clinical search palette.

### `Form` Suite
- **Location:** `src/components/ui/form.tsx`
- **Underlying Primitive:** React Hook Form + Radix Label
- **Subcomponents:** `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `useFormField`

### Additional Base Primitives
- `Input` & `Textarea`: Standard text inputs with label/error wrappers.
- `Label`: Radix UI accessible label.
- `Checkbox`: Accessible checkbox with Check icon.
- `RadioGroup`: Accessible radio buttons.
- `Switch`: Accessible toggle control.
- `Select`: Radix UI select with compound primitives + native select fallback.
- `Popover`: Contextual popover card.
- `Tooltip`: Hover/focus tooltips with TooltipProvider.
- `Tabs`: Accessible tab navigation.
- `Accordion`: Collapsible disclosure panels with smooth animation.
- `Separator`: Accessible divider.
- `Skeleton`: Pulsing loading placeholder.
- `Progress`: Measurable progress bar.
- `Table`: Accessible HTML table.
- `Toaster` / `toast`: Light-mode Sonner toast notification.

---

## 2. Clinical Components (`src/components/clinical/`)

### `RiskBadge`
- **Purpose:** Accessible risk stratification display (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **Features:** Displays distinct icon + text label + percentage score to comply with color-blindness guidelines.

### `RiskLevelCard`
- **Purpose:** Patient risk tier card displaying calibrated ML score, model version, and protocol guidance.

### `PatientSummaryCard`
- **Purpose:** Masked patient identifier, age, gender, department, and current risk tier.

### `PatientHeader`
- **Purpose:** Top contextual banner displaying patient MRN, admission status, vitals summary, and clinical action buttons.

### `VitalSignCard`
- **Purpose:** Biometric measurement tiles (HR, BP, SpO2, Temp, Glucose) with reference ranges and out-of-range indicators.

### `ClinicalTimeline`
- **Purpose:** Chronological trajectory of admissions, vitals checks, predictions, clinician reviews, and alerts.

### `PredictionCard`
- **Purpose:** Classical ML prediction result (SVM, Random Forest, AdaBoost) with model version and review state.

### `SHAPExplanation`
- **Purpose:** TreeSHAP feature attributions visualization with positive (risk-elevating) and negative (protective) contribution bars.

### `ClinicalReviewCard`
- **Purpose:** Mandatory physician review panel with clinical rationale notes and sign-off / overrule actions.

### `ClinicalAlert`
- **Purpose:** Persistent high-priority medical alerts with severity badges and acknowledgment lifecycle.

### `ClinicalStatusBadge`
- **Purpose:** Workflow indicators for patient state (`TRIAGED`, `IN_REVIEW`, `ADMITTED`, `DISCHARGED`).

### `ClinicalMetricCard`
- **Purpose:** High-density clinical KPIs with trend direction and delta.

### `EvidenceCard`
- **Purpose:** Peer-reviewed medical guideline and literature citations with evidence levels.

### `AIExplanationCard`
- **Purpose:** Clearly labeled AI natural language explanation card distinguishing AI synthesis from ML prediction.

### `AIReviewPanel`
- **Purpose:** Clinician review workflow allowing live edits and structured rejection reasons logged to the audit trail.
