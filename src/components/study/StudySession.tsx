import { useEffect, useCallback } from 'react'
import { Rating } from 'ts-fsrs'
import type { useStudySession } from '../../hooks/useStudySession'
import FlashCard from './FlashCard'
import RatingButtons from './RatingButtons'
import StudyComplete from './StudyComplete'

type SessionReturn = ReturnType<typeof useStudySession>

interface StudySessionProps {
  session: SessionReturn
  deckId: number
}

export default function StudySession({ session, deckId }: StudySessionProps) {
  const {
    phase,
    currentCard,
    currentIndex,
    totalCards,
    stats,
    error,
    flip,
    rate,
    canUndo,
    undo,
  } = session

  // Keyboard shortcuts -- skip when focus is in input/textarea
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      if (phase === 'studying' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        flip()
      } else if (phase === 'flipped') {
        switch (e.key) {
          case '1':
            rate(Rating.Again)
            break
          case '2':
            rate(Rating.Hard)
            break
          case '3':
            rate(Rating.Good)
            break
          case '4':
            rate(Rating.Easy)
            break
        }
      }

      // Undo: Z key works during studying (after a rating) and complete phases
      if ((phase === 'studying' || phase === 'complete') && (e.key === 'z' || e.key === 'Z') && canUndo) {
        undo()
      }
    },
    [phase, flip, rate, canUndo, undo],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (phase === 'complete') {
    return (
      <StudyComplete
        deckId={deckId}
        stats={stats}
        totalCards={totalCards}
        canUndo={canUndo}
        onUndo={undo}
      />
    )
  }

  if (!currentCard) return null

  const progress =
    totalCards > 0 ? ((currentIndex) / totalCards) * 100 : 0

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>
            Card {currentIndex + 1} of {totalCards}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flash card */}
      <FlashCard
        front={currentCard.front}
        back={currentCard.back}
        isFlipped={phase === 'flipped'}
        onFlip={flip}
      />

      {/* Rating buttons -- only show after flip */}
      {phase === 'flipped' && (
        <RatingButtons card={currentCard} onRate={rate} />
      )}

      {/* Undo button -- show between rating and flipping next card */}
      {phase === 'studying' && canUndo && (
        <div className="text-center mt-4">
          <button
            onClick={undo}
            className="text-sm text-gray-500 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
          >
            &#8617; Undo last rating <span className="hidden sm:inline">(Z)</span>
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-center text-red-500 text-sm mt-4">{error}</p>
      )}
    </div>
  )
}
