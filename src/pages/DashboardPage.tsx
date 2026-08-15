import { ArrowRight, CalendarClock, ChevronRight, Crown, Radar, Search, Shield, Sparkles, Swords, Target, TrendingUp } from 'lucide-react'
import { FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChampionAvatar } from '../components/ChampionAvatar'
import { PageHeader } from '../components/PageHeader'
import { championById, champions, crownRegions, releaseRadar, teamById, teams } from '../data/gameData'
import { useNewsFeed } from '../hooks/useNewsFeed'
import { formatDate } from '../lib/format'

export function DashboardPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const { feed } = useNewsFeed()
  const today = new Date().getDay()
  const openRegions = crownRegions.filter((region) => region.days.includes(today))
  const liveEvents = feed?.events.filter((event) => new Date(event.startsAt) <= new Date() && new Date(event.endsAt) > new Date()) ?? []
  const nextEvent = useMemo(() => feed?.events.filter((event) => new Date(event.startsAt) > new Date()).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0], [feed])
  const featuredTeams = ['tyland-treasury', 'blacks-iron-defense', 'stark-fortress'].map((id) => teamById.get(id)).filter(Boolean)

  const search = (event: FormEvent) => {
    event.preventDefault()
    navigate(`/champions${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`)
  }

  return (
    <div className="page page--dashboard strategy-dashboard">
      <PageHeader
        eyebrow="The field briefing"
        title="Know the field. Build the answer."
        description="A living index of every champion, proven team shells, Crown Challenge routes, raid counters, and what is coming next."
        actions={<Link className="button button--primary" to="/teams"><Swords size={17} /> Browse team library</Link>}
      />

      <section className="strategy-hero panel-ornament">
        <div>
          <span className="eyebrow">Champion intelligence</span>
          <h2>{champions.length} champions. One searchable war table.</h2>
          <p>Find a champion, see where they fit, then jump directly to teams and current events that feature them.</p>
          <form className="hero-search" onSubmit={search}>
            <Search size={19} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Jon Snow, Birthright, Greens…" aria-label="Search the champion index" />
            <button type="submit">Search index <ArrowRight size={15} /></button>
          </form>
        </div>
        <div className="strategy-hero__seal"><Shield /><span>Updated</span><strong>Aug 15</strong><small>2026 field state</small></div>
      </section>

      <section className="stat-grid strategy-stats" aria-label="Index summary">
        <article className="stat-card stat-card--gold"><span className="stat-card__icon"><Shield /></span><div><span>Champion index</span><strong>{champions.length}</strong></div><Link to="/champions">Explore roster <ArrowRight size={14} /></Link></article>
        <article className="stat-card stat-card--ice"><span className="stat-card__icon"><Swords /></span><div><span>Team blueprints</span><strong>{teams.length}</strong></div><Link to="/teams">Compare teams <ArrowRight size={14} /></Link></article>
        <article className="stat-card stat-card--ember"><span className="stat-card__icon"><CalendarClock /></span><div><span>Live events</span><strong>{liveEvents.length}</strong></div><Link to="/events">See featured units <ArrowRight size={14} /></Link></article>
        <article className="stat-card stat-card--green"><span className="stat-card__icon"><Radar /></span><div><span>Release signals</span><strong>{releaseRadar.filter((item) => item.status !== 'New release').length}</strong></div><Link to="/events">Open release radar <ArrowRight size={14} /></Link></article>
      </section>

      <div className="strategy-grid">
        <section className="panel strategy-panel strategy-panel--wide">
          <header className="section-heading"><div><span className="eyebrow">Meta pulse</span><h2>Teams shaping the field</h2></div><Link to="/teams">Full library <ChevronRight size={15} /></Link></header>
          <div className="meta-team-list">
            {featuredTeams.map((team, index) => team && (
              <Link to={`/teams?team=${team.id}`} className="meta-team-row" key={team.id}>
                <span className="meta-rank">0{index + 1}</span>
                <div className="meta-team-row__avatars">
                  {team.championIds.map((id) => championById.get(id)).filter(Boolean).map((champion) => champion && <ChampionAvatar key={champion.id} champion={champion} compact leader={champion.id === team.leaderId} />)}
                </div>
                <div className="meta-team-row__copy"><span>{team.mode} · {team.evidence}</span><strong>{team.name}</strong><small>{team.summary}</small></div>
                <span className={`tier-mark tier-mark--${team.tier.toLowerCase()}`}>{team.tier}</span>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        </section>

        <section className="panel strategy-panel crown-today">
          <header className="section-heading"><div><span className="eyebrow">Open today</span><h2>Crown Challenge</h2></div><Crown size={19} /></header>
          <div className="crown-open-list">
            {openRegions.map((region) => {
              const team = teamById.get(region.teamId)
              return <Link to={`/teams?team=${region.teamId}`} key={region.id} className={`crown-open crown-open--${region.accent}`}><span><Target size={16} /></span><div><strong>{region.name}</strong><small>{region.factions.join(' · ')}</small><em>{team?.name}</em></div><ChevronRight size={15} /></Link>
            })}
          </div>
          <Link className="text-link" to="/teams?mode=Crown%20Challenge">View all four routes <ArrowRight size={15} /></Link>
        </section>

        <section className="panel strategy-panel release-card">
          <header className="section-heading"><div><span className="eyebrow">Release radar</span><h2>{releaseRadar[0].name}</h2></div><Sparkles size={18} /></header>
          <span className="pill pill--gold">{releaseRadar[0].status}</span>
          <p>{releaseRadar[0].detail}</p>
          <div className="radar-signal"><i /><span>{releaseRadar[0].eta}</span></div>
          <Link className="text-link" to="/events">Track all signals <ArrowRight size={15} /></Link>
        </section>

        <section className="panel strategy-panel event-next">
          <header className="section-heading"><div><span className="eyebrow">Next banner</span><h2>{nextEvent?.title ?? 'Reading the ravens…'}</h2></div><TrendingUp size={18} /></header>
          {nextEvent && <><span className="pill">{nextEvent.type}</span><p>{nextEvent.featured}</p><div className="event-next__date"><CalendarClock size={16} /><span>Begins {formatDate(nextEvent.startsAt, { month: 'short', day: 'numeric', hour: 'numeric' })}</span></div><Link className="text-link" to="/events">Open event intelligence <ArrowRight size={15} /></Link></>}
        </section>
      </div>
    </div>
  )
}
