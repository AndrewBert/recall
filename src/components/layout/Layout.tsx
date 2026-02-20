import { Outlet } from 'react-router'
import Header from './Header'

export default function Layout() {
  return (
    <div className="min-h-screen bg-page">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  )
}
