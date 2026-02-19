# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — Type-check (tsc) then build with Vite
- `npm run lint` — ESLint on all TS/TSX files
- `npm run preview` — Preview production build locally

No test framework is configured yet.

## Tech Stack

- **Vite + React 19 + TypeScript** (strict mode, no unused locals/params)
- **Tailwind CSS v4** via `@tailwindcss/vite` — no `tailwind.config.js` or `postcss.config.js` needed; styles use `@import "tailwindcss"` in `index.css`
- **TanStack React Query** for server state management
- **ts-fsrs v5** for spaced repetition scheduling (runs client-side)
- **React Router v7** — import from `"react-router"`, NOT `"react-router-dom"`
- **Cloudflare D1** backend with REST API (`functions/api/`)

## Architecture

```
src/
  services/api.ts     — apiFetch wrapper, date parsing, CardRecord↔API field remapping
  services/           — deckService, cardService, reviewService (call API + invalidate cache), fsrs (pure FSRS logic)
  queryClient.ts      — Shared TanStack QueryClient instance (staleTime: 60s, retry: 1)
  models/types.ts     — TypeScript interfaces (Deck, DashboardDeck, CardRecord, ReviewLogRecord)
  hooks/              — useQuery-based hooks (useDashboard, useDeck, useDeckCards, useDueCards, useStudySession)
  pages/              — Route-level components (Dashboard, DeckDetail, Study)
  components/         — UI organized by domain (deck/, card/, study/, ui/)
  lib/utils.ts        — Date formatting helpers
functions/api/        — Cloudflare Pages Functions (D1 backend)
```

**Routes:** `/` → Dashboard, `/deck/:id` → DeckDetail, `/deck/:id/study` → StudyPage. All nested under `<Layout>` with shared header.

### Data Layer

Frontend fetches from REST API via `apiFetch()` (Bearer token auth from `VITE_API_KEY`). TanStack Query manages caching; services invalidate relevant query keys after mutations.

**Field mapping**: Only `last_review` ↔ `lastReview` needs renaming between `CardRecord` and the API. All other fields (including `elapsed_days`, `scheduled_days`, `learning_steps`) pass through as-is. Date fields (`due`, `last_review`, `createdAt`, `updatedAt`) are ISO strings in the API, parsed to `Date` objects by `remapCardFromApi()`.

**D1 schema**: `migrations/0001_initial.sql` — `decks`, `cards`, `review_logs` tables. DB uses snake_case columns; API responses use camelCase. Cascade deletes done manually via `DB.batch()` (D1 doesn't persist `PRAGMA foreign_keys`).

### FSRS Integration

- `toFSRSCard(cardRecord)` converts DB record → FSRS Card object
- `applyFSRSResult(result)` extracts FSRS fields back to flat DB fields
- **Never pass raw CardRecord directly to the FSRS scheduler**
- `Rating` enum includes `Manual=0`; use the `Grade` type (excludes Manual) for `scheduler.next()`
- Rating values: `Again=1, Hard=2, Good=3, Easy=4`

### Study Session

`useStudySession` is a `useReducer` state machine with phases: `loading → studying → flipped → complete | empty`. Again-rated cards are re-queued at end of queue, max once per session (tracked via `Set`). Keyboard shortcuts: Space/Enter to flip, 1-4 to rate.

### Cache Invalidation

| Mutation | Invalidates |
|---|---|
| `createDeck` | `['dashboard']` |
| `updateDeck(id)` | `['dashboard']`, `['deck', id]` |
| `deleteDeck(id)` | `['dashboard']`, remove `['deck', id]` |
| `addCard(deckId)` | `['dashboard']`, `['deck', deckId, 'cards']`, `['deck', deckId, 'due-cards']` |
| `updateCard(id, _, deckId)` | `['deck', deckId, 'cards']` |
| `deleteCard(id, deckId)` | `['dashboard']`, `['deck', deckId, 'cards']`, `['deck', deckId, 'due-cards']` |
| `processReview(card)` | `['dashboard']`, `['deck', deckId, 'cards']`, `['deck', deckId, 'due-cards']` |

## Design Philosophy — Mobile First

This app follows **mobile-first design**. All Tailwind classes start with mobile styles, then use `sm:`/`md:`/`lg:` breakpoints for larger screens.

- **Touch targets**: All interactive elements must be at least 44px (use `p-2.5` on icon buttons)
- **Active states**: Every element with a `hover:` style must also have an `active:` style for touch feedback
- **Keyboard hints**: Hide keyboard shortcut labels on mobile (`hidden sm:inline`)
- **Layout**: Stack vertically on mobile, go horizontal with `sm:flex-row` / `sm:grid-cols-N`
- **Modals**: Must have safe margins on mobile and scroll containment for long content
- **Buttons in forms/dialogs**: Full-width on mobile (`w-full sm:w-auto`)

## Deployment

- **Hosting**: Cloudflare Pages at `recall-1qw.pages.dev`
- **Auto-deploy**: Pushes to `master` on GitHub (`AndrewBert/recall`) trigger automatic builds
- **Build config**: `npm run build` → output `dist/`
- **SPA routing**: Handled automatically by Cloudflare Pages (no config needed)

### Production Setup (Cloudflare Dashboard)

The following must be configured manually in the Cloudflare dashboard:

1. **Environment variables** (Workers & Pages → recall-1qw → Settings → Environment variables):
   - `API_KEY` (Secret) — backend auth middleware checks this
   - `VITE_API_KEY` (Secret) — Vite bakes this into frontend JS at build time
   - Both must have the **same value**

2. **D1 database binding** (Settings → Bindings → Add → D1 database):
   - Variable name: `DB`
   - Database: `flash-cards-db`

3. **D1 migration**: Run `migrations/0001_initial.sql` in the D1 Console (skip the `PRAGMA` line)

After changing env vars or bindings, **redeploy** for changes to take effect.

Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.
