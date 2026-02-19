import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import type { CardRecord } from '../../models/types'

interface CardFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (front: string, back: string) => void
  card?: CardRecord | null
}

export default function CardFormModal({
  open,
  onClose,
  onSubmit,
  card,
}: CardFormModalProps) {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')

  const isEdit = !!card

  useEffect(() => {
    if (card) {
      setFront(card.front)
      setBack(card.back)
    } else {
      setFront('')
      setBack('')
    }
  }, [card, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedFront = front.trim()
    const trimmedBack = back.trim()
    if (!trimmedFront || !trimmedBack) return
    onSubmit(trimmedFront, trimmedBack)
    if (!isEdit) {
      setFront('')
      setBack('')
    } else {
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Card' : 'Add Card'}
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="card-front"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Front
          </label>
          <textarea
            id="card-front"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder="Question or term"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
            autoFocus
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="card-back"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Back
          </label>
          <textarea
            id="card-back"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="Answer or definition"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
          />
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-200 transition-colors cursor-pointer"
          >
            {isEdit ? 'Cancel' : 'Done'}
          </button>
          <button
            type="submit"
            disabled={!front.trim() || !back.trim()}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isEdit ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
