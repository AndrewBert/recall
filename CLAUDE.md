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
- **Dexie.js** (IndexedDB) + `dexie-react-hooks` for reactive queries
- **ts-fsrs v5** for spaced repetition scheduling
- **React Router v7** — import from `"react-router"`, NOT `"react-router-dom"`

## Architecture

```
src/
  db/db.ts          — Dexie schema: decks, cards, reviewLogs
  models/types.ts   — TypeScript interfaces (Deck, CardRecord, ReviewLogRecord)
  services/         — Async data operations (deckService, cardService, reviewService, fsrs)
  hooks/            — useLiveQuery wrappers + useStudySession state machine
  pages/            — Route-level components (Dashboard, DeckDetail, Study)
  components/       — UI organized by domain (deck/, card/, study/, ui/)
  lib/utils.ts      — Date formatting helpers
```

**Routes:** `/` → Dashboard, `/deck/:id` → DeckDetail, `/deck/:id/study` → StudyPage. All nested under `<Layout>` with shared header.

### Database

Three Dexie tables with compound indexes for efficient queries:

- `cards: '++id, deckId, due, state, [deckId+due]'`
- `reviewLogs: '++id, cardId, review, [cardId+review]'`
- `decks: '++id, name, createdAt'`

FSRS fields are stored **flat** on `CardRecord` (not nested) to enable Dexie indexing. Cascade deletes handled via Dexie transactions in `deckService.ts`.

### FSRS Integration

- `toFSRSCard(cardRecord)` converts DB record → FSRS Card object
- `applyFSRSResult(result)` extracts FSRS fields back to flat DB fields
- **Never pass raw CardRecord directly to the FSRS scheduler**
- `Rating` enum includes `Manual=0`; use the `Grade` type (excludes Manual) for `scheduler.next()`
- Rating values: `Again=1, Hard=2, Good=3, Easy=4`

### Study Session

`useStudySession` is a `useReducer` state machine with phases: `loading → studying → flipped → complete | empty`. Again-rated cards are re-queued at end of queue, max once per session (tracked via `Set`). Keyboard shortcuts: Space/Enter to flip, 1-4 to rate.

### Dexie Hooks

`useLiveQuery()` returns `undefined` on first render — always handle loading state before accessing data. Dashboard uses a single query for due counts across all decks to avoid N+1.

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
