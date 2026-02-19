import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  type Card,
} from 'ts-fsrs'
import type { CardRecord } from '../models/types'

const params = generatorParameters({
  request_retention: 0.9,
  maximum_interval: 365,
  enable_fuzz: true,
})

export const scheduler = fsrs(params)

/** Extract only FSRS Card fields from a CardRecord. Never pass raw CardRecord to scheduler. */
export function toFSRSCard(record: CardRecord): Card {
  return {
    due: record.due,
    stability: record.stability,
    difficulty: record.difficulty,
    elapsed_days: record.elapsed_days,
    scheduled_days: record.scheduled_days,
    learning_steps: record.learning_steps,
    reps: record.reps,
    lapses: record.lapses,
    state: record.state,
    last_review: record.last_review,
  }
}

/** Merge updated FSRS Card fields back onto a CardRecord for Dexie update. */
export function applyFSRSResult(updatedCard: Card): Partial<CardRecord> {
  return {
    due: updatedCard.due,
    stability: updatedCard.stability,
    difficulty: updatedCard.difficulty,
    elapsed_days: updatedCard.elapsed_days,
    scheduled_days: updatedCard.scheduled_days,
    learning_steps: updatedCard.learning_steps,
    reps: updatedCard.reps,
    lapses: updatedCard.lapses,
    state: updatedCard.state,
    last_review: updatedCard.last_review,
  }
}

/** Create a new CardRecord with empty FSRS state, immediately due. */
export function createNewCardRecord(
  deckId: number,
  front: string,
  back: string,
): Omit<CardRecord, 'id'> {
  const emptyCard = createEmptyCard(new Date())
  return {
    deckId,
    front,
    back,
    ...emptyCard,
  }
}
