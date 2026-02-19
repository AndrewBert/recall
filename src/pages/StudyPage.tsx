import { useParams, Link } from 'react-router'
import { useDeck } from '../hooks/useDeck'
import { useStudySession } from '../hooks/useStudySession'
import StudySession from '../components/study/StudySession'

export default function StudyPage() {
  const { id } = useParams()
  const deckId = Number(id)
  const deck = useDeck(deckId)
  const session = useStudySession(deckId)

  if (deck === undefined || session.phase === 'loading') {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  if (deck === null) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Deck not found.</p>
        <Link to="/" className="text-indigo-600 hover:text-indigo-800">
          Back to decks
        </Link>
      </div>
    )
  }

  if (session.phase === 'empty') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Nothing to study
        </h2>
        <p className="text-gray-500 mb-6">
          No cards are due for review in "{deck.name}".
        </p>
        <Link
          to={`/deck/${deck.id}`}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 no-underline transition-colors"
        >
          Back to Deck
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to={`/deck/${deck.id}`}
          className="text-sm text-gray-500 hover:text-gray-700 no-underline"
        >
          &larr; {deck.name}
        </Link>
      </div>
      <StudySession session={session} deckId={deckId} />
    </div>
  )
}
