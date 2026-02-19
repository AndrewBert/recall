import { useReducer, useEffect, useCallback } from 'react'
import { Rating, type Grade } from 'ts-fsrs'
import type { CardRecord } from '../models/types'
import { processReview, undoReview } from '../services/reviewService'
import { useDueCards } from './useDueCards'

type SessionPhase = 'loading' | 'studying' | 'flipped' | 'complete' | 'empty'

interface SessionStats {
  again: number
  hard: number
  good: number
  easy: number
}

interface UndoInfo {
  previousCard: CardRecord
  reviewLogId: number
  rating: Grade
  wasRequeued: boolean
}

interface SessionState {
  phase: SessionPhase
  queue: CardRecord[]
  currentIndex: number
  requeuedIds: Set<number>
  stats: SessionStats
  error: string | null
  lastUndo: UndoInfo | null
  isRating: boolean
}

type SessionAction =
  | { type: 'INIT'; cards: CardRecord[] }
  | { type: 'FLIP' }
  | { type: 'RATING_START' }
  | { type: 'RATED'; rating: Grade; updatedCard: CardRecord; reviewLogId: number; previousCard: CardRecord }
  | { type: 'UNDO' }
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
        lastUndo: null,
        isRating: false,
      }
    }
    case 'FLIP': {
      return { ...state, phase: 'flipped', error: null, lastUndo: null }
    }
    case 'RATING_START': {
      return { ...state, isRating: true }
    }
    case 'RATED': {
      const key = ratingToKey(action.rating)
      const newStats = { ...state.stats, [key]: state.stats[key] + 1 }

      let newQueue = state.queue
      const currentCard = state.queue[state.currentIndex]
      let wasRequeued = false

      // Re-queue Again-rated cards max once
      if (
        action.rating === Rating.Again &&
        !state.requeuedIds.has(currentCard.id)
      ) {
        newQueue = [...state.queue, action.updatedCard]
        wasRequeued = true
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
        isRating: false,
        lastUndo: {
          previousCard: action.previousCard,
          reviewLogId: action.reviewLogId,
          rating: action.rating,
          wasRequeued,
        },
      }
    }
    case 'UNDO': {
      if (!state.lastUndo) return state

      const { previousCard, rating, wasRequeued } = state.lastUndo
      const key = ratingToKey(rating)
      const newStats = { ...state.stats, [key]: state.stats[key] - 1 }

      let newQueue = state.queue
      const newRequeued = new Set(state.requeuedIds)

      if (wasRequeued) {
        // Remove the re-queued copy (last item)
        newQueue = newQueue.slice(0, -1)
        newRequeued.delete(previousCard.id)
      }

      // Replace the card at the undone position with the previous card state
      const undoneIndex = state.currentIndex - 1
      newQueue = [...newQueue]
      newQueue[undoneIndex] = previousCard

      return {
        ...state,
        phase: 'flipped',
        queue: newQueue,
        currentIndex: undoneIndex,
        requeuedIds: newRequeued,
        stats: newStats,
        error: null,
        lastUndo: null,
        isRating: false,
      }
    }
    case 'ERROR': {
      return { ...state, error: action.message, isRating: false }
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
  lastUndo: null,
  isRating: false,
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
      if (state.phase !== 'flipped' || !currentCard || state.isRating) return
      dispatch({ type: 'RATING_START' })
      const previousCard = currentCard
      try {
        const { card: updated, reviewLogId } = await processReview(currentCard, rating)
        dispatch({ type: 'RATED', rating, updatedCard: updated, reviewLogId, previousCard })
      } catch (err) {
        dispatch({
          type: 'ERROR',
          message: err instanceof Error ? err.message : 'Failed to save review',
        })
      }
    },
    [state.phase, state.isRating, currentCard],
  )

  const canUndo = state.lastUndo !== null && !state.isRating

  const undo = useCallback(async () => {
    if (!state.lastUndo || state.isRating) return
    const { reviewLogId, previousCard } = state.lastUndo
    try {
      await undoReview(reviewLogId, previousCard)
      dispatch({ type: 'UNDO' })
    } catch (err) {
      dispatch({
        type: 'ERROR',
        message: err instanceof Error ? err.message : 'Failed to undo review',
      })
    }
  }, [state.lastUndo, state.isRating])

  return {
    phase: state.phase,
    currentCard,
    currentIndex: state.currentIndex,
    totalCards: state.queue.length,
    stats: state.stats,
    error: state.error,
    flip,
    rate,
    canUndo,
    undo,
  }
}
