import { Link } from 'react-router'

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-indigo-600 no-underline">
          FlashCards
        </Link>
        <nav className="flex gap-4">
          <Link
            to="/"
            className="text-gray-600 hover:text-indigo-600 active:text-indigo-600 no-underline transition-colors py-2"
          >
            Decks
          </Link>
          <Link
            to="/stats"
            className="text-gray-600 hover:text-indigo-600 active:text-indigo-600 no-underline transition-colors py-2"
          >
            Stats
          </Link>
        </nav>
      </div>
    </header>
  )
}
