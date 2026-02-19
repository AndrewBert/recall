import type { Grade } from 'ts-fsrs'
import { db } from '../db/db'
import type { CardRecord } from '../models/types'
import { scheduler, toFSRSCard, applyFSRSResult } from './fsrs'

/** Process a review: update the card via FSRS and save the review log. */
export async function processReview(cardRecord: CardRecord, rating: Grade) {
  const fsrsCard = toFSRSCard(cardRecord)
  const now = new Date()
  const result = scheduler.next(fsrsCard, now, rating)

  const updatedFields = applyFSRSResult(result.card)
  const log = result.log

  await db.transaction('rw', [db.cards, db.reviewLogs], async () => {
    await db.cards.update(cardRecord.id, updatedFields)
    await db.reviewLogs.add({
      cardId: cardRecord.id,
      rating: log.rating,
      state: log.state,
      due: log.due,
      stability: log.stability,
      difficulty: log.difficulty,
      elapsed_days: log.elapsed_days,
      last_elapsed_days: log.last_elapsed_days,
      scheduled_days: log.scheduled_days,
      learning_steps: log.learning_steps,
      review: log.review,
    } as any)
  })

  return { ...cardRecord, ...updatedFields }
}
