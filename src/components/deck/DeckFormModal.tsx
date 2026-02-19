import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import type { Deck } from '../../models/types'

interface DeckFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (name: string, description: string) => void
  deck?: Deck | null
}

export default function DeckFormModal({
  open,
  onClose,
  onSubmit,
  deck,
}: DeckFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const isEdit = !!deck

  useEffect(() => {
    if (deck) {
      setName(deck.name)
      setDescription(deck.description)
    } else {
      setName('')
      setDescription('')
    }
  }, [deck, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    onSubmit(trimmedName, description.trim())
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Deck' : 'Create Deck'}
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="deck-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name
          </label>
          <input
            id="deck-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Spanish Vocabulary"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            autoFocus
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="deck-description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description (optional)
          </label>
          <textarea
            id="deck-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this deck about?"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
