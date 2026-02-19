import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

/** Single query for all due cards across all decks, grouped by deckId. Avoids N+1 queries on dashboard. */
export function useDueCounts() {
  const allDue = useLiveQuery(
    () => db.cards.where('due').belowOrEqual(new Date()).toArray(),
  )

  return useMemo(() => {
    if (!allDue) return undefined
    return allDue.reduce<Record<number, number>>((acc, card) => {
      acc[card.deckId] = (acc[card.deckId] ?? 0) + 1
      return acc
    }, {})
  }, [allDue])
}
