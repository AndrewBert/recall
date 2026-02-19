import { useState } from 'react'
import { useDecks } from '../hooks/useDecks'
import { useDueCounts } from '../hooks/useDueCounts'
import { useCardCounts } from '../hooks/useCardCounts'
import { createDeck, updateDeck, deleteDeck } from '../services/deckService'
import DeckList from '../components/deck/DeckList'
import DeckFormModal from '../components/deck/DeckFormModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import type { Deck } from '../models/types'

export default function DashboardPage() {
  const decks = useDecks()
  const dueCounts = useDueCounts()
  const cardCounts = useCardCounts()

  const [formOpen, setFormOpen] = useState(false)
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)
  const [deletingDeck, setDeletingDeck] = useState<Deck | null>(null)

  if (decks === undefined || dueCounts === undefined || cardCounts === undefined) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  const totalDue = Object.values(dueCounts).reduce((a, b) => a + b, 0)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Decks</h1>
          {totalDue > 0 && (
            <p className="text-sm text-amber-600 mt-1">
              {totalDue} {totalDue === 1 ? 'card' : 'cards'} due for review
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setEditingDeck(null)
            setFormOpen(true)
          }}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-700 transition-colors cursor-pointer"
        >
          + New Deck
        </button>
      </div>

      <DeckList
        decks={decks}
        cardCounts={cardCounts}
        dueCounts={dueCounts}
        onEdit={(deck) => {
          setEditingDeck(deck)
          setFormOpen(true)
        }}
        onDelete={setDeletingDeck}
        onCreateFirst={() => {
          setEditingDeck(null)
          setFormOpen(true)
        }}
      />

      <DeckFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        deck={editingDeck}
        onSubmit={async (name, description) => {
          if (editingDeck) {
            await updateDeck(editingDeck.id, { name, description })
          } else {
            await createDeck(name, description)
          }
        }}
      />

      <ConfirmDialog
        open={!!deletingDeck}
        onClose={() => setDeletingDeck(null)}
        onConfirm={async () => {
          if (deletingDeck) await deleteDeck(deletingDeck.id)
        }}
        title="Delete Deck"
        message={`Delete "${deletingDeck?.name}" and all its cards? This cannot be undone.`}
      />
    </div>
  )
}
