import { State } from 'ts-fsrs'
import type { CardRecord } from '../../models/types'

interface CardItemProps {
  card: CardRecord
  onEdit: (card: CardRecord) => void
  onDelete: (card: CardRecord) => void
}

const stateLabels: Record<number, { text: string; className: string }> = {
  [State.New]: { text: 'New', className: 'text-blue-600 bg-blue-50' },
  [State.Learning]: { text: 'Learning', className: 'text-orange-600 bg-orange-50' },
  [State.Review]: { text: 'Review', className: 'text-green-600 bg-green-50' },
  [State.Relearning]: { text: 'Relearning', className: 'text-red-600 bg-red-50' },
}

export default function CardItem({ card, onEdit, onDelete }: CardItemProps) {
  const stateInfo = stateLabels[card.state] ?? stateLabels[State.New]

  return (
    <div className="flex items-center gap-4 py-3 px-4 bg-white rounded-lg border border-gray-200">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {card.front}
        </p>
        <p className="text-sm text-gray-500 truncate">{card.back}</p>
      </div>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded ${stateInfo.className}`}
      >
        {stateInfo.text}
      </span>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => onEdit(card)}
          className="text-gray-400 hover:text-gray-600 active:bg-gray-100 p-2.5 rounded-md cursor-pointer"
          title="Edit"
        >
          &#9998;
        </button>
        <button
          onClick={() => onDelete(card)}
          className="text-gray-400 hover:text-red-500 active:bg-red-50 p-2.5 rounded-md cursor-pointer"
          title="Delete"
        >
          &#10005;
        </button>
      </div>
    </div>
  )
}
