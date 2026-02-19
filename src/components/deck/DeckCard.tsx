import { Link } from 'react-router'
import type { Deck } from '../../models/types'

interface DeckCardProps {
  deck: Deck
  cardCount: number
  dueCount: number
  onEdit: (deck: Deck) => void
  onDelete: (deck: Deck) => void
}

export default function DeckCard({
  deck,
  cardCount,
  dueCount,
  onEdit,
  onDelete,
}: DeckCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <Link
          to={`/deck/${deck.id}`}
          className="text-lg font-semibold text-gray-900 hover:text-indigo-600 no-underline transition-colors"
        >
          {deck.name}
        </Link>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(deck)}
            className="text-gray-400 hover:text-gray-600 px-1.5 cursor-pointer"
            title="Edit"
          >
            &#9998;
          </button>
          <button
            onClick={() => onDelete(deck)}
            className="text-gray-400 hover:text-red-500 px-1.5 cursor-pointer"
            title="Delete"
          >
            &#10005;
          </button>
        </div>
      </div>
      {deck.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
          {deck.description}
        </p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {cardCount} {cardCount === 1 ? 'card' : 'cards'}
        </span>
        <div className="flex items-center gap-3">
          {dueCount > 0 && (
            <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              {dueCount} due
            </span>
          )}
          {dueCount > 0 && (
            <Link
              to={`/deck/${deck.id}/study`}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 no-underline transition-colors"
            >
              Study
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
