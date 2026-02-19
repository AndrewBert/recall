import type { Grade } from 'ts-fsrs'
import type { CardRecord } from '../models/types'
import { scheduler, toFSRSCard, applyFSRSResult } from './fsrs'
import { apiFetch, remapCardFromApi } from './api'
import { queryClient } from '../queryClient'

/** Process a review: run FSRS client-side, POST result to API, return updated CardRecord with Date objects. */
export async function processReview(cardRecord: CardRecord, rating: Grade) {
  const fsrsCard = toFSRSCard(cardRecord)
  const now = new Date()
  const result = scheduler.next(fsrsCard, now, rating)

  const updatedFields = applyFSRSResult(result.card)
  const log = result.log

  const payload = {
    cardId: cardRecord.id,
    updatedCard: {
      due: updatedFields.due!.toISOString(),
      stability: updatedFields.stability,
      difficulty: updatedFields.difficulty,
      elapsed_days: updatedFields.elapsed_days,
      scheduled_days: updatedFields.scheduled_days,
      learning_steps: updatedFields.learning_steps,
      reps: updatedFields.reps,
      lapses: updatedFields.lapses,
      state: updatedFields.state,
      lastReview: updatedFields.last_review instanceof Date
        ? updatedFields.last_review.toISOString()
        : null,
    },
    reviewLog: {
      rating: log.rating,
      state: log.state,
      due: log.due.toISOString(),
      stability: log.stability,
      difficulty: log.difficulty,
      elapsed_days: log.elapsed_days,
      last_elapsed_days: log.last_elapsed_days,
      scheduled_days: log.scheduled_days,
      learning_steps: log.learning_steps,
      review: log.review.toISOString(),
    },
  }

  const res = await apiFetch<{ card: Record<string, unknown> }>('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  queryClient.invalidateQueries({ queryKey: ['deck', cardRecord.deckId, 'due-cards'] })
  queryClient.invalidateQueries({ queryKey: ['deck', cardRecord.deckId, 'cards'] })

  return remapCardFromApi(res.card)
}
