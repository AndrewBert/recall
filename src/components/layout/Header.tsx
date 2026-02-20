import { Link } from 'react-router'

export default function Header() {
  return (
    <header className="bg-surface border-b border-border">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-primary no-underline">
          FlashCards
        </Link>
        <nav className="flex gap-4">
          <Link
            to="/"
            className="text-secondary hover:text-primary active:text-primary no-underline transition-colors py-2"
          >
            Decks
          </Link>
          <Link
            to="/stats"
            className="text-secondary hover:text-primary active:text-primary no-underline transition-colors py-2"
          >
            Stats
          </Link>
        </nav>
      </div>
    </header>
  )
}
