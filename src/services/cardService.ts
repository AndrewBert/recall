import { apiFetch, remapCardToApi } from './api'
import { queryClient } from '../queryClient'
import { createNewCardRecord } from './fsrs'

export async function addCard(deckId: number, front: string, back: string) {
  const record = createNewCardRecord(deckId, front, back)
  const payload = remapCardToApi(record)

  await apiFetch('/api/cards', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  queryClient.invalidateQueries({ queryKey: ['deck', deckId, 'cards'] })
  queryClient.invalidateQueries({ queryKey: ['deck', deckId, 'due-cards'] })
}

export async function updateCard(
  id: number,
  updates: { front?: string; back?: string },
  deckId: number,
) {
  await apiFetch(`/api/cards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })

  queryClient.invalidateQueries({ queryKey: ['deck', deckId, 'cards'] })
}

export async function deleteCard(id: number, deckId: number) {
  await apiFetch(`/api/cards/${id}`, { method: 'DELETE' })

  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  queryClient.invalidateQueries({ queryKey: ['deck', deckId, 'cards'] })
  queryClient.invalidateQueries({ queryKey: ['deck', deckId, 'due-cards'] })
}
