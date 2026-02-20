import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { useDeck } from '../hooks/useDeck'
import { useDeckCards } from '../hooks/useDeckCards'
import { useDueCards } from '../hooks/useDueCards'
import { addCard, addCardsBulk, updateCard, deleteCard } from '../services/cardService'
import { deleteDeck, updateDeck } from '../services/deckService'
import CardList from '../components/card/CardList'
import CardFormModal from '../components/card/CardFormModal'
import BulkImportModal from '../components/card/BulkImportModal'
import DeckFormModal from '../components/deck/DeckFormModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import type { CardRecord } from '../models/types'

export default function DeckDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const deckId = Number(id)
  const { data: deck, isLoading: deckLoading } = useDeck(deckId)
  const { data: cards, isLoading: cardsLoading } = useDeckCards(deckId)
  const { data: dueCards, isLoading: dueLoading } = useDueCards(deckId)

  const dueCount = dueCards?.length ?? 0

  const [cardFormOpen, setCardFormOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CardRecord | null>(null)
  const [deletingCard, setDeletingCard] = useState<CardRecord | null>(null)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [editDeckOpen, setEditDeckOpen] = useState(false)
  const [deleteDeckOpen, setDeleteDeckOpen] = useState(false)

  if (deckLoading || cardsLoading || dueLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  if (deck === null || deck === undefined) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Deck not found.</p>
        <Link to="/" className="text-indigo-600 hover:text-indigo-800 active:text-indigo-800">
          Back to decks
        </Link>
      </div>
    )
  }

  const cardList = cards ?? []

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/"
          className="text-sm text-gray-500 hover:text-gray-700 active:text-gray-700 no-underline"
        >
          &larr; All Decks
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{deck.name}</h1>
          {deck.description && (
            <p className="text-gray-500 mt-1">{deck.description}</p>
          )}
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            <span>{cardList.length} {cardList.length === 1 ? 'card' : 'cards'}</span>
            {dueCount > 0 && (
              <span className="text-amber-600 font-medium">
                {dueCount} due
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setEditDeckOpen(true)}
            className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-200 transition-colors cursor-pointer"
          >
            Edit Deck
          </button>
          <button
            onClick={() => setDeleteDeckOpen(true)}
            className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 active:bg-red-100 transition-colors cursor-pointer"
          >
            Delete
          </button>
          {dueCount > 0 && (
            <Link
              to={`/deck/${deck.id}/study`}
              className="w-full sm:w-auto text-center px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-700 transition-colors no-underline"
            >
              Study ({dueCount})
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Cards</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setBulkImportOpen(true)}
            className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-200 transition-colors cursor-pointer"
          >
            Import
          </button>
          <button
            onClick={() => {
              setEditingCard(null)
              setCardFormOpen(true)
            }}
            className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-700 transition-colors cursor-pointer"
          >
            + Add Card
          </button>
        </div>
      </div>

      {cardList.length === 0 ? (
        <EmptyState
          message="No cards in this deck yet."
          action={{
            label: 'Add Card',
            onClick: () => {
              setEditingCard(null)
              setCardFormOpen(true)
            },
          }}
        />
      ) : (
        <CardList
          cards={cardList}
          onEdit={(card) => {
            setEditingCard(card)
            setCardFormOpen(true)
          }}
          onDelete={setDeletingCard}
        />
      )}

      <CardFormModal
        open={cardFormOpen}
        onClose={() => {
          setCardFormOpen(false)
          setEditingCard(null)
        }}
        card={editingCard}
        onSubmit={async (front, back) => {
          if (editingCard) {
            await updateCard(editingCard.id, { front, back }, deckId)
          } else {
            await addCard(deckId, front, back)
          }
        }}
      />

      <BulkImportModal
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onSubmit={(pairs) => addCardsBulk(deckId, pairs)}
      />

      <ConfirmDialog
        open={!!deletingCard}
        onClose={() => setDeletingCard(null)}
        onConfirm={async () => {
          if (deletingCard) await deleteCard(deletingCard.id, deckId)
        }}
        title="Delete Card"
        message="Delete this card and its review history? This cannot be undone."
      />

      <DeckFormModal
        open={editDeckOpen}
        onClose={() => setEditDeckOpen(false)}
        deck={deck}
        onSubmit={async (name, description) => {
          await updateDeck(deck.id, { name, description })
        }}
      />

      <ConfirmDialog
        open={deleteDeckOpen}
        onClose={() => setDeleteDeckOpen(false)}
        onConfirm={async () => {
          await deleteDeck(deck.id)
          navigate('/')
        }}
        title="Delete Deck"
        message={`Delete "${deck.name}" and all its cards? This cannot be undone.`}
      />
    </div>
  )
}
