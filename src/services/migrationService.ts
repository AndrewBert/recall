import { apiFetch, remapCardToApi } from './api'
import type { Deck } from '../models/types'

// --- Types (local to migration) ---

interface LegacyDeck {
  id: number
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
}

interface LegacyCard {
  id: number
  deckId: number
  front: string
  back: string
  due: Date
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  learning_steps: number
  reps: number
  lapses: number
  state: number
  last_review?: Date
}

export interface MigrationResult {
  decksCreated: number
  cardsCreated: number
}

const DB_NAME = 'FlashCardsDB'
const LS_IN_PROGRESS = 'migration-in-progress'
const LS_DECK_MAP = 'migration-deck-map'
const LS_DISMISSED = 'migration-dismissed'

// --- Detection ---

export async function hasLegacyData(): Promise<boolean> {
  if (localStorage.getItem(LS_DISMISSED)) return false

  // Chrome/Edge/Safari support indexedDB.databases()
  if (typeof indexedDB.databases === 'function') {
    const dbs = await indexedDB.databases()
    return dbs.some((db) => db.name === DB_NAME)
  }

  // Firefox fallback: try to open and inspect
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME)
    req.onsuccess = () => {
      const db = req.result
      if (db.objectStoreNames.length === 0) {
        // Accidental creation — clean up
        db.close()
        indexedDB.deleteDatabase(DB_NAME)
        resolve(false)
        return
      }
      // Check if decks store actually has records
      try {
        const tx = db.transaction('decks', 'readonly')
        const store = tx.objectStore('decks')
        const countReq = store.count()
        countReq.onsuccess = () => {
          db.close()
          resolve(countReq.result > 0)
        }
        countReq.onerror = () => {
          db.close()
          resolve(false)
        }
      } catch {
        db.close()
        resolve(false)
      }
    }
    req.onerror = () => resolve(false)
  })
}

// --- Reading legacy data ---

export function readLegacyData(): Promise<{
  decks: LegacyDeck[]
  cards: LegacyCard[]
}> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME)

    req.onerror = () => reject(new Error('Failed to open legacy database'))

    req.onsuccess = () => {
      const db = req.result

      try {
        const tx = db.transaction(['decks', 'cards'], 'readonly')
        const decks: LegacyDeck[] = []
        const cards: LegacyCard[] = []

        const deckReq = tx.objectStore('decks').getAll()
        const cardReq = tx.objectStore('cards').getAll()

        deckReq.onsuccess = () => {
          decks.push(...deckReq.result)
        }
        cardReq.onsuccess = () => {
          cards.push(...cardReq.result)
        }

        tx.oncomplete = () => {
          db.close()
          resolve({ decks, cards })
        }
        tx.onerror = () => {
          db.close()
          reject(new Error('Failed to read legacy data'))
        }
      } catch (err) {
        db.close()
        reject(err)
      }
    }
  })
}

// --- Migration ---

export async function migrateToApi(
  data: { decks: LegacyDeck[]; cards: LegacyCard[] },
  onProgress: (done: number, total: number) => void,
): Promise<MigrationResult> {
  // Prevent concurrent runs
  if (localStorage.getItem(LS_IN_PROGRESS)) {
    throw new Error('Migration is already in progress')
  }
  localStorage.setItem(LS_IN_PROGRESS, '1')

  try {
    // Resume support: load existing deck map if retrying after partial failure
    const existingMap = localStorage.getItem(LS_DECK_MAP)
    const deckMap: Map<number, number> = existingMap
      ? new Map(JSON.parse(existingMap) as [number, number][])
      : new Map()

    let decksCreated = deckMap.size

    // Phase 1 — Create decks
    for (const deck of data.decks) {
      if (deckMap.has(deck.id)) continue // already created in a previous attempt

      const res = await apiFetch<{ deck: Deck }>('/api/decks', {
        method: 'POST',
        body: JSON.stringify({ name: deck.name, description: deck.description }),
      })

      deckMap.set(deck.id, res.deck.id)
      decksCreated++

      // Persist map after each deck for resume support
      localStorage.setItem(LS_DECK_MAP, JSON.stringify([...deckMap]))
    }

    // Phase 2 — Create cards
    const total = data.cards.length
    let cardsCreated = 0

    for (let i = 0; i < data.cards.length; i++) {
      const card = data.cards[i]
      const newDeckId = deckMap.get(card.deckId)

      if (!newDeckId) {
        // Card belongs to a deck we don't have — skip
        onProgress(i + 1, total)
        continue
      }

      // Build card payload with remapped deckId, stripping legacy id
      const payload = remapCardToApi({
        deckId: newDeckId,
        front: card.front,
        back: card.back,
        due: card.due,
        stability: card.stability,
        difficulty: card.difficulty,
        elapsed_days: card.elapsed_days,
        scheduled_days: card.scheduled_days,
        learning_steps: card.learning_steps,
        reps: card.reps,
        lapses: card.lapses,
        state: card.state,
        last_review: card.last_review,
      })

      await apiFetch('/api/cards', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      cardsCreated++
      onProgress(i + 1, total)
    }

    // Success — clean up localStorage
    localStorage.removeItem(LS_DECK_MAP)
    localStorage.removeItem(LS_IN_PROGRESS)

    return { decksCreated, cardsCreated }
  } catch (err) {
    localStorage.removeItem(LS_IN_PROGRESS)
    throw err
  }
}

// --- Cleanup ---

export function deleteLegacyDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(new Error('Failed to delete legacy database'))
  })
}

export function dismissMigration(): void {
  localStorage.setItem(LS_DISMISSED, '1')
}
