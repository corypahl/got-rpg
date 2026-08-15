import { ArrowRight, CalendarClock, ChevronRight, CloudUpload, Crown, ImagePlus, ShieldCheck, Sparkles, Swords, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ChampionAvatar } from '../components/ChampionAvatar'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import type { Ledger } from '../hooks/useLedger'
import { useNewsFeed } from '../hooks/useNewsFeed'
import { daysBetween, formatDate, formatPower, relativeTime } from '../lib/format'

export function DashboardPage({ ledger }: { ledger: Ledger }) {
  const { feed } = useNewsFeed()
  const strongest = [...ledger.data.roster].sort((a, b) => b.power - a.power).slice(0, 5)
  const futureEvents = feed?.events.filter((event) => new Date(event.startsAt).getTime() > Date.now()) ?? []
  const activeEvents = feed?.events.filter((event) => new Date(event.startsAt).getTime() <= Date.now() && new Date(event.endsAt).getTime() > Date.now()) ?? []
  const nextEvent = [...(futureEvents.length ? futureEvents : activeEvents)]
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0]
  const latestNews = feed?.items[0]

  return (
    <div className="page page--dashboard">
      <PageHeader
        eyebrow="Your command"
        title={`Welcome, ${ledger.data.houseName}`}
        description="Keep the realm in order. Your collection, formations, and incoming ravens are gathered here."
        actions={<Link className="button button--primary" to="/roster"><ImagePlus size={17} /> Scan roster</Link>}
      />

      {ledger.data.roster.length === 0 && (
        <section className="onboarding-banner panel-ornament">
          <div className="onboarding-banner__sigil"><Sparkles /></div>
          <div>
            <span className="eyebrow">Begin your chronicle</span>
            <h2>Your ledger is waiting to be written.</h2>
            <p>Import a champion roster screenshot, add champions by hand, or explore with sample data before adding your own.</p>
          </div>
          <div className="onboarding-banner__actions">
            <Link className="button button--primary" to="/roster">Import screenshot</Link>
            <button className="button button--ghost" onClick={ledger.loadDemo}>Load sample roster</button>
          </div>
        </section>
      )}

      <section className="stat-grid" aria-label="Collection summary">
        <article className="stat-card stat-card--gold">
          <span className="stat-card__icon"><ShieldCheck /></span>
          <div><span>Unlocked champions</span><strong>{ledger.stats.champions}</strong></div>
          <Link to="/roster">View roster <ArrowRight size={14} /></Link>
        </article>
        <article className="stat-card stat-card--ice">
          <span className="stat-card__icon"><Trophy /></span>
          <div><span>Combined power</span><strong>{formatPower(ledger.stats.combinedPower)}</strong></div>
          <small>Across your full roster</small>
        </article>
        <article className="stat-card stat-card--ember">
          <span className="stat-card__icon"><Swords /></span>
          <div><span>Saved formations</span><strong>{ledger.stats.teams}</strong></div>
          <Link to="/teams">Enter war room <ArrowRight size={14} /></Link>
        </article>
        <article className="stat-card stat-card--green">
          <span className="stat-card__icon"><Crown /></span>
          <div><span>Sworn favorites</span><strong>{ledger.stats.favorites}</strong></div>
          <small>Your marked champions</small>
        </article>
      </section>

      <div className="dashboard-grid">
        <section className="panel panel--wide">
          <header className="section-heading">
            <div><span className="eyebrow">The vanguard</span><h2>Strongest champions</h2></div>
            <Link to="/roster">Full roster <ChevronRight size={15} /></Link>
          </header>
          {strongest.length ? (
            <div className="power-list">
              {strongest.map((champion, index) => (
                <div className="power-row" key={champion.id}>
                  <span className="power-row__rank">{String(index + 1).padStart(2, '0')}</span>
                  <ChampionAvatar champion={champion} compact />
                  <div className="power-row__name"><strong>{champion.name}</strong><span>{champion.faction} · {champion.role}</span></div>
                  <div className="stars" aria-label={`${champion.stars} stars`}>{'★'.repeat(champion.stars)}<i>{'★'.repeat(6 - champion.stars)}</i></div>
                  <strong className="power-row__power">{formatPower(champion.power)} <small>POW</small></strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={ShieldCheck} title="No champions recorded" body="A screenshot of your roster is the quickest way to begin." />
          )}
        </section>

        <section className="panel intel-teaser">
          <header className="section-heading"><div><span className="eyebrow">Coming to the realm</span><h2>Next event</h2></div></header>
          {nextEvent ? (
            <>
              <div className="event-date-block">
                <span>{formatDate(nextEvent.startsAt, { month: 'short' })}</span>
                <strong>{formatDate(nextEvent.startsAt, { day: '2-digit' })}</strong>
              </div>
              <span className="pill pill--gold">{nextEvent.type}</span>
              <h3>{nextEvent.title}</h3>
              {nextEvent.featured && <p>{nextEvent.featured}</p>}
              <div className="countdown-line"><CalendarClock size={16} /><span>{daysBetween(new Date().toISOString(), nextEvent.startsAt)} days until banners rise</span></div>
              <Link className="text-link" to="/intel">View campaign calendar <ArrowRight size={15} /></Link>
            </>
          ) : <div className="skeleton-card" />}
        </section>

        <section className="panel">
          <header className="section-heading"><div><span className="eyebrow">The rookery</span><h2>Latest raven</h2></div></header>
          {latestNews ? (
            <article className="news-teaser">
              <span className="pill">{latestNews.category}</span>
              <h3>{latestNews.title}</h3>
              <p>{latestNews.summary}</p>
              <div><span>{formatDate(latestNews.date)}</span><a href={latestNews.url} target="_blank" rel="noreferrer">Read dispatch <ArrowRight size={14} /></a></div>
            </article>
          ) : <div className="skeleton-card" />}
        </section>

        <section className="panel activity-panel">
          <header className="section-heading"><div><span className="eyebrow">Recent changes</span><h2>Ledger activity</h2></div></header>
          {ledger.data.activity.length ? (
            <div className="activity-list">
              {ledger.data.activity.slice(0, 5).map((item) => (
                <div className="activity-row" key={item.id}>
                  <span className="activity-row__dot" />
                  <div><strong>{item.message}</strong><small>{relativeTime(item.createdAt)}</small></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="activity-empty"><CloudUpload size={22} /><p>Changes to your roster and teams will appear here.</p></div>
          )}
        </section>
      </div>
    </div>
  )
}
