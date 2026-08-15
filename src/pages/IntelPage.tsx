import { ArrowUpRight, CalendarDays, Clock3, ExternalLink, Radio, ScrollText } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { useNewsFeed } from '../hooks/useNewsFeed'
import { classNames, daysBetween, formatDate } from '../lib/format'
import type { GameEvent } from '../types'

export function IntelPage() {
  const { feed, error } = useNewsFeed()
  const [tab, setTab] = useState<'events' | 'news'>('events')
  const events = useMemo(() => [...(feed?.events ?? [])].sort((a, b) => a.startsAt.localeCompare(b.startsAt)), [feed])

  return (
    <div className="page">
      <PageHeader
        eyebrow="The ravenry"
        title="News & events"
        description="Official dispatches and upcoming campaigns, gathered into one field calendar."
        actions={<a className="button button--ghost" href={feed?.sourceUrl ?? 'https://www.gameofthroneslegends.com/news'} target="_blank" rel="noreferrer">Official news <ExternalLink size={16} /></a>}
      />

      <div className="intel-tabs" role="tablist">
        <button className={tab === 'events' ? 'intel-tab intel-tab--active' : 'intel-tab'} onClick={() => setTab('events')}><CalendarDays size={17} /> Event calendar</button>
        <button className={tab === 'news' ? 'intel-tab intel-tab--active' : 'intel-tab'} onClick={() => setTab('news')}><ScrollText size={17} /> Latest dispatches</button>
        {feed && <span>Feed updated {formatDate(feed.updatedAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>}
      </div>

      {error ? (
        <section className="panel"><EmptyState icon={Radio} title="The ravens were delayed" body="Open the official news page for the latest dispatches." /></section>
      ) : tab === 'events' ? (
        <EventCalendar events={events} />
      ) : (
        <section className="news-grid">
          {feed?.items.map((item, index) => (
            <a className={classNames('news-card', index === 0 && 'news-card--featured')} href={item.url} target="_blank" rel="noreferrer" key={item.url}>
              <div className="news-card__art"><span>{item.category}</span><i>{String(index + 1).padStart(2, '0')}</i></div>
              <div className="news-card__body">
                <span className="eyebrow">{formatDate(item.date)}</span>
                <h2>{item.title}</h2>
                <p>{item.summary}</p>
                <span className="text-link">Read official dispatch <ArrowUpRight size={15} /></span>
              </div>
            </a>
          )) ?? <div className="skeleton-card" />}
        </section>
      )}
    </div>
  )
}

function EventCalendar({ events }: { events: GameEvent[] }) {
  const now = Date.now()
  const relevant = events.filter((event) => new Date(event.endsAt).getTime() > now)
  return (
    <section className="event-calendar panel">
      <div className="event-calendar__legend">
        <span><i className="status-dot status-dot--active" /> Active now</span>
        <span><i className="status-dot" /> Upcoming</span>
        <small>Times shown in your local timezone</small>
      </div>
      <div className="event-timeline">
        {relevant.map((event) => {
          const start = new Date(event.startsAt).getTime()
          const end = new Date(event.endsAt).getTime()
          const active = start <= now && end > now
          const days = active ? daysBetween(new Date().toISOString(), event.endsAt) : daysBetween(new Date().toISOString(), event.startsAt)
          return (
            <article className={active ? 'event-row event-row--active' : 'event-row'} key={`${event.title}-${event.startsAt}`}>
              <div className="event-row__date"><span>{formatDate(event.startsAt, { month: 'short' })}</span><strong>{formatDate(event.startsAt, { day: '2-digit' })}</strong><small>{formatDate(event.startsAt, { weekday: 'short' })}</small></div>
              <div className="event-row__line"><i /></div>
              <div className="event-row__body">
                <div><span className="pill">{event.type}</span>{active && <span className="live-chip"><i /> Live</span>}</div>
                <h2>{event.title}</h2>
                {event.featured && <p>{event.featured}</p>}
                <span className="event-row__time"><Clock3 size={14} /> {formatDate(event.startsAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} – {formatDate(event.endsAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
              <div className="event-row__countdown"><strong>{days}</strong><span>days {active ? 'left' : 'away'}</span></div>
            </article>
          )
        })}
        {!relevant.length && <EmptyState icon={CalendarDays} title="No campaigns on the horizon" body="The event feed will refresh when the next official calendar arrives." />}
      </div>
    </section>
  )
}
