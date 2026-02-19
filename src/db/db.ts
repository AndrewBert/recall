import { Dexie, type EntityTable } from 'dexie'
import type { Deck, CardRecord, ReviewLogRecord } from '../models/types'

const db = new Dexie('FlashCardsDB') as Dexie & {
  decks: EntityTable<Deck, 'id'>
  cards: EntityTable<CardRecord, 'id'>
  reviewLogs: EntityTable<ReviewLogRecord, 'id'>
}

db.version(1).stores({
  decks: '++id, name, createdAt',
  cards: '++id, deckId, due, state, [deckId+due]',
  reviewLogs: '++id, cardId, review, [cardId+review]',
})

export { db }
