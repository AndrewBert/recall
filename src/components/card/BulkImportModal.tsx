import { useState, useMemo } from 'react'
import Modal from '../ui/Modal'

type Delimiter = 'tab' | 'comma' | 'semicolon'

interface BulkImportModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (pairs: { front: string; back: string }[]) => Promise<void>
}

const DELIMITER_CHARS: Record<Delimiter, string> = {
  tab: '\t',
  comma: ',',
  semicolon: ';',
}

const DELIMITER_LABELS: Record<Delimiter, string> = {
  tab: 'Tab',
  comma: 'Comma',
  semicolon: 'Semicolon',
}

const MAX_CARDS = 200

function detectDelimiter(text: string): Delimiter {
  const firstLine = text.split('\n').find((line) => line.trim().length > 0)
  if (!firstLine) return 'tab'
  if (firstLine.includes('\t')) return 'tab'
  if (firstLine.includes(';')) return 'semicolon'
  if (firstLine.includes(',')) return 'comma'
  return 'tab'
}

function parseCards(text: string, delimiter: Delimiter) {
  const char = DELIMITER_CHARS[delimiter]
  const lines = text.split('\n')
  const valid: { front: string; back: string }[] = []
  let skippedCount = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length === 0) continue

    const sepIndex = trimmed.indexOf(char)
    if (sepIndex === -1) {
      skippedCount++
      continue
    }

    const front = trimmed.slice(0, sepIndex).trim()
    const back = trimmed.slice(sepIndex + 1).trim()

    if (front.length === 0 || back.length === 0) {
      skippedCount++
      continue
    }

    valid.push({ front, back })
  }

  return { valid, skippedCount }
}

export default function BulkImportModal({
  open,
  onClose,
  onSubmit,
}: BulkImportModalProps) {
  const [text, setText] = useState('')
  const [delimiter, setDelimiter] = useState<Delimiter>('tab')
  const [autoDetected, setAutoDetected] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { valid, skippedCount } = useMemo(
    () => parseCards(text, delimiter),
    [text, delimiter],
  )

  function handleTextChange(value: string) {
    setText(value)
    setError('')
    if (autoDetected) {
      setDelimiter(detectDelimiter(value))
    }
  }

  function handleDelimiterChange(d: Delimiter) {
    setDelimiter(d)
    setAutoDetected(false)
  }

  function handleClose() {
    setText('')
    setError('')
    setAutoDetected(true)
    onClose()
  }

  async function handleSubmit() {
    if (valid.length === 0 || valid.length > MAX_CARDS) return

    setSubmitting(true)
    setError('')
    try {
      await onSubmit(valid)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import Cards" size="lg">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="bulk-text"
            className="block text-sm font-medium text-secondary mb-1"
          >
            Paste your cards (one per line, front{DELIMITER_LABELS[delimiter].toLowerCase()}{' '}separated from back)
          </label>
          <textarea
            id="bulk-text"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={`front${DELIMITER_CHARS[delimiter]}back\nWhat is 2+2?${DELIMITER_CHARS[delimiter]}4\nCapital of France?${DELIMITER_CHARS[delimiter]}Paris`}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-y font-mono text-sm"
            autoFocus
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-secondary">Delimiter:</span>
          {(Object.keys(DELIMITER_CHARS) as Delimiter[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDelimiterChange(d)}
              className={`px-2.5 py-1.5 text-xs rounded-md cursor-pointer transition-colors ${
                delimiter === d
                  ? 'bg-primary/20 text-primary font-medium'
                  : 'bg-surface-hover text-secondary hover:bg-surface-active active:bg-surface-active'
              }`}
            >
              {DELIMITER_LABELS[d]}
            </button>
          ))}
        </div>

        {valid.length > 0 && (
          <div>
            <p className="text-sm font-medium text-secondary mb-2">
              Preview ({valid.length} {valid.length === 1 ? 'card' : 'cards'})
            </p>
            <div className="border border-border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-page sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-secondary font-medium">Front</th>
                    <th className="text-left px-3 py-2 text-secondary font-medium">Back</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-hover">
                  {valid.map((card, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5 text-body truncate max-w-[200px]">
                        {card.front}
                      </td>
                      <td className="px-3 py-1.5 text-body truncate max-w-[200px]">
                        {card.back}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {skippedCount > 0 && (
          <p className="text-sm text-amber-600">
            {skippedCount} {skippedCount === 1 ? 'line' : 'lines'} skipped (missing delimiter or empty front/back)
          </p>
        )}

        {valid.length > MAX_CARDS && (
          <p className="text-sm text-red-600">
            Too many cards ({valid.length}). Maximum is {MAX_CARDS} per import.
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-4 py-2 text-secondary bg-surface-hover rounded-lg hover:bg-surface-active active:bg-surface-active transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={valid.length === 0 || valid.length > MAX_CARDS || submitting}
            className="w-full sm:w-auto px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-hover active:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {submitting
              ? 'Importing...'
              : `Import ${valid.length} ${valid.length === 1 ? 'Card' : 'Cards'}`}
          </button>
        </div>
      </div>
    </Modal>
  )
}
