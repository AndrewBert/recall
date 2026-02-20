import { useParams, Link } from 'react-router'
import { useDeck } from '../hooks/useDeck'
import { useStudySession } from '../hooks/useStudySession'
import { useDeckTheme } from '../hooks/useDeckTheme'
import StudySession from '../components/study/StudySession'

export default function StudyPage() {
  const { id } = useParams()
  const deckId = Number(id)
  const { data: deck, isLoading: deckLoading } = useDeck(deckId)
  const session = useStudySession(deckId)
  useDeckTheme(deck?.name)

  if (deckLoading || session.phase === 'loading') {
    return <div className="text-center py-12 text-secondary">Loading...</div>
  }

  if (deck === null || deck === undefined) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary mb-4">Deck not found.</p>
        <Link to="/" className="text-primary hover:text-primary-hover active:text-primary-hover">
          Back to decks
        </Link>
      </div>
    )
  }

  if (session.phase === 'empty') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-body mb-2">
          Nothing to study
        </h2>
        <p className="text-secondary mb-6">
          No cards are due for review in "{deck.name}".
        </p>
        <Link
          to={`/deck/${deck.id}`}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-hover active:bg-primary-hover no-underline transition-colors"
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
          className="text-sm text-secondary hover:text-body active:text-body no-underline"
        >
          &larr; {deck.name}
        </Link>
      </div>
      <StudySession session={session} deckId={deckId} />
    </div>
  )
}
