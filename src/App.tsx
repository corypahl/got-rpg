import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { useLedger } from './hooks/useLedger'
import { DashboardPage } from './pages/DashboardPage'
import { IntelPage } from './pages/IntelPage'
import { RosterPage } from './pages/RosterPage'
import { SettingsPage } from './pages/SettingsPage'
import { TeamBuilderPage } from './pages/TeamBuilderPage'

export default function App() {
  const ledger = useLedger()
  return (
    <Layout ledger={ledger}>
      <Routes>
        <Route path="/" element={<DashboardPage ledger={ledger} />} />
        <Route path="/roster" element={<RosterPage ledger={ledger} />} />
        <Route path="/teams" element={<TeamBuilderPage ledger={ledger} />} />
        <Route path="/intel" element={<IntelPage />} />
        <Route path="/settings" element={<SettingsPage ledger={ledger} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
