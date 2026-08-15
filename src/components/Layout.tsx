import { BookOpenText, CalendarDays, Database, LayoutDashboard, Menu, Shield, Swords, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { classNames } from '../lib/format'
import { champions, releaseRadar, teams } from '../data/gameData'
import { Crest } from './Crest'

const navigation = [
  { to: '/', label: 'The Briefing', icon: LayoutDashboard, end: true },
  { to: '/champions', label: 'Champions', icon: Shield },
  { to: '/teams', label: 'Team Library', icon: Swords },
  { to: '/events', label: 'Events & Radar', icon: CalendarDays },
]

export function Layout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <Crest />
        <button className="icon-button" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle navigation">{mobileOpen ? <X /> : <Menu />}</button>
      </header>
      <aside className={classNames('sidebar', mobileOpen && 'sidebar--open')}>
        <div className="sidebar__brand"><Crest /></div>
        <div className="sidebar__house index-status">
          <span className="eyebrow">Strategy index</span>
          <strong>Live field guide</strong>
          <div><span><Database size={12} /> {champions.length} champions</span><span>{teams.length} teams</span></div>
        </div>
        <nav className="sidebar__nav" aria-label="Primary navigation">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => classNames('nav-item', isActive && 'nav-item--active')}>
              <Icon size={19} strokeWidth={1.7} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__watch">
          <span className="eyebrow">On the horizon</span>
          <strong>{releaseRadar[0].name}</strong>
          <small>{releaseRadar[0].eta} · Alliance Shop</small>
        </div>
        <div className="sidebar__footer">
          <a className="nav-item" href="https://www.gameofthroneslegends.com/news" target="_blank" rel="noreferrer"><BookOpenText size={19} strokeWidth={1.7} /><span>Official news</span></a>
        </div>
      </aside>
      {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <main className="main-content">{children}</main>
    </div>
  )
}
