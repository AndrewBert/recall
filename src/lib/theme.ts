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

/** Validate that an API response has the expected DeckTheme shape with valid hex colors. */
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
  root.classList.add('theme-transition')
  for (const [key, cssVar] of Object.entries(COLOR_VAR_MAP)) {
    root.style.setProperty(cssVar, theme.colors[key as keyof DeckTheme['colors']])
  }
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

// --- localStorage cache ---

const CACHE_KEY = 'deck-themes'
const CACHE_VERSION = 1
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days
const MAX_ENTRIES = 50

interface CacheEntry {
  theme: DeckTheme
  timestamp: number
  version: number
}

function normalizeKey(deckName: string): string {
  return deckName.toLowerCase().trim().replace(/\s+/g, '-')
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
