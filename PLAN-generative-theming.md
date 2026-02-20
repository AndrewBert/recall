# Phase 1: Generative Deck Theming — Implementation Plan

## Goal

Validate that LLM-generated per-deck color themes based on deck name/topic look good and feel right, with minimal codebase disruption.

## Theme Schema

10 color tokens, no typography or layout tokens.

| Token           | Default (current) | Replaces        | Purpose                            |
|-----------------|-------------------|-----------------|-------------------------------------|
| `primary`       | `#4f46e5`         | `indigo-600`    | Action buttons, logo, links         |
| `primaryHover`  | `#4338ca`         | `indigo-700`    | Hover/active on primary elements    |
| `accent`        | `#d97706`         | `amber-600`     | Highlights (e.g. "due" badge)       |
| `background`    | `#f9fafb`         | `gray-50`       | Page background                     |
| `surface`       | `#ffffff`         | `white`         | Cards, header, modals               |
| `surfaceHover`  | `#f3f4f6`         | `gray-100`      | Hover on cards, secondary buttons   |
| `text`          | `#111827`         | `gray-900`      | Primary text                        |
| `textSecondary` | `#6b7280`         | `gray-500`      | Muted/secondary text                |
| `textOnPrimary` | `#ffffff`         | `white`         | Text rendered on primary-colored bg |
| `border`        | `#e5e7eb`         | `gray-200`      | Card/header borders                 |

**Explicitly NOT themed (semantic colors stay fixed):**
- Rating buttons: Again=red, Hard=orange, Good=green, Easy=blue
- Card state badges: New=blue, Learning=orange, Review=green, Relearning=red
- Delete/danger buttons: red
- These colors carry meaning independent of the deck topic

## Files to Create

### 1. `src/lib/theme.ts`

**Purpose:** Theme type definition, apply/reset functions, localStorage cache.

```typescript
export interface DeckTheme {
  colors: {
    primary: string
    primaryHover: string
    accent: string
    background: string
    surface: string
    surfaceHover: string
    text: string
    textSecondary: string
    textOnPrimary: string
    border: string
  }
}

// Map of DeckTheme color keys → CSS custom property names
const COLOR_VAR_MAP: Record<keyof DeckTheme['colors'], string> = {
  primary: '--color-primary',
  primaryHover: '--color-primary-hover',
  accent: '--color-accent',
  background: '--color-background',
  surface: '--color-surface',
  surfaceHover: '--color-surface-hover',
  text: '--color-text',
  textSecondary: '--color-text-secondary',
  textOnPrimary: '--color-text-on-primary',
  border: '--color-border',
}

export function applyTheme(theme: DeckTheme): void {
  const root = document.documentElement
  for (const [key, cssVar] of Object.entries(COLOR_VAR_MAP)) {
    root.style.setProperty(cssVar, theme.colors[key as keyof DeckTheme['colors']])
  }
}

export function resetTheme(): void {
  const root = document.documentElement
  for (const cssVar of Object.values(COLOR_VAR_MAP)) {
    root.style.removeProperty(cssVar)
  }
}

// localStorage cache
const CACHE_KEY = 'deck-themes'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

function normalizeKey(deckName: string): string {
  return deckName.toLowerCase().trim().replace(/\s+/g, '-')
}

export function getCachedTheme(deckName: string): DeckTheme | null {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
    const entry = cache[normalizeKey(deckName)]
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.theme
  } catch { /* ignore */ }
  return null
}

export function setCachedTheme(deckName: string, theme: DeckTheme): void {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
    cache[normalizeKey(deckName)] = { theme, timestamp: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch { /* storage full, ignore */ }
}
```

### 2. `src/hooks/useDeckTheme.ts`

**Purpose:** Hook that manages theme lifecycle for a deck — apply on mount, reset on unmount.

```typescript
import { useEffect, useState } from 'react'
import { applyTheme, resetTheme, getCachedTheme, setCachedTheme, type DeckTheme } from '../lib/theme'
import { apiFetch } from '../services/api'

export function useDeckTheme(deckName: string | undefined) {
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (!deckName) return

    const cached = getCachedTheme(deckName)
    if (cached) {
      applyTheme(cached)
      return () => resetTheme()
    }

    // Cache miss — fetch from API
    let cancelled = false
    setIsGenerating(true)

    apiFetch<DeckTheme>('/api/generate-theme', {
      method: 'POST',
      body: JSON.stringify({ topic: deckName }),
    })
      .then((theme) => {
        if (!cancelled) {
          applyTheme(theme)
          setCachedTheme(deckName, theme)
        }
      })
      .catch((err) => console.error('Theme generation failed:', err))
      .finally(() => { if (!cancelled) setIsGenerating(false) })

    return () => {
      cancelled = true
      resetTheme()
    }
  }, [deckName])

  return { isGenerating }
}
```

### 3. `functions/api/generate-theme.ts`

**Purpose:** Cloudflare Pages Function that calls Claude API with tool_use for structured output.

- Uses `fetch()` directly to call `https://api.anthropic.com/v1/messages`
- Defines theme schema as a tool's `input_schema`
- Forces tool use with `tool_choice: { type: "tool", name: "generate_theme" }`
- Returns the tool input (validated theme JSON) directly
- Model: `claude-sonnet-4-5-20250514` (fast, cheap, reliable for structured output)
- No new npm dependencies required

**System prompt** includes:
- WCAG AA contrast guidance (4.5:1 for text on background)
- Subject-to-color mapping heuristics (cool for science, warm for humanities, etc.)
- Instruction to produce bold, cohesive palettes (not timid/muted)

**Auth:** Inherits existing `_middleware.ts` Bearer token check. Requires new `ANTHROPIC_API_KEY` env var in Cloudflare dashboard.

## Files to Modify

### 4. `src/index.css`

Add CSS custom properties with defaults BEFORE the `@import "tailwindcss"`, plus wire them into Tailwind v4's `@theme` system:

```css
@import "tailwindcss";

@theme {
  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-accent: #d97706;
  --color-background: #f9fafb;
  --color-surface: #ffffff;
  --color-surface-hover: #f3f4f6;
  --color-text: #111827;
  --color-text-secondary: #6b7280;
  --color-text-on-primary: #ffffff;
  --color-border: #e5e7eb;
}
```

This makes `bg-primary`, `text-primary`, `bg-surface`, `border-border`, etc. available as Tailwind utilities. At runtime, `applyTheme()` overrides these via inline styles on `:root`, and all components using the utilities update automatically.

Add transition rule for smooth theme changes:
```css
* {
  transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease;
}
```

(Scope this narrowly if the wildcard selector causes performance issues — can restrict to specific classes.)

### 5. `functions/types.ts`

Add `ANTHROPIC_API_KEY: string` to the `Env` interface.

### 6. `src/components/layout/Layout.tsx`

- `bg-gray-50` → `bg-background`

### 7. `src/components/layout/Header.tsx`

- `bg-white` → `bg-surface`
- `border-gray-200` → `border-border`
- `text-indigo-600` (logo) → `text-primary`
- `hover:text-indigo-600` (nav links) → `hover:text-primary`
- `active:text-indigo-600` → `active:text-primary`

### 8. `src/pages/DeckDetailPage.tsx`

- Add `useDeckTheme(deck?.name)` call
- `text-indigo-600` links → `text-primary`
- `bg-indigo-600` buttons → `bg-primary`
- `hover:bg-indigo-700` → `hover:bg-primary-hover`
- `active:bg-indigo-700` → `active:bg-primary-hover`
- `text-gray-900` headings → `text-text`
- `text-gray-500` secondary text → `text-text-secondary`
- Optionally show a subtle "generating theme..." indicator while `isGenerating` is true
- **Keep delete button red, keep gray secondary buttons as-is for now**

### 9. `src/components/ui/EmptyState.tsx`

- `bg-indigo-600` → `bg-primary`
- `hover:bg-indigo-700` → `hover:bg-primary-hover`
- `active:bg-indigo-700` → `active:bg-primary-hover`

### 10. `src/components/deck/DeckCard.tsx`

- `bg-white` → `bg-surface`
- `border-gray-200` → `border-border`
- `text-gray-900` → `text-text`
- `text-gray-500` → `text-text-secondary`
- `text-indigo-600` (Study link) → `text-primary`
- `hover:text-indigo-800` → `hover:text-primary-hover`

### 11. `src/components/study/FlashCard.tsx`

- `bg-white` → `bg-surface`
- `border-gray-200` → `border-border`
- `text-gray-900` → `text-text`
- `text-gray-400` label text → `text-text-secondary`

## Theme Lifecycle

1. User navigates to `/deck/:id` → `DeckDetailPage` renders → `useDeckTheme(deck.name)` runs
2. Hook checks localStorage cache (keyed by normalized deck name)
3. **Cache hit:** Apply theme instantly (< 1ms), no network call
4. **Cache miss:** Show default theme → POST to `/api/generate-theme` → on response, apply theme with CSS transitions (200ms ease) → cache in localStorage
5. User navigates away → `useEffect` cleanup calls `resetTheme()` → CSS vars removed → defaults from `@theme` block take effect → smooth transition back

## What This Does NOT Include (Deferred)

- Typography / Google Fonts loading
- Gradient backgrounds
- Streaming partial theme objects
- Server-side caching (KV, D1, Redis)
- Database schema changes (no `theme` column on decks)
- Study page theming (study page stays default)
- Dashboard page theming
- FOUC prevention script
- Pre-seeding common topics
- Zod runtime validation on the client

## Deployment Checklist

1. Add `ANTHROPIC_API_KEY` secret in Cloudflare Dashboard (Workers & Pages → Settings → Environment variables)
2. Deploy code changes (push to `master` triggers auto-deploy)
3. Test: Create a deck with a clear topic name (e.g. "Organic Chemistry"), navigate to it, observe theme generation

## Implementation Order

1. `src/index.css` — Add `@theme` tokens (app looks identical with defaults)
2. `src/lib/theme.ts` — Type + apply/reset/cache utilities
3. Convert components to use theme utility classes (Layout, Header, DeckDetailPage, EmptyState, DeckCard, FlashCard)
4. Verify app still looks identical (all defaults match current colors)
5. `functions/types.ts` — Add ANTHROPIC_API_KEY to Env
6. `functions/api/generate-theme.ts` — API endpoint
7. `src/hooks/useDeckTheme.ts` — Hook
8. Wire `useDeckTheme` into `DeckDetailPage`
9. Test end-to-end
