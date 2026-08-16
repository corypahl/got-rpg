import { ArrowUpRight, CheckCircle2, ChevronDown, Filter, Search, Shield, Swords, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChampionAvatar } from '../components/ChampionAvatar'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { allFactions, champions, eventChampionMap, teams } from '../data/gameData'
import { useNewsFeed } from '../hooks/useNewsFeed'
import type { Champion, ChampionRole, ChampionTier, GemColor, Rarity } from '../types'

type SelectValue<T> = 'all' | T
const tierOrder: Record<ChampionTier, number> = { S: 0, A: 1, B: 2, Unranked: 3 }

export function ChampionsPage() {
  const [params, setParams] = useSearchParams()
  const [rarity, setRarity] = useState<SelectValue<Rarity>>('all')
  const [faction, setFaction] = useState('all')
  const [role, setRole] = useState<SelectValue<ChampionRole>>('all')
  const [tier, setTier] = useState<SelectValue<ChampionTier>>('all')
  const [color, setColor] = useState<SelectValue<GemColor>>('all')
  const [selected, setSelected] = useState<Champion | null>(null)
  const query = params.get('q') ?? ''

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim()
    return champions.filter((champion) => {
      const searchable = [champion.name, champion.title, champion.role, ...champion.factions, ...champion.keywords].join(' ').toLowerCase()
      return (!normalized || searchable.includes(normalized))
        && (rarity === 'all' || champion.rarity === rarity)
        && (faction === 'all' || champion.factions.includes(faction))
        && (role === 'all' || champion.role === role)
        && (tier === 'all' || champion.tier === tier)
        && (color === 'all' || champion.color === color)
    }).sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier] || a.name.localeCompare(b.name))
  }, [color, faction, query, rarity, role, tier])

  const clearFilters = () => { setParams({}); setRarity('all'); setFaction('all'); setRole('all'); setTier('all'); setColor('all') }
  const hasFilters = Boolean(query || rarity !== 'all' || faction !== 'all' || role !== 'all' || tier !== 'all' || color !== 'all')

  return (
    <div className="page champions-page">
      <PageHeader eyebrow="The complete index" title="Champion roster" description="Search every indexed champion by name, variant, faction, role, color, mechanic, or current strategy tier." />
      <section className="index-toolbar panel">
        <label className="search-field index-search"><Search size={18} /><input value={query} onChange={(event) => setParams(event.target.value ? { q: event.target.value } : {})} placeholder="Name, faction, mechanic…" /></label>
        <FilterSelect label="Rarity" value={rarity} onChange={(value) => setRarity(value as SelectValue<Rarity>)} options={['Legendary', 'Epic', 'Common']} />
        <FilterSelect label="Faction" value={faction} onChange={setFaction} options={allFactions} />
        <FilterSelect label="Role" value={role} onChange={(value) => setRole(value as SelectValue<ChampionRole>)} options={['Fighter', 'Protector', 'Strategist', 'Mender', 'Marksman', 'Beast']} />
        <FilterSelect label="Tier" value={tier} onChange={(value) => setTier(value as SelectValue<ChampionTier>)} options={['S', 'A', 'B', 'Unranked']} />
        {hasFilters && <button className="clear-filter" onClick={clearFilters}><X size={14} /> Clear</button>}
      </section>
      <div className="color-strip" aria-label="Filter by gem color">
        <button className={color === 'all' ? 'color-chip color-chip--active' : 'color-chip'} onClick={() => setColor('all')}><Filter size={13} /> All colors</button>
        {(['red', 'blue', 'green', 'gold', 'purple'] as GemColor[]).map((value) => <button key={value} className={color === value ? 'color-chip color-chip--active' : 'color-chip'} onClick={() => setColor(value)}><i className={`gem gem--${value}`} /> {value}</button>)}
        <span><strong>{filtered.length}</strong> / {champions.length} champions</span>
      </div>
      {filtered.length ? <section className="index-grid">{filtered.map((champion) => <IndexChampionCard key={champion.id} champion={champion} onClick={() => setSelected(champion)} />)}</section> : <section className="panel"><EmptyState icon={Search} title="No champions match" body="Clear a filter or try a broader mechanic, faction, or variant name." /></section>}
      <ChampionDetail champion={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="filter-select"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="all">All</option>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={13} /></label>
}

function IndexChampionCard({ champion, onClick }: { champion: Champion; onClick: () => void }) {
  const appearances = teams.filter((team) => team.championIds.includes(champion.id)).length
  return <button className={`index-card index-card--${champion.color}`} onClick={onClick}>
    <div className="index-card__visual"><ChampionAvatar champion={champion} /><span className={`tier-mark tier-mark--${champion.tier.toLowerCase()}`}>{champion.tier === 'Unranked' ? '—' : champion.tier}</span>{champion.verified && <span className="verified-mark" title="Officially referenced"><CheckCircle2 size={12} /></span>}</div>
    <div className="index-card__body"><span className="eyebrow">{champion.rarity} · {champion.role}</span><h3>{champion.name}</h3><p>{champion.title || champion.factions.join(' / ')}</p><div className="keyword-row">{champion.keywords.slice(0, 3).map((keyword) => <span key={keyword}>{keyword}</span>)}</div><footer><span>{champion.factions[0]}</span><span>{appearances ? `${appearances} team${appearances > 1 ? 's' : ''}` : 'Indexed'}</span></footer></div>
  </button>
}

function ChampionDetail({ champion, onClose }: { champion: Champion | null; onClose: () => void }) {
  const { feed } = useNewsFeed()
  if (!champion) return <Modal open={false} title="Champion" onClose={onClose}><span /></Modal>
  const usedBy = teams.filter((team) => team.championIds.includes(champion.id))
  const events = feed?.events.filter((event) => eventChampionMap[event.title]?.includes(champion.id) && new Date(event.endsAt) > new Date()) ?? []
  return <Modal open title={champion.name} subtitle={champion.title || champion.factions.join(' / ')} onClose={onClose} size="large">
    <div className="champion-detail">
      <aside className={`champion-detail__identity champion-detail__identity--${champion.color}`}><ChampionAvatar champion={champion} /><span className={`tier-mark tier-mark--${champion.tier.toLowerCase()}`}>{champion.tier}</span><dl><div><dt>Rarity</dt><dd>{champion.rarity}</dd></div><div><dt>Role</dt><dd>{champion.role}</dd></div><div><dt>Gem</dt><dd>{champion.color}</dd></div></dl></aside>
      <div className="champion-detail__content">
        <section><span className="eyebrow">Faction allegiance</span><div className="detail-tags">{champion.factions.map((item) => <span key={item}>{item}</span>)}</div></section>
        <section><span className="eyebrow">Strategic mechanics</span><div className="detail-tags detail-tags--mechanic">{champion.keywords.map((item) => <span key={item}>{item}</span>)}</div></section>
        <section><div className="detail-section-heading"><div><span className="eyebrow">Formation usage</span><h3>{usedBy.length ? `${usedBy.length} indexed teams` : 'No featured team yet'}</h3></div><Swords size={18} /></div>{usedBy.map((team) => <Link to={`/teams?team=${team.id}`} className="detail-team-link" key={team.id} onClick={onClose}><span className={`tier-mark tier-mark--${team.tier.toLowerCase()}`}>{team.tier}</span><div><strong>{team.name}</strong><small>{team.mode} · {team.target}</small></div><ArrowUpRight size={15} /></Link>)}</section>
        {events.length > 0 && <section><span className="eyebrow">Currently featured</span>{events.map((event) => <Link to="/events" className="detail-event-link" key={event.title} onClick={onClose}><strong>{event.title}</strong><span>{event.type}</span></Link>)}</section>}
        <footer>{champion.verified ? <><CheckCircle2 size={14} /> {champion.imageUrl ? 'Portrait sourced from official game coverage' : 'Appears in official game coverage'}{champion.sourceUrl && <a href={champion.sourceUrl} target="_blank" rel="noreferrer">View source <ArrowUpRight size={12} /></a>}</> : <><Shield size={14} /> Community-indexed roster entry</>}</footer>
      </div>
    </div>
  </Modal>
}
