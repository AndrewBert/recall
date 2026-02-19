import { useMemo } from 'react'
import { Rating, type Grade } from 'ts-fsrs'
import type { CardRecord } from '../../models/types'
import { scheduler, toFSRSCard } from '../../services/fsrs'
import { formatInterval } from '../../lib/utils'

interface RatingButtonsProps {
  card: CardRecord
  onRate: (rating: Grade) => void
  disabled?: boolean
}

const buttons = [
  { rating: Rating.Again, label: 'Again', key: '1', className: 'bg-red-500 hover:bg-red-600' },
  { rating: Rating.Hard, label: 'Hard', key: '2', className: 'bg-orange-500 hover:bg-orange-600' },
  { rating: Rating.Good, label: 'Good', key: '3', className: 'bg-green-500 hover:bg-green-600' },
  { rating: Rating.Easy, label: 'Easy', key: '4', className: 'bg-blue-500 hover:bg-blue-600' },
] as const

export default function RatingButtons({
  card,
  onRate,
  disabled,
}: RatingButtonsProps) {
  const intervals = useMemo(() => {
    const fsrsCard = toFSRSCard(card)
    const outcomes = scheduler.repeat(fsrsCard, new Date())
    return {
      [Rating.Again]: outcomes[Rating.Again].card.scheduled_days,
      [Rating.Hard]: outcomes[Rating.Hard].card.scheduled_days,
      [Rating.Good]: outcomes[Rating.Good].card.scheduled_days,
      [Rating.Easy]: outcomes[Rating.Easy].card.scheduled_days,
    }
  }, [card])

  return (
    <div className="flex justify-center gap-3 mt-6">
      {buttons.map(({ rating, label, key, className }) => (
        <button
          key={rating}
          onClick={() => onRate(rating)}
          disabled={disabled}
          className={`${className} text-white px-5 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex flex-col items-center min-w-[80px]`}
        >
          <span>{label}</span>
          <span className="text-xs opacity-80 mt-0.5">
            {formatInterval(intervals[rating])} ({key})
          </span>
        </button>
      ))}
    </div>
  )
}
