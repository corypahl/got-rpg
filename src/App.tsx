import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ChampionsPage } from './pages/ChampionsPage'
import { DashboardPage } from './pages/DashboardPage'
import { EventsPage } from './pages/EventsPage'
import { TeamsPage } from './pages/TeamsPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/champions" element={<ChampionsPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
