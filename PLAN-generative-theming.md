# Phase 1: Generative Deck Theming — Implementation Plan

## Goal

Validate that LLM-generated per-deck color themes based on deck name/topic look good and feel right. Convert ALL primary/chrome colors app-wide so there's no patchwork.

## Theme Schema

12 color tokens, no typography or layout tokens.

| Token           | CSS Variable              | Default     | Replaces                    | Purpose                              |
|-----------------|---------------------------|-------------|-----------------------------|---------------------------------------|
| `primary`       | `--color-primary`         | `#4f46e5`   | `indigo-600`                | Action buttons, logo, links, focus rings |
| `primaryHover`  | `--color-primary-hover`   | `#4338ca`   | `indigo-700`/`indigo-800`   | Hover/active on primary elements      |
| `accent`        | `--color-accent`          | `#d97706`   | `amber-600`                 | Highlights (e.g. "due" badge)         |
| `page`          | `--color-page`            | `#f9fafb`   | `gray-50`                   | Page background                       |
| `surface`       | `--color-surface`         | `#ffffff`   | `white`                     | Cards, header, modals                 |
| `surfaceHover`  | `--color-surface-hover`   | `#f3f4f6`   | `gray-100`                  | Hover on cards, secondary button bg   |
| `surfaceActive` | `--color-surface-active`  | `#e5e7eb`   | `gray-200`                  | Active on secondary buttons, progress bar bg |
| `body`          | `--color-body`            | `#111827`   | `gray-900`                  | Primary text, headings                |
| `secondary`     | `--color-secondary`       | `#6b7280`   | `gray-500`/`600`/`700`      | Secondary text, form labels, nav links |
| `tertiary`      | `--color-tertiary`        | `#9ca3af`   | `gray-400`                  | Muted text, icons, hints              |
| `onPrimary`     | `--color-on-primary`      | `#ffffff`   | `white` (on indigo bg)      | Text rendered on primary-colored bg   |
| `border`        | `--color-border`          | `#e5e7eb`   | `gray-200`                  | Card/header borders                   |

**Explicitly NOT themed (semantic colors stay fixed):**
- Rating buttons: Again=red, Hard=orange, Good=green, Easy=blue
- Card state badges: New=blue, Learning=orange, Review=green, Relearning=red
- Delete/danger buttons: red
- Stats page category colors (sky, amber, emerald, teal, etc.) — except indigo stats which use `primary`
- These colors carry meaning independent of the deck topic

## Files to Create

### 1. `src/lib/theme.ts`

**Purpose:** Theme type definition, apply/reset functions, response validation, localStorage cache.

```typescript
export interface DeckTheme {
  colors: {
    primary: string
    primaryHover: string
    accent: string
    page: string
    surface: string
    surfaceHover: string
    surfaceActive: string
    body: string
    secondary: string
    tertiary: string
    onPrimary: string
    border: string
  }
}

const COLOR_VAR_MAP: Record<keyof DeckTheme['colors'], string> = {
  primary: '--color-primary',
  primaryHover: '--color-primary-hover',
  accent: '--color-accent',
  page: '--color-page',
  surface: '--color-surface',
  surfaceHover: '--color-surface-hover',
  surfaceActive: '--color-surface-active',
  body: '--color-body',
  secondary: '--color-secondary',
  tertiary: '--color-tertiary',
  onPrimary: '--color-on-primary',
  border: '--color-border',
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/

/** Validate that an API response has the expected shape and all values are hex colors. */
export function isValidTheme(obj: unknown): obj is DeckTheme {
  if (!obj || typeof obj !== 'object') return false
  const theme = obj as Record<string, unknown>
  if (!theme.colors || typeof theme.colors !== 'object') return false
  const colors = theme.colors as Record<string, unknown>
  return Object.keys(COLOR_VAR_MAP).every(
    (key) => typeof colors[key] === 'string' && HEX_RE.test(colors[key] as string)
  )
}

export function applyTheme(theme: DeckTheme): void {
  const root = document.documentElement
  // Add transition class for smooth theme swap
  root.classList.add('theme-transition')
  for (const [key, cssVar] of Object.entries(COLOR_VAR_MAP)) {
    root.style.setProperty(cssVar, theme.colors[key as keyof DeckTheme['colors']])
  }
  // Remove transition class after animation completes
  setTimeout(() => root.classList.remove('theme-transition'), 300)
}

export function resetTheme(): void {
  const root = document.documentElement
  root.classList.add('theme-transition')
  for (const cssVar of Object.values(COLOR_VAR_MAP)) {
    root.style.removeProperty(cssVar)
  }
  setTimeout(() => root.classList.remove('theme-transition'), 300)
}

// localStorage cache
const CACHE_KEY = 'deck-themes'
const CACHE_VERSION = 1
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days
const MAX_ENTRIES = 50

function normalizeKey(deckName: string): string {
  return deckName.toLowerCase().trim().replace(/\s+/g, '-')
}

interface CacheEntry {
  theme: DeckTheme
  timestamp: number
  version: number
}

export function getCachedTheme(deckName: string): DeckTheme | null {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as Record<string, CacheEntry>
    const entry = cache[normalizeKey(deckName)]
    if (entry && entry.version === CACHE_VERSION && Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.theme
    }
  } catch { /* ignore */ }
  return null
}

export function setCachedTheme(deckName: string, theme: DeckTheme): void {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as Record<string, CacheEntry>
    cache[normalizeKey(deckName)] = { theme, timestamp: Date.now(), version: CACHE_VERSION }
    // Evict oldest entries if over max
    const entries = Object.entries(cache)
    if (entries.length > MAX_ENTRIES) {
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      const evictCount = entries.length - MAX_ENTRIES
      for (let i = 0; i < evictCount; i++) delete cache[entries[i][0]]
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch { /* storage full, ignore */ }
}
```

### 2. `src/hooks/useDeckTheme.ts`

**Purpose:** Hook that manages theme lifecycle — apply on mount, reset on unmount. Uses AbortController to cancel in-flight requests.

```typescript
import { useEffect, useState } from 'react'
import { applyTheme, resetTheme, getCachedTheme, setCachedTheme, isValidTheme } from '../lib/theme'
import { apiFetch } from '../services/api'
import type { DeckTheme } from '../lib/theme'

export function useDeckTheme(deckName: string | undefined) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!deckName) return

    const cached = getCachedTheme(deckName)
    if (cached) {
      applyTheme(cached)
      return () => resetTheme()
    }

    // Cache miss — fetch from API
    const controller = new AbortController()
    setIsGenerating(true)
    setError(null)

    apiFetch<DeckTheme>('/api/generate-theme', {
      method: 'POST',
      body: JSON.stringify({ topic: deckName }),
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted) return
        if (!isValidTheme(data)) {
          setError('Invalid theme received')
          return
        }
        applyTheme(data)
        setCachedTheme(deckName, data)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Theme generation failed:', err)
          setError('Failed to generate theme')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsGenerating(false)
      })

    return () => {
      controller.abort()
      resetTheme()
    }
  }, [deckName])

  return { isGenerating, error }
}
```

### 3. `functions/api/generate-theme.ts`

**Purpose:** Cloudflare Pages Function that calls Claude API with structured outputs for guaranteed-valid JSON.

- Uses `fetch()` directly to call `https://api.anthropic.com/v1/messages`
- Uses `output_config.format` with `type: "json_schema"` (GA, no beta headers needed)
- All color properties use `pattern: "^#[0-9a-fA-F]{6}$"` for hex validation
- All objects use `additionalProperties: false` (required by structured outputs)
- Response comes in `content[0].text` as valid JSON — just `JSON.parse()` it
- Model: `claude-sonnet-4-5-20250514` (fast, cheap, reliable for structured output)
- Exports `onRequestPost` (not `onRequest`) matching existing function conventions
- No new npm dependencies required (raw `fetch` to Anthropic API)

**API call shape:**
```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': context.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Generate a visual theme for studying: "${topic}"` }],
    output_config: {
      format: {
        type: 'json_schema',
        schema: THEME_JSON_SCHEMA,
      },
    },
  }),
})
const data = await response.json()
const theme = JSON.parse(data.content[0].text)
return Response.json(theme)
```

**System prompt** includes:
- WCAG AA contrast guidance (4.5:1 for `body` on `page`, `onPrimary` on `primary`)
- Subject-to-color mapping heuristics (cool for science, warm for humanities, etc.)
- Instruction to produce bold, cohesive palettes (not timid/muted)
- Explicit relationship rules (`primaryHover` must be darker than `primary`, `surfaceHover` must be between `surface` and `surfaceActive`, etc.)

**Response shape** (must match `DeckTheme` interface exactly):
```json
{
  "colors": {
    "primary": "#...",
    "primaryHover": "#...",
    "accent": "#...",
    "page": "#...",
    "surface": "#...",
    "surfaceHover": "#...",
    "surfaceActive": "#...",
    "body": "#...",
    "secondary": "#...",
    "tertiary": "#...",
    "onPrimary": "#...",
    "border": "#..."
  }
}
```

**Auth:** Inherits existing `_middleware.ts` Bearer token check. Requires new `ANTHROPIC_API_KEY` env var in Cloudflare dashboard.

## Files to Modify — Complete List

### CSS & Config

#### 4. `src/index.css`

Add Tailwind v4 `@theme` block with default token values. Add scoped transition class (NOT `*` selector).

```css
@import "tailwindcss";

@theme {
  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-accent: #d97706;
  --color-page: #f9fafb;
  --color-surface: #ffffff;
  --color-surface-hover: #f3f4f6;
  --color-surface-active: #e5e7eb;
  --color-body: #111827;
  --color-secondary: #6b7280;
  --color-tertiary: #9ca3af;
  --color-on-primary: #ffffff;
  --color-border: #e5e7eb;
}

/* Scoped transition — applied temporarily during theme swaps only */
.theme-transition,
.theme-transition *,
.theme-transition *::before,
.theme-transition *::after {
  transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease !important;
}
/* Exclude flip-card from theme transitions to avoid interfering with 3D transform */
.theme-transition .flip-card-inner {
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
```

This produces Tailwind utilities: `bg-primary`, `text-primary`, `bg-page`, `bg-surface`, `text-body`, `text-secondary`, `border-border`, etc.

#### 5. `functions/types.ts`

Add `ANTHROPIC_API_KEY: string` to the `Env` interface.

### Layout Shell

#### 6. `src/components/layout/Layout.tsx`

| Old | New |
|-----|-----|
| `bg-gray-50` | `bg-page` |

#### 7. `src/components/layout/Header.tsx`

| Old | New |
|-----|-----|
| `bg-white` | `bg-surface` |
| `border-gray-200` | `border-border` |
| `text-indigo-600` (logo) | `text-primary` |
| `text-gray-600` (nav links) | `text-secondary` |
| `hover:text-indigo-600` | `hover:text-primary` |
| `active:text-indigo-600` | `active:text-primary` |

### Pages

#### 8. `src/pages/DeckDetailPage.tsx`

- Add `useDeckTheme(deck?.name)` hook call
- Show "Generating theme..." indicator when `isGenerating` is true

| Old | New |
|-----|-----|
| `text-gray-500` (loading, description, counts) | `text-secondary` |
| `text-gray-900` (headings) | `text-body` |
| `text-indigo-600` / `hover:text-indigo-800` (links) | `text-primary` / `hover:text-primary-hover` |
| `bg-indigo-600` (Study, Add Card buttons) | `bg-primary` |
| `hover:bg-indigo-700` / `active:bg-indigo-700` | `hover:bg-primary-hover` / `active:bg-primary-hover` |
| `text-white` (on primary buttons) | `text-on-primary` |
| `bg-gray-100` (Edit Deck, Import buttons) | `bg-surface-hover` |
| `hover:bg-gray-200` / `active:bg-gray-200` | `hover:bg-surface-active` / `active:bg-surface-active` |
| `text-gray-700` (secondary button text) | `text-secondary` |
| `hover:text-gray-700` / `active:text-gray-700` | `hover:text-body` / `active:text-body` |

Keep delete button red (semantic).

#### 9. `src/pages/DashboardPage.tsx`

| Old | New |
|-----|-----|
| `text-gray-900` (heading) | `text-body` |
| `text-gray-500` (loading, empty) | `text-secondary` |
| `bg-indigo-600` (New Deck button) | `bg-primary` |
| `hover:bg-indigo-700` / `active:bg-indigo-700` | `hover:bg-primary-hover` / `active:bg-primary-hover` |
| `text-white` (button text) | `text-on-primary` |

#### 10. `src/pages/StudyPage.tsx`

- Add `useDeckTheme(deck?.name)` — **prevents theme flash** when navigating from DeckDetail → Study

| Old | New |
|-----|-----|
| `text-gray-500` (loading, messages) | `text-secondary` |
| `text-gray-900` (heading) | `text-body` |
| `text-indigo-600` / `hover:text-indigo-800` (back link) | `text-primary` / `hover:text-primary-hover` |
| `bg-indigo-600` (back to deck button) | `bg-primary` |
| `hover:bg-indigo-700` / `active:bg-indigo-700` | `hover:bg-primary-hover` / `active:bg-primary-hover` |

#### 11. `src/pages/StatsPage.tsx`

| Old | New |
|-----|-----|
| `text-gray-900` (heading, table cells) | `text-body` |
| `text-gray-700` (section headings) | `text-secondary` |
| `text-gray-500` (loading, error) | `text-secondary` |
| `bg-gray-50` (stat card backgrounds) | `bg-page` |
| `bg-indigo-50 text-indigo-600` (Reviews stat) | `bg-primary/10 text-primary` (or keep indigo) |

Other stat category colors (sky, amber, emerald, etc.) stay fixed — they're semantic per category.

### Components — Deck

#### 12. `src/components/deck/DeckCard.tsx`

| Old | New |
|-----|-----|
| `bg-white` | `bg-surface` |
| `border-gray-200` | `border-border` |
| `text-gray-900` (deck name) | `text-body` |
| `text-gray-500` (description, count) | `text-secondary` |
| `text-gray-400` (icon buttons) | `text-tertiary` |
| `hover:text-gray-600` (edit button) | `hover:text-secondary` |
| `active:bg-gray-100` (icon active) | `active:bg-surface-hover` |
| `text-indigo-600` (Study link) | `text-primary` |
| `hover:text-indigo-800` / `active:text-indigo-800` | `hover:text-primary-hover` / `active:text-primary-hover` |

#### 13. `src/components/deck/DeckFormModal.tsx`

| Old | New |
|-----|-----|
| `text-gray-700` (form labels) | `text-secondary` |
| `focus:ring-indigo-500` / `focus:border-indigo-500` | `focus:ring-primary` / `focus:border-primary` |
| `bg-indigo-600` (submit button) | `bg-primary` |
| `hover:bg-indigo-700` / `active:bg-indigo-700` | `hover:bg-primary-hover` / `active:bg-primary-hover` |
| `text-white` (submit button text) | `text-on-primary` |
| `bg-gray-100` (cancel button) | `bg-surface-hover` |
| `hover:bg-gray-200` / `active:bg-gray-200` | `hover:bg-surface-active` / `active:bg-surface-active` |
| `text-gray-700` (cancel button text) | `text-secondary` |

### Components — Card

#### 14. `src/components/card/CardFormModal.tsx`

| Old | New |
|-----|-----|
| `text-gray-700` (form labels) | `text-secondary` |
| `focus:ring-indigo-500` / `focus:border-indigo-500` | `focus:ring-primary` / `focus:border-primary` |
| `bg-indigo-600` (submit button) | `bg-primary` |
| `hover:bg-indigo-700` / `active:bg-indigo-700` | `hover:bg-primary-hover` / `active:bg-primary-hover` |
| `text-white` (submit text) | `text-on-primary` |
| `bg-gray-100` (cancel button) | `bg-surface-hover` |
| `hover:bg-gray-200` / `active:bg-gray-200` | `hover:bg-surface-active` / `active:bg-surface-active` |

#### 15. `src/components/card/CardItem.tsx`

| Old | New |
|-----|-----|
| `bg-white` | `bg-surface` |
| `border-gray-200` | `border-border` |
| `text-gray-900` (front text) | `text-body` |
| `text-gray-500` (back text) | `text-secondary` |
| `text-gray-400` (edit/delete icons) | `text-tertiary` |
| `hover:text-gray-600` (edit icon hover) | `hover:text-secondary` |
| `active:bg-gray-100` (icon active) | `active:bg-surface-hover` |

Keep delete icon `hover:text-red-500` / `active:bg-red-50` (semantic).
Keep state badge colors (New=blue, Learning=orange, etc.) fixed.

#### 16. `src/components/card/BulkImportModal.tsx`

| Old | New |
|-----|-----|
| `text-gray-700` (labels, preview heading) | `text-secondary` |
| `text-gray-600` (delimiter label, table headers) | `text-secondary` |
| `focus:ring-indigo-500` / `focus:border-indigo-500` | `focus:ring-primary` / `focus:border-primary` |
| `bg-indigo-100 text-indigo-700` (active delimiter) | `bg-primary/20 text-primary` |
| `bg-gray-100` (inactive delimiter, cancel button) | `bg-surface-hover` |
| `hover:bg-gray-200` / `active:bg-gray-200` | `hover:bg-surface-active` / `active:bg-surface-active` |
| `bg-indigo-600` (submit button) | `bg-primary` |
| `hover:bg-indigo-700` / `active:bg-indigo-700` | `hover:bg-primary-hover` / `active:bg-primary-hover` |
| `bg-gray-50` (table header) | `bg-page` |
| `border-gray-200` (table border) | `border-border` |
| `divide-gray-100` (table rows) | `divide-surface-hover` |

### Components — Study

#### 17. `src/components/study/FlashCard.tsx`

| Old | New |
|-----|-----|
| `bg-white` (front and back) | `bg-surface` |
| `border-gray-200` (front and back) | `border-border` |
| `text-gray-900` (card text) | `text-body` |
| `text-gray-400` (labels, hints) | `text-tertiary` |

#### 18. `src/components/study/StudySession.tsx`

| Old | New |
|-----|-----|
| `bg-gray-200` (progress bar bg) | `bg-surface-active` |
| `bg-indigo-600` (progress bar fill) | `bg-primary` |
| `text-gray-500` (progress text) | `text-secondary` |
| `hover:bg-gray-50` (undo button hover) | `hover:bg-page` |
| `active:bg-gray-100` (undo button active) | `active:bg-surface-hover` |

Keep rating button colors (RatingButtons.tsx) — semantic, NOT themed.

#### 19. `src/components/study/StudyComplete.tsx`

| Old | New |
|-----|-----|
| `bg-indigo-600` (Dashboard button) | `bg-primary` |
| `hover:bg-indigo-700` / `active:bg-indigo-700` | `hover:bg-primary-hover` / `active:bg-primary-hover` |
| `bg-gray-100` (Back to Deck link) | `bg-surface-hover` |
| `hover:bg-gray-200` / `active:bg-gray-200` | `hover:bg-surface-active` / `active:bg-surface-active` |
| `hover:bg-gray-50` / `active:bg-gray-100` (undo) | `hover:bg-page` / `active:bg-surface-hover` |

### Components — UI

#### 20. `src/components/ui/EmptyState.tsx`

| Old | New |
|-----|-----|
| `text-gray-500` | `text-secondary` |
| `bg-indigo-600` | `bg-primary` |
| `hover:bg-indigo-700` / `active:bg-indigo-700` | `hover:bg-primary-hover` / `active:bg-primary-hover` |
| `text-white` | `text-on-primary` |

#### 21. `src/components/ui/Modal.tsx`

| Old | New |
|-----|-----|
| `text-gray-900` (title) | `text-body` |
| `text-gray-400` (close button) | `text-tertiary` |
| `hover:text-gray-600` / `active:text-gray-600` (close hover) | `hover:text-secondary` / `active:text-secondary` |

#### 22. `src/components/ui/ConfirmDialog.tsx`

| Old | New |
|-----|-----|
| `text-gray-600` (message) | `text-secondary` |
| `bg-gray-100` (cancel button) | `bg-surface-hover` |
| `hover:bg-gray-200` / `active:bg-gray-200` | `hover:bg-surface-active` / `active:bg-surface-active` |
| `text-gray-700` (cancel text) | `text-secondary` |

Keep confirm/delete button red (semantic).

## Theme Lifecycle

1. **DeckDetail / Study pages**: `useDeckTheme(deck?.name)` applies the theme.
2. **All other pages** (Dashboard, Stats): No hook call → no theme applied → defaults from `@theme` block.
3. **Cache hit**: Theme applies instantly from localStorage (< 1ms).
4. **Cache miss**: Default theme shows → POST to `/api/generate-theme` → on response, validate with `isValidTheme()` → if valid, apply with CSS transitions (200ms) → cache in localStorage.
5. **Navigate away**: `useEffect` cleanup calls `resetTheme()` → CSS vars removed → `@theme` defaults take effect → smooth 200ms transition back.
6. **DeckDetail → Study**: Both pages call `useDeckTheme(deck.name)`. The cleanup from DeckDetail fires, but StudyPage immediately re-applies from cache (instant). No flash.
7. **Rapid navigation**: `AbortController.abort()` cancels in-flight fetch. No wasted API calls, no stale theme application.
8. **API failure**: App stays on default theme. `error` state returned from hook, can show subtle indicator.

## What This Does NOT Include (Deferred)

- Typography / Google Fonts loading
- Gradient backgrounds
- Streaming partial theme objects
- Server-side caching (KV, D1, Redis)
- Database schema changes (no `theme` column on decks)
- FOUC prevention script in index.html
- Pre-seeding common topics
- Client-side WCAG contrast validation (system prompt guides the LLM, but no runtime check)
- Rate limiting on generate-theme endpoint

## Deployment Checklist

1. Add `ANTHROPIC_API_KEY` secret in Cloudflare Dashboard (Workers & Pages → Settings → Environment variables)
2. Deploy code changes (push to `master` triggers auto-deploy)
3. Test: Create a deck with a clear topic name (e.g. "Organic Chemistry"), navigate to it, observe theme generation

## Implementation Order

1. `src/index.css` — Add `@theme` tokens + scoped transition class
2. `src/lib/theme.ts` — Type, validation, apply/reset, cache utilities
3. Convert ALL components to theme utility classes (19 files listed above)
4. Verify app still looks identical (all defaults match current colors)
5. `functions/types.ts` — Add ANTHROPIC_API_KEY to Env
6. `functions/api/generate-theme.ts` — API endpoint
7. `src/hooks/useDeckTheme.ts` — Hook with AbortController
8. Wire `useDeckTheme` into `DeckDetailPage` and `StudyPage`
9. Test end-to-end

## File Count Summary

- **3 new files**: `src/lib/theme.ts`, `src/hooks/useDeckTheme.ts`, `functions/api/generate-theme.ts`
- **19 modified files**: `src/index.css`, `functions/types.ts`, + 17 component/page files
- **0 files unchanged**: All `.tsx` files with hardcoded chrome colors are converted
