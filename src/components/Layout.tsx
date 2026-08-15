import { BookOpenText, CalendarDays, Cloud, CloudOff, LayoutDashboard, Menu, Settings, ShieldPlus, Swords, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { classNames } from '../lib/format'
import type { Ledger } from '../hooks/useLedger'
import { Crest } from './Crest'

const navigation = [
  { to: '/', label: 'Command', icon: LayoutDashboard, end: true },
  { to: '/roster', label: 'Roster', icon: ShieldPlus },
  { to: '/teams', label: 'War Room', icon: Swords },
  { to: '/intel', label: 'Ravenry', icon: CalendarDays },
]

export function Layout({ children, ledger }: { children: ReactNode; ledger: Ledger }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const syncLabel = ledger.syncState === 'synced'
    ? 'S3 secured'
    : ledger.syncState === 'syncing'
      ? 'Syncing…'
      : ledger.syncState === 'error'
        ? 'Sync issue'
        : 'Local only'
  const SyncIcon = ledger.syncState === 'synced' || ledger.syncState === 'syncing' ? Cloud : CloudOff

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <Crest />
        <button className="icon-button" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle navigation">
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </header>

      <aside className={classNames('sidebar', mobileOpen && 'sidebar--open')}>
        <div className="sidebar__brand"><Crest /></div>
        <div className="sidebar__house">
          <span className="eyebrow">Sworn account</span>
          <strong>{ledger.data.houseName}</strong>
          <span className={classNames('sync-chip', `sync-chip--${ledger.syncState}`)}>
            <SyncIcon size={13} /> {syncLabel}
          </span>
        </div>

        <nav className="sidebar__nav" aria-label="Primary navigation">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => classNames('nav-item', isActive && 'nav-item--active')}
            >
              <Icon size={19} strokeWidth={1.7} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <NavLink to="/settings" className={({ isActive }) => classNames('nav-item', isActive && 'nav-item--active')}>
            <Settings size={19} strokeWidth={1.7} />
            <span>Settings</span>
          </NavLink>
          <a className="nav-item" href="https://www.gameofthroneslegends.com/news" target="_blank" rel="noreferrer">
            <BookOpenText size={19} strokeWidth={1.7} />
            <span>Official news</span>
          </a>
        </div>
      </aside>

      {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <main className="main-content">{children}</main>
    </div>
  )
}
