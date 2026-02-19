import { Link } from 'react-router'

interface SessionStats {
  again: number
  hard: number
  good: number
  easy: number
}

interface StudyCompleteProps {
  deckId: number
  stats: SessionStats
  totalCards: number
}

export default function StudyComplete({
  deckId,
  stats,
  totalCards,
}: StudyCompleteProps) {
  return (
    <div className="text-center py-12 max-w-md mx-auto">
      <div className="text-4xl mb-4">&#10003;</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Complete</h2>
      <p className="text-gray-500 mb-6">
        You reviewed {totalCards} {totalCards === 1 ? 'card' : 'cards'}
      </p>

      <div className="grid grid-cols-4 gap-3 mb-8">
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-lg font-bold text-red-600">{stats.again}</div>
          <div className="text-xs text-red-500">Again</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="text-lg font-bold text-orange-600">{stats.hard}</div>
          <div className="text-xs text-orange-500">Hard</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-lg font-bold text-green-600">{stats.good}</div>
          <div className="text-xs text-green-500">Good</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-lg font-bold text-blue-600">{stats.easy}</div>
          <div className="text-xs text-blue-500">Easy</div>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <Link
          to={`/deck/${deckId}`}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 no-underline transition-colors"
        >
          Back to Deck
        </Link>
        <Link
          to="/"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 no-underline transition-colors"
        >
          Dashboard
        </Link>
      </div>
    </div>
  )
}
