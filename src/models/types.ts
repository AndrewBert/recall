import type { State, Rating } from 'ts-fsrs'

export interface Deck {
  id: number
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
}

export interface DashboardDeck extends Deck {
  cardCount: number
  dueCount: number
}

export interface CardRecord {
  id: number
  deckId: number
  front: string
  back: string
  // FSRS Card fields (stored flat for indexing)
  due: Date
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  learning_steps: number
  reps: number
  lapses: number
  state: State
  last_review?: Date
}

export interface ReviewLogRecord {
  id: number
  cardId: number
  // FSRS ReviewLog fields
  rating: Rating
  state: State
  due: Date
  stability: number
  difficulty: number
  elapsed_days: number
  last_elapsed_days: number
  scheduled_days: number
  learning_steps: number
  review: Date
}
