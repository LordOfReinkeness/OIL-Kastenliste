# Beer Tracker — Frontend Styling Guide
Inspired by the HTWG Konstanz main site. Clean, modern, institutional.

---

## Colors

| Role             | Name      | Hex       | RGB                  |
|------------------|-----------|-----------|----------------------|
| Background       | White     | `#ffffff` | `rgb(255, 255, 255)` |
| Primary text     | Black     | `#000000` | `rgb(0, 0, 0)`       |
| Accent / CTA     | HTWG Teal | `#009B91` | `rgb(0, 155, 145)`   |
| Dark surface     | Slate     | `#334152` | `rgb(51, 65, 82)`    |
| Light surface    | Ice Blue  | `#D9E5EC` | `rgb(217, 229, 236)` |
| Border / divider | Mid Gray  | `#9097A0` | `rgb(144, 151, 160)` |
| Subtle text      | Soft Gray | `#808080` | `rgb(128, 128, 128)` |

**Usage rules:**
- White is the only page background
- Black for all headings and body text
- Teal exclusively for primary buttons, active states, and key interactive elements
- Ice Blue for info panels, cards, or subtle section backgrounds
- Slate for footer or dark header variants
- No additional colors — this palette is intentionally minimal

---

## Typography

**Font stack:** `swis721, Helvetica, Arial, sans-serif`

"swis721" is a proprietary font used by HTWG. Fall back gracefully to Helvetica or Arial — the look holds well. You can approximate it with `Inter` or `Helvetica Neue` as a web-safe alternative if you want something freely available.

### Type scale

| Element       | Size   | Weight | Line height    |
|---------------|--------|--------|----------------|
| H1            | `48px` | `700`  | `1.1`          |
| H2            | `36px` | `700`  | `1.2`          |
| H3            | `24px` | `700`  | `1.3`          |
| Body          | `16px` | `400`  | `26px (1.625)` |
| Small / label | `14px` | `400`  | `1.5`          |
| Large body    | `18px` | `400`  | `1.6`          |

### Text rules
- All headings are bold (700), black, left-aligned
- No italic in the UI — use weight and size to create hierarchy
- Links are black by default, no underline. Use teal on hover or for inline action links
- Letter spacing on headings: slightly tight, around `-0.02em`

---

## Spacing

The HTWG site uses generous whitespace. Adopt an 8px base grid.

| Token        | Value  | Use                         |
|--------------|--------|-----------------------------|
| `spacing-xs` | `8px`  | Internal padding, icon gaps |
| `spacing-sm` | `16px` | Component padding           |
| `spacing-md` | `24px` | Between related elements    |
| `spacing-lg` | `48px` | Between sections            |
| `spacing-xl` | `80px` | Hero / page top padding     |

---

## Layout

- Max content width: `1100px`, centered with `margin: 0 auto`
- Page padding: `0 24px` on mobile, `0 48px` on desktop
- Two-column grid for content sections (50/50 or 60/40)
- Full-width images used as section dividers
- No card shadows — use background color (`#D9E5EC`) or a `1px` border to define surfaces

---

## Components

### Buttons

**Primary**
- Background: `#009B91`
- Text: `#ffffff`, 16px, weight 600
- Padding: `12px 24px`
- Border radius: `0px` — sharp corners, no rounding (matches HTWG style)
- No border
- Hover: darken teal slightly, e.g. `#007d75`

**Secondary / Ghost**
- Background: transparent
- Border: `1px solid #000000`
- Text: `#000000`
- Hover: background `#000000`, text `#ffffff`

**Destructive**
- Background: `#000000`
- Text: `#ffffff`
- Use sparingly — only for delete/remove actions

### Inputs

- Border: `1px solid #9097A0`
- Border radius: `0px`
- Padding: `12px 16px`
- Font size: `16px`
- Focus: border color switches to `#000000`, no glow/shadow
- Error state: border `#000000`, small error text below in `14px`

### Navigation / Header

- Background: `#ffffff`
- Bottom border: `1px solid #000000`
- Links: `#000000`, no underline, `16px`
- Active link: underline with `2px solid #000000`
- Height: `64px`

### Dividers

- `1px solid #9097A0` for subtle dividers between sections
- Or a full-width `#D9E5EC` background block as a section break

### Info / Notice panels

- Background: `#D9E5EC`
- Left border: `4px solid #009B91`
- Padding: `16px 20px`
- No border radius

---

## CSS Custom Properties (suggested root setup)

```css
:root {
  --color-bg: #ffffff;
  --color-text: #000000;
  --color-accent: #009B91;
  --color-accent-dark: #007d75;
  --color-slate: #334152;
  --color-surface: #D9E5EC;
  --color-border: #9097A0;
  --color-muted: #808080;

  --font-family: swis721, Helvetica, Arial, sans-serif;

  --text-xs: 14px;
  --text-sm: 16px;
  --text-md: 18px;
  --text-h3: 24px;
  --text-h2: 36px;
  --text-h1: 48px;

  --radius: 0px;

  --spacing-xs: 8px;
  --spacing-sm: 16px;
  --spacing-md: 24px;
  --spacing-lg: 48px;
  --spacing-xl: 80px;

  --max-width: 1100px;
}
```

---

## General Design Rules

- **No border radius anywhere** — sharp corners throughout, consistent with HTWG
- **No drop shadows** — use borders and background color to define depth
- **No gradients** — flat color only
- **No decorative icons** in body text — only functional icons (e.g., status indicators)
- **Monochrome first** — default UI is black/white. Teal is reserved for the one thing you want the user to do on each page
- **Dense but breathable** — don't over-pad cards, but give sections room to breathe