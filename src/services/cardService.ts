import Dexie from 'dexie'
import { db } from '../db/db'
import { createNewCardRecord } from './fsrs'

export async function addCard(deckId: number, front: string, back: string) {
  const record = createNewCardRecord(deckId, front, back)
  return db.cards.add(record as any)
}

export async function updateCard(
  id: number,
  updates: { front?: string; back?: string },
) {
  return db.cards.update(id, updates)
}

export async function deleteCard(id: number) {
  await db.transaction('rw', [db.cards, db.reviewLogs], async () => {
    await db.reviewLogs.where('cardId').equals(id).delete()
    await db.cards.delete(id)
  })
}

/** Get all cards due for review in a deck using compound index [deckId+due]. */
export async function getDueCards(deckId: number) {
  const now = new Date()
  return db.cards
    .where('[deckId+due]')
    .between([deckId, Dexie.minKey], [deckId, now])
    .toArray()
}
