import { apiFetch, ApiError, parseDates } from './api'
import { queryClient } from '../queryClient'
import type { Deck } from '../models/types'

export async function createDeck(name: string, description: string) {
  const res = await apiFetch<{ deck: Deck }>('/api/decks', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  return res.deck
}

export async function updateDeck(
  id: number,
  updates: { name?: string; description?: string },
) {
  const res = await apiFetch<{ deck: Deck }>(`/api/decks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  queryClient.invalidateQueries({ queryKey: ['deck', id] })
  return res.deck
}

export async function deleteDeck(id: number) {
  await apiFetch(`/api/decks/${id}`, { method: 'DELETE' })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  queryClient.removeQueries({ queryKey: ['deck', id] })
}

export async function getDeck(id: number): Promise<Deck | null> {
  try {
    const res = await apiFetch<{ deck: Deck }>(`/api/decks/${id}`)
    return parseDates(res.deck)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}
