import { useEffect, useState } from 'react'
import { applyTheme, resetTheme, getCachedTheme, setCachedTheme, isValidTheme } from '../lib/theme'
import type { DeckTheme } from '../lib/theme'

export function useDeckTheme(deckName: string | undefined) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!deckName) return

    // Check cache first
    const cached = getCachedTheme(deckName)
    if (cached) {
      applyTheme(cached)
      return () => { resetTheme() }
    }

    const controller = new AbortController()
    let cancelled = false

    async function generate() {
      setIsGenerating(true)
      setError(null)
      try {
        const res = await fetch('/api/generate-theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: deckName }),
          signal: controller.signal,
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string }
          throw new Error(body.error || `Theme generation failed (${res.status})`)
        }

        const data: unknown = await res.json()

        if (cancelled) return

        if (!isValidTheme(data)) {
          throw new Error('Invalid theme response')
        }

        const theme = data as DeckTheme
        setCachedTheme(deckName!, theme)
        applyTheme(theme)
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return
        setError(err instanceof Error ? err.message : 'Theme generation failed')
      } finally {
        if (!cancelled) setIsGenerating(false)
      }
    }

    generate()

    return () => {
      cancelled = true
      controller.abort()
      resetTheme()
    }
  }, [deckName])

  return { isGenerating, error }
}
