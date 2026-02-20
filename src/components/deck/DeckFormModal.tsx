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
            className="block text-sm font-medium text-secondary mb-1"
          >
            Name
          </label>
          <input
            id="deck-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Spanish Vocabulary"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            autoFocus
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="deck-description"
            className="block text-sm font-medium text-secondary mb-1"
          >
            Description (optional)
          </label>
          <textarea
            id="deck-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this deck about?"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
          />
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-secondary bg-surface-hover rounded-lg hover:bg-surface-active active:bg-surface-active transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full sm:w-auto px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-hover active:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
