---
name: design
description: Apply the project's grayscale design system when building or modifying UI
---

# Design System Reference

When building or modifying UI, follow these standards. The design is **modern, minimal, and grayscale-only** with full dark mode support.

**Visual Reference**: See `/src/app/design-demo/page.tsx` for live examples.

---

## Font

**TASA Orbiter** from Google Fonts. Already imported in the project.

```tsx
style={{ fontFamily: "'TASA Orbiter', sans-serif" }}
```

---

## Color Palette

### Light Mode

| Use Case | Class |
|----------|-------|
| Page background | `bg-[#fcfcfd]` |
| Card/surface | `bg-white` |
| Hover state / Alerts | `bg-gray-100` |
| Info boxes | `bg-gray-50` |
| Borders (cards) | `border-gray-200` |
| Borders (inputs) | `border-gray-300` |
| Primary text | `text-gray-900` |
| Secondary text | `text-gray-600` |
| Muted text | `text-gray-500` |
| Labels | `text-gray-700` |
| Primary button bg | `bg-gray-900` |
| Skeleton/loading | `bg-gray-200` |

### Dark Mode

| Use Case | Class |
|----------|-------|
| Page background | `bg-gray-950` |
| Card/surface | `bg-gray-950` |
| Card borders | `border-gray-700` |
| Hover state / Alerts | `bg-gray-800` |
| Input background | `bg-gray-800` |
| Input borders | `border-gray-700` |
| Primary text | `text-white` |
| Secondary text | `text-gray-400` |
| Muted text | `text-gray-500` |
| Labels | `text-gray-300` |
| Primary button | `bg-white text-gray-900` |
| Skeleton/loading | `bg-gray-700` |

---

## Typography

| Level | Classes |
|-------|---------|
| H1 | `text-2xl font-bold` |
| H2 | `text-xl font-semibold` |
| H3 | `text-lg font-medium` |
| Body | `text-base` |
| Body secondary | `text-base text-gray-600` / `text-gray-400` (dark) |
| Small | `text-sm text-gray-600` / `text-gray-400` (dark) |
| Label | `text-sm font-medium text-gray-700` / `text-gray-300` (dark) |
| Tiny | `text-xs text-gray-500` |

---

## Border Radius

**Only 2 main values:**

| Token | Tailwind | Use |
|-------|----------|-----|
| Standard | `rounded-2xl` | Inputs, cards, modals, containers |
| Pill | `rounded-full` | Buttons, badges, progress bars |
| Soft | `rounded-3xl` | Alerts/feedback states |

**Never use**: `rounded-lg`, `rounded-xl`, `rounded-md`, `rounded-sm`

---

## Buttons

All buttons: `rounded-full font-medium transition-colors`

### Primary Button

```tsx
// Light
className="px-5 py-2.5 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"

// Dark
className="px-5 py-2.5 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-colors"
```

### Secondary Button

```tsx
// Light
className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"

// Dark
className="px-5 py-2.5 border border-gray-600 text-gray-300 rounded-full font-medium hover:bg-gray-800 transition-colors"
```

### Ghost Button

```tsx
// Light
className="px-4 py-2 text-gray-600 rounded-full font-medium hover:text-gray-900 hover:bg-gray-100 transition-colors"

// Dark
className="px-4 py-2 text-gray-400 rounded-full font-medium hover:text-white hover:bg-gray-800 transition-colors"
```

### Icon Button

```tsx
// Light
className="p-2 text-gray-400 rounded-full hover:text-gray-600 hover:bg-gray-100 transition-colors"

// Dark
className="p-2 text-gray-500 rounded-full hover:text-gray-300 hover:bg-gray-800 transition-colors"
```

### Button Sizes

| Size | Padding |
|------|---------|
| Small | `px-4 py-2 text-sm` |
| Medium | `px-5 py-2.5` |
| Large | `px-6 py-3` |

### Disabled State

Add `opacity-50 cursor-not-allowed`

---

## Input Components

All inputs: `rounded-2xl`

### Text Input

```tsx
// Light
className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl text-base bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent transition-shadow"

// Dark
className="w-full px-4 py-2.5 border border-gray-700 rounded-2xl text-base bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent transition-shadow"
```

### Label

```tsx
// Light
className="block text-sm font-medium text-gray-700 mb-1.5"

// Dark
className="block text-sm font-medium text-gray-300 mb-1.5"
```

### Helper Text

```tsx
className="text-sm text-gray-500 mt-1.5"
```

### Select

Same as text input, add `cursor-pointer`

### Textarea

Same as text input, add `resize-none`

### Checkbox

```tsx
// Light
className="h-4 w-4 rounded border-gray-300 accent-gray-900 focus:ring-gray-600 cursor-pointer"

// Dark
className="h-4 w-4 rounded border-gray-300 accent-white focus:ring-gray-600 cursor-pointer"
```

### Date Input

```tsx
// Light
className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl text-base bg-white text-gray-900 cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent transition-shadow"

// Dark - add [color-scheme:dark] for dark calendar popup
className="w-full px-4 py-2.5 border border-gray-700 rounded-2xl text-base bg-gray-800 text-white cursor-pointer [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent transition-shadow"
```

### Error State

Use `border-2` with `border-gray-900` (light) or `border-white` (dark)

---

## Cards

### Standard Card

```tsx
// Light
className="bg-white rounded-2xl border border-gray-200 p-6"

// Dark
className="bg-gray-950 rounded-2xl border border-gray-700 p-6"
```

### Elevated Card (modals, dropdowns)

```tsx
// Light
className="bg-white rounded-2xl border border-gray-200 shadow-md p-6"

// Dark
className="bg-gray-950 rounded-2xl border border-gray-700 shadow-md p-6"
```

### Info Box

```tsx
// Light
className="bg-gray-50 rounded-3xl p-4"

// Dark
className="bg-gray-800 rounded-3xl p-4"
```

---

## Progress Bar

Height: `h-4` (16px)

```tsx
// Container - Light
className="h-4 bg-gray-200 rounded-full overflow-hidden"

// Container - Dark
className="h-4 bg-gray-700 rounded-full overflow-hidden"

// Fill - Light
className="h-full bg-gray-900 rounded-full flex items-center justify-end pr-2 transition-all"

// Fill - Dark
className="h-full bg-gray-300 rounded-full flex items-center justify-end pr-2 transition-all"

// Number inside fill - Light
className="text-white text-xs font-medium"

// Number inside fill - Dark
className="text-gray-900 text-xs font-medium"
```

Label format (below bar, right-aligned):
```tsx
<div className="flex justify-end mt-1 text-xs text-gray-500">
  <span>65 available</span>
</div>
```

---

## Alerts / Feedback States

All alerts: `rounded-3xl`

### Success / Warning

```tsx
// Light
className="bg-gray-100 border border-gray-200 rounded-3xl p-4 flex items-start gap-3"
// Icon: text-gray-700, Text: text-gray-700

// Dark
className="bg-gray-800 border border-gray-700 rounded-3xl p-4 flex items-start gap-3"
// Icon: text-gray-300, Text: text-gray-300
```

### Error

```tsx
// Light
className="bg-gray-100 border border-gray-300 rounded-3xl p-4 flex items-start gap-3"
// Icon: text-gray-900, Text: text-gray-900

// Dark
className="bg-gray-800 border border-gray-600 rounded-3xl p-4 flex items-start gap-3"
// Icon: text-white, Text: text-white
```

### Info

```tsx
// Light
className="bg-gray-50 border border-gray-200 rounded-3xl p-4"
// Text: text-gray-600

// Dark
className="bg-gray-800/50 border border-gray-700 rounded-3xl p-4"
// Text: text-gray-400
```

---

## Loading States

### Spinner

```tsx
// Large - Light
className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full"

// Large - Dark
className="animate-spin w-8 h-8 border-4 border-gray-700 border-t-white rounded-full"

// Small - Light
className="animate-spin w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full"

// Small - Dark
className="animate-spin w-5 h-5 border-2 border-gray-700 border-t-white rounded-full"
```

### Skeleton

```tsx
// Light
className="h-4 bg-gray-200 rounded-full animate-pulse"

// Dark
className="h-4 bg-gray-700 rounded-full animate-pulse"
```

---

## Tables

```tsx
// Header row
// Light: border-b border-gray-200
// Dark: border-b border-gray-700

// Header cell
// Light: text-gray-600 font-medium
// Dark: text-gray-400 font-medium

// Body row
// Light: border-b border-gray-100 hover:bg-gray-50
// Dark: border-b border-gray-800 hover:bg-gray-800

// Primary cell text
// Light: text-gray-900
// Dark: text-white

// Secondary cell text
// Light: text-gray-600
// Dark: text-gray-400
```

---

## Badges

All badges: `rounded-full inline-flex items-center text-xs px-2.5 py-1`

| Type | Light | Dark |
|------|-------|------|
| Primary | `bg-gray-900 text-white` | `bg-white text-gray-900` |
| Default | `bg-gray-100 text-gray-700` | `bg-gray-700 text-gray-300` |
| Muted | `bg-gray-200 text-gray-900` | `bg-gray-600 text-white` |

---

## Focus States

```tsx
// Inputs
focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent

// Buttons (add offset)
focus:ring-offset-2
// Dark mode also add: focus:ring-offset-gray-900
```

---

## Spacing System

| Element | Value |
|---------|-------|
| Card padding | `p-6` |
| Form field gap | `space-y-5` |
| Button gap | `gap-3` |
| Label to input | `mb-1.5` |
| Helper text | `mt-1.5` |
| Section spacing | `space-y-12` |
| Max width (forms) | `max-w-md` or `max-w-lg` |
| Max width (dashboards) | `max-w-4xl` or `max-w-6xl` |
| Page padding | `p-8` |

---

## Dark Mode Pattern

```tsx
const [darkMode, setDarkMode] = useState(false);

// Main container
className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-[#fcfcfd]'}`}

// Toggle button
<button
  onClick={() => setDarkMode(!darkMode)}
  className={darkMode
    ? 'bg-white text-gray-900 hover:bg-gray-100'
    : 'bg-gray-900 text-white hover:bg-gray-800'
  }
>
  {darkMode ? 'Light' : 'Dark'}
</button>
```

---

## Icons

Use inline SVGs from Heroicons. Standard size: `w-5 h-5`

---

## Quick Checklist

When building UI, verify:

- [ ] Using `rounded-2xl` for containers, `rounded-full` for buttons/badges
- [ ] No accent colors (no blue, green, red for primary UI)
- [ ] Both light and dark mode styles provided
- [ ] Font is TASA Orbiter
- [ ] Consistent spacing (p-6 cards, space-y-5 forms)
- [ ] Focus states included on interactive elements
