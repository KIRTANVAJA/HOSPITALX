# HospitalX — Design System Specification

**Version:** 1.0.0  
**Aesthetic:** Clean, futuristic, minimal, medical-grade SaaS  
**Philosophy:** High information density, clear visual hierarchy, accessible contrast ratios, zero gimmicks or rainbow gradients.

---

## 1. Color Palette & Design Tokens

### Primary & Brand Colors
- **Brand Teal Primary:** `#176B68` (Active states, brand anchors, primary action buttons)
- **Brand Teal Hover:** `#125855`
- **Brand Teal Light / Pill Tint:** `#EBF5F5`
- **Brand Teal Border:** `#BCE1DF`

### Neutral & Foundation Colors
- **App Canvas Background:** `#F7F9FB`
- **Surface / Card Background:** `#FFFFFF`
- **Primary Text:** `#17212F`
- **Secondary / Subdued Text:** `#697586`
- **Muted Text / Placeholder:** `#9AA4B2`
- **Structural Border:** `#E4E9EF`
- **Divider / Subtle Surface:** `#F1F5F9`

### Semantic Feedback Tokens
- **Success (Green):**
  - Text: `text-emerald-800`
  - Background: `bg-emerald-50`
  - Border: `border-emerald-200`
- **Warning (Amber):**
  - Text: `text-amber-800`
  - Background: `bg-amber-50`
  - Border: `border-amber-200`
- **Danger / Error (Rose):**
  - Text: `text-rose-800`
  - Background: `bg-rose-50`
  - Border: `border-rose-200`
- **Info (Blue):**
  - Text: `text-blue-800`
  - Background: `bg-blue-50`
  - Border: `border-blue-200`

---

## 2. Typography

- **Font Family:** Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif.
- **Monospace (Identifiers, MRN, Invoices, Timestamps):** ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace.
- **Scale:**
  - `text-2xl` font-bold: Page titles
  - `text-lg` font-bold: Modal and section headers
  - `text-sm` font-medium: Table body cells, standard button labels
  - `text-xs` font-semibold: Table column headers, metadata labels, status badges
  - `text-[11px]` font-bold uppercase: Section groupings, eyebrow labels

---

## 3. UI Component Specifications

### 3.1 Badge (`src/components/portal/Badge.tsx`)
- Rounded pills (`rounded-full`) with border and subtle tinted background.
- Variants: `brand`, `success`, `warning`, `danger`, `info`, `neutral`, `outline`.
- Sizes: `sm` (text-[11px]), `md` (text-xs).

### 3.2 Card (`src/components/portal/Card.tsx`)
- Solid white surface (`#FFFFFF`) with border (`#E4E9EF`) and soft elevation shadow (`shadow-xs`).
- Rounded corners: `rounded-xl`.

### 3.3 Modal (`src/components/portal/Modal.tsx`)
- Centered overlay with backdrop blur (`backdrop-blur-xs`) and dark tinted background (`bg-slate-900/40`).
- Keyboard accessible: closes on `Escape` key, traps focus, restores body scrolling on unmount.
- Max widths: `sm`, `md`, `lg`, `xl`, `2xl`.

### 3.4 Button (`src/components/portal/Button.tsx`)
- Variants: `primary`, `secondary`, `danger`, `ghost`.
- Loading spinner integration without layout shifts.

### 3.5 Empty State (`src/components/portal/EmptyState.tsx`)
- Centered icon in teal circular badge (`#EBF5F5`), concise title, helpful description, and optional primary call to action button.
