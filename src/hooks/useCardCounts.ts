import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

/** Single query for total card count per deck. Avoids N+1 on dashboard. */
export function useCardCounts() {
  const allCards = useLiveQuery(() => db.cards.toArray())

  return useMemo(() => {
    if (!allCards) return undefined
    return allCards.reduce<Record<number, number>>((acc, card) => {
      acc[card.deckId] = (acc[card.deckId] ?? 0) + 1
      return acc
    }, {})
  }, [allCards])
}
