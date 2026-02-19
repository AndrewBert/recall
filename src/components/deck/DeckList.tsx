import type { Deck } from '../../models/types'
import DeckCard from './DeckCard'
import EmptyState from '../ui/EmptyState'

interface DeckListProps {
  decks: Deck[]
  cardCounts: Record<number, number>
  dueCounts: Record<number, number>
  onEdit: (deck: Deck) => void
  onDelete: (deck: Deck) => void
  onCreateFirst: () => void
}

export default function DeckList({
  decks,
  cardCounts,
  dueCounts,
  onEdit,
  onDelete,
  onCreateFirst,
}: DeckListProps) {
  if (decks.length === 0) {
    return (
      <EmptyState
        message="No decks yet. Create your first deck to start learning."
        action={{ label: 'Create Deck', onClick: onCreateFirst }}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {decks.map((deck) => (
        <DeckCard
          key={deck.id}
          deck={deck}
          cardCount={cardCounts[deck.id] ?? 0}
          dueCount={dueCounts[deck.id] ?? 0}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
