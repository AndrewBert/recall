import { BrowserRouter, Routes, Route } from 'react-router'
import Layout from './components/layout/Layout'
import DashboardPage from './pages/DashboardPage'
import DeckDetailPage from './pages/DeckDetailPage'
import StudyPage from './pages/StudyPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="deck/:id" element={<DeckDetailPage />} />
          <Route path="deck/:id/study" element={<StudyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
