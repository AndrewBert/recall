import { useQuery } from '@tanstack/react-query'
import { apiFetch, parseDates } from '../services/api'
import type { DashboardDeck } from '../models/types'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await apiFetch<{ decks: DashboardDeck[] }>('/api/dashboard')
      return res.decks.map(parseDates)
    },
  })
}
