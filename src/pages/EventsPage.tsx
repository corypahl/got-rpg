import { ArrowUpRight, CalendarDays, CheckCircle2, Clock3, ExternalLink, Radio, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ChampionAvatar } from '../components/ChampionAvatar'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { championById, eventChampionMap, releaseRadar } from '../data/gameData'
import { useNewsFeed } from '../hooks/useNewsFeed'
import { daysBetween, formatDate } from '../lib/format'

export function EventsPage() {
  const { feed, error } = useNewsFeed()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'events' | 'news'>('events')
  const events = useMemo(() => (feed?.events ?? []).filter((event) => {
    if (new Date(event.endsAt) <= new Date()) return false
    const featured = (eventChampionMap[event.title] ?? []).map((id) => championById.get(id)).filter(Boolean)
    const searchable = [event.title, event.type, event.featured, ...featured.flatMap((champion) => champion ? [champion.name, champion.title, ...champion.factions] : [])].join(' ').toLowerCase()
    return !query.trim() || searchable.includes(query.toLowerCase().trim())
  }).sort((a, b) => a.startsAt.localeCompare(b.startsAt)), [feed, query])

  return <div className="page events-page">
    <PageHeader eyebrow="Ravens & banners" title="Events and release radar" description="See which champions are featured now, who is returning soon, and which unreleased characters have been officially signaled." actions={<a className="button button--ghost" href="https://www.gameofthroneslegends.com/news" target="_blank" rel="noreferrer">Official source <ExternalLink size={15} /></a>} />
    <section className="release-radar-grid">{releaseRadar.map((item, index) => <a href={item.sourceUrl} target="_blank" rel="noreferrer" className={index === 0 ? 'radar-card radar-card--lead' : 'radar-card'} key={item.id}><div><span className="pill pill--gold">{item.status}</span><Sparkles size={17} /></div><span className="eyebrow">{item.eta}</span><h2>{item.name}</h2><p>{item.detail}</p><footer>Read source <ArrowUpRight size={14} /></footer></a>)}</section>
    <div className="intel-tabs" role="tablist"><button className={tab === 'events' ? 'intel-tab intel-tab--active' : 'intel-tab'} onClick={() => setTab('events')}><CalendarDays size={17} /> Featured events</button><button className={tab === 'news' ? 'intel-tab intel-tab--active' : 'intel-tab'} onClick={() => setTab('news')}><Radio size={17} /> Latest dispatches</button>{feed && <span>Feed updated {formatDate(feed.updatedAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>}</div>
    {error ? <section className="panel"><EmptyState icon={Radio} title="The ravens were delayed" body="Open the official news page for the latest dispatches." /></section> : tab === 'events' ? <>
      <label className="event-search search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by champion, faction, or event…" /></label>
      <section className="linked-event-list">{events.map((event) => <LinkedEvent key={event.title} event={event} />)}{!events.length && <div className="panel"><EmptyState icon={Search} title="No featured events match" body="Try a champion name, faction, or clear the search." /></div>}</section>
    </> : <section className="news-grid">{feed?.items.map((item, index) => <a className={index === 0 ? 'news-card news-card--featured' : 'news-card'} href={item.url} target="_blank" rel="noreferrer" key={item.url}><div className="news-card__art"><span>{item.category}</span><i>{String(index + 1).padStart(2, '0')}</i></div><div className="news-card__body"><span className="eyebrow">{formatDate(item.date)}</span><h2>{item.title}</h2><p>{item.summary}</p><span className="text-link">Read official dispatch <ArrowUpRight size={15} /></span></div></a>)}</section>}
  </div>
}

function LinkedEvent({ event }: { event: NonNullable<ReturnType<typeof useNewsFeed>['feed']>['events'][number] }) {
  const now = new Date()
  const active = new Date(event.startsAt) <= now && new Date(event.endsAt) > now
  const roster = (eventChampionMap[event.title] ?? []).map((id) => championById.get(id)).filter(Boolean)
  const days = daysBetween(now.toISOString(), active ? event.endsAt : event.startsAt)
  return <article className={active ? 'linked-event linked-event--active panel' : 'linked-event panel'}>
    <div className="linked-event__date"><span>{formatDate(event.startsAt, { month: 'short' })}</span><strong>{formatDate(event.startsAt, { day: '2-digit' })}</strong><small>{active ? 'Live now' : `${days}d away`}</small></div>
    <div className="linked-event__body"><div><span className="pill">{event.type}</span>{active && <span className="live-chip"><i /> Live</span>}</div><h2>{event.title}</h2><p>{event.featured}</p><span><Clock3 size={13} /> {formatDate(event.startsAt, { month: 'short', day: 'numeric', hour: 'numeric' })} – {formatDate(event.endsAt, { month: 'short', day: 'numeric', hour: 'numeric' })}</span></div>
    <div className="linked-event__champions"><span className="eyebrow">Featured champions</span><div>{roster.map((champion) => champion && <div key={champion.id} title={`${champion.name}${champion.title ? ` — ${champion.title}` : ''}`}><ChampionAvatar champion={champion} compact /><strong>{champion.name}</strong></div>)}</div></div>
    <a href={event.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open source for ${event.title}`}><CheckCircle2 size={14} /> Official details <ArrowUpRight size={14} /></a>
  </article>
}
