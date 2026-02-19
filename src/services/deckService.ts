import { db } from '../db/db'

export async function createDeck(name: string, description: string) {
  const now = new Date()
  return db.decks.add({
    name,
    description,
    createdAt: now,
    updatedAt: now,
  } as any)
}

export async function updateDeck(
  id: number,
  updates: { name?: string; description?: string },
) {
  return db.decks.update(id, { ...updates, updatedAt: new Date() })
}

/** Cascade delete: deck + all its cards + all their reviewLogs */
export async function deleteDeck(id: number) {
  await db.transaction(
    'rw',
    [db.decks, db.cards, db.reviewLogs],
    async () => {
      const cardIds = await db.cards
        .where('deckId')
        .equals(id)
        .primaryKeys()
      if (cardIds.length > 0) {
        await db.reviewLogs.where('cardId').anyOf(cardIds).delete()
      }
      await db.cards.where('deckId').equals(id).delete()
      await db.decks.delete(id)
    },
  )
}

export async function getDeck(id: number) {
  return db.decks.get(id)
}
