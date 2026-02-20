import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../services/api'
import type { StatsResponse } from '../models/types'

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => apiFetch<StatsResponse>('/api/stats'),
    staleTime: 5 * 60 * 1000,
  })
}
