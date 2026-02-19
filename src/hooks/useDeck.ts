import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

export function useDeck(id: number) {
  return useLiveQuery(() => db.decks.get(id), [id])
}
