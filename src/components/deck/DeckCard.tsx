import { useNavigate, Link } from 'react-router'
import type { Deck } from '../../models/types'

interface DeckCardProps {
  deck: Deck
  cardCount: number
  dueCount: number
  newCount: number
  learningCount: number
  reviewCount: number
  onEdit: (deck: Deck) => void
  onDelete: (deck: Deck) => void
}

export default function DeckCard({
  deck,
  cardCount,
  dueCount,
  newCount,
  learningCount,
  reviewCount,
  onEdit,
  onDelete,
}: DeckCardProps) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/deck/${deck.id}`)}
      className="bg-surface rounded-lg border border-border p-4 sm:p-5 hover:shadow-md active:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-lg font-semibold text-body">
          {deck.name}
        </span>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(deck)}
            className="text-tertiary hover:text-secondary active:bg-surface-hover p-2.5 rounded-md cursor-pointer"
            title="Edit"
          >
            &#9998;
          </button>
          <button
            onClick={() => onDelete(deck)}
            className="text-tertiary hover:text-red-500 active:bg-red-50 p-2.5 rounded-md cursor-pointer"
            title="Delete"
          >
            &#10005;
          </button>
        </div>
      </div>
      {deck.description && (
        <p className="text-sm text-secondary mb-3 line-clamp-2">
          {deck.description}
        </p>
      )}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-secondary">
            {cardCount} {cardCount === 1 ? 'card' : 'cards'}
          </span>
          {dueCount > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {newCount > 0 && (
                <span className="text-xs font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                  {newCount} new
                </span>
              )}
              {learningCount > 0 && (
                <span className="text-xs font-medium text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
                  {learningCount} learning
                </span>
              )}
              {reviewCount > 0 && (
                <span className="text-xs font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                  {reviewCount} review
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {dueCount > 0 && (
            <Link
              to={`/deck/${deck.id}/study`}
              className="text-sm font-medium text-primary hover:text-primary-hover active:text-primary-hover no-underline transition-colors px-3 py-2.5 rounded"
            >
              Study
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
