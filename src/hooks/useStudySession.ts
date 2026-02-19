import { useReducer, useEffect, useCallback } from 'react'
import { Rating, type Grade } from 'ts-fsrs'
import type { CardRecord } from '../models/types'
import { processReview } from '../services/reviewService'
import { useDueCards } from './useDueCards'

type SessionPhase = 'loading' | 'studying' | 'flipped' | 'complete' | 'empty'

interface SessionStats {
  again: number
  hard: number
  good: number
  easy: number
}

interface SessionState {
  phase: SessionPhase
  queue: CardRecord[]
  currentIndex: number
  requeuedIds: Set<number>
  stats: SessionStats
  error: string | null
}

type SessionAction =
  | { type: 'INIT'; cards: CardRecord[] }
  | { type: 'FLIP' }
  | { type: 'RATED'; rating: Grade; updatedCard: CardRecord }
  | { type: 'ERROR'; message: string }

function ratingToKey(rating: Grade): keyof SessionStats {
  switch (rating) {
    case Rating.Again: return 'again'
    case Rating.Hard: return 'hard'
    case Rating.Good: return 'good'
    case Rating.Easy: return 'easy'
  }
}

const emptyStats: SessionStats = { again: 0, hard: 0, good: 0, easy: 0 }

function reducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'INIT': {
      if (action.cards.length === 0) {
        return { ...state, phase: 'empty' }
      }
      return {
        ...state,
        phase: 'studying',
        queue: action.cards,
        currentIndex: 0,
        requeuedIds: new Set(),
        stats: { ...emptyStats },
        error: null,
      }
    }
    case 'FLIP': {
      return { ...state, phase: 'flipped', error: null }
    }
    case 'RATED': {
      const key = ratingToKey(action.rating)
      const newStats = { ...state.stats, [key]: state.stats[key] + 1 }

      let newQueue = state.queue
      const currentCard = state.queue[state.currentIndex]

      // Re-queue Again-rated cards max once
      if (
        action.rating === Rating.Again &&
        !state.requeuedIds.has(currentCard.id)
      ) {
        newQueue = [...state.queue, action.updatedCard]
      }

      const newRequeued = new Set(state.requeuedIds)
      if (action.rating === Rating.Again) {
        newRequeued.add(currentCard.id)
      }

      const nextIndex = state.currentIndex + 1
      const isComplete = nextIndex >= newQueue.length

      return {
        ...state,
        phase: isComplete ? 'complete' : 'studying',
        queue: newQueue,
        currentIndex: nextIndex,
        requeuedIds: newRequeued,
        stats: newStats,
        error: null,
      }
    }
    case 'ERROR': {
      return { ...state, error: action.message }
    }
  }
}

const initialState: SessionState = {
  phase: 'loading',
  queue: [],
  currentIndex: 0,
  requeuedIds: new Set(),
  stats: { ...emptyStats },
  error: null,
}

export function useStudySession(deckId: number) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const { data: dueCards } = useDueCards(deckId)

  // Initialize session when dueCards arrive (only once)
  useEffect(() => {
    if (dueCards !== undefined && state.phase === 'loading') {
      dispatch({ type: 'INIT', cards: dueCards })
    }
  }, [dueCards, state.phase])

  const currentCard =
    state.phase !== 'loading' && state.phase !== 'empty' && state.phase !== 'complete'
      ? state.queue[state.currentIndex]
      : null

  const flip = useCallback(() => {
    if (state.phase === 'studying') {
      dispatch({ type: 'FLIP' })
    }
  }, [state.phase])

  const rate = useCallback(
    async (rating: Grade) => {
      if (state.phase !== 'flipped' || !currentCard) return
      try {
        const updated = await processReview(currentCard, rating)
        dispatch({ type: 'RATED', rating, updatedCard: updated })
      } catch (err) {
        dispatch({
          type: 'ERROR',
          message: err instanceof Error ? err.message : 'Failed to save review',
        })
      }
    },
    [state.phase, currentCard],
  )

  return {
    phase: state.phase,
    currentCard,
    currentIndex: state.currentIndex,
    totalCards: state.queue.length,
    stats: state.stats,
    error: state.error,
    flip,
    rate,
  }
}
