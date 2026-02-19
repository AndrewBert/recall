import { useQuery } from '@tanstack/react-query'
import { getDeck } from '../services/deckService'

export function useDeck(id: number) {
  return useQuery({
    queryKey: ['deck', id],
    queryFn: () => getDeck(id),
  })
}
