import { useQuery } from '@tanstack/react-query'
import { apiFetch, remapCardFromApi } from '../services/api'
import type { CardRecord } from '../models/types'

export function useDueCards(deckId: number) {
  return useQuery({
    queryKey: ['deck', deckId, 'due-cards'],
    queryFn: async () => {
      const res = await apiFetch<{ cards: Record<string, unknown>[] }>(
        `/api/decks/${deckId}/due-cards`,
      )
      return res.cards.map(remapCardFromApi) as CardRecord[]
    },
  })
}
