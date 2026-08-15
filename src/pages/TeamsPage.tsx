import { ArrowUpRight, CheckCircle2, Crown, ExternalLink, Info, Shield, Target, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChampionAvatar } from '../components/ChampionAvatar'
import { PageHeader } from '../components/PageHeader'
import { championById, crownRegions, teams } from '../data/gameData'
import type { StrategyTeam, TeamMode } from '../types'

const modes: Array<'All' | TeamMode> = ['All', 'Meta', 'Crown Challenge', 'Raid Offense', 'Raid Defense', 'Legendary Assault']

export function TeamsPage() {
  const [params, setParams] = useSearchParams()
  const requestedMode = params.get('mode') as TeamMode | null
  const [mode, setMode] = useState<'All' | TeamMode>(requestedMode && modes.includes(requestedMode) ? requestedMode : 'All')
  const [selectedId, setSelectedId] = useState(params.get('team') ?? '')
  const filtered = useMemo(() => teams.filter((team) => mode === 'All' || team.mode === mode), [mode])

  useEffect(() => {
    const requested = params.get('team')
    if (requested) setSelectedId(requested)
  }, [params])

  const selected = teams.find((team) => team.id === selectedId)

  return <div className="page teams-page">
    <PageHeader eyebrow="The war table" title="Team library" description="Proven lineups, legal Crown Challenge routes, raid shells, and boss-specific answers—with the evidence behind each recommendation." />
    <div className="mode-tabs" role="tablist">{modes.map((item) => <button key={item} className={mode === item ? 'mode-tab mode-tab--active' : 'mode-tab'} onClick={() => { setMode(item); setSelectedId(''); setParams(item === 'All' ? {} : { mode: item }) }}>{item === 'Crown Challenge' && <Crown size={14} />}{item}</button>)}</div>
    {mode === 'Crown Challenge' && <CrownSchedule />}
    <div className="team-library-grid">{filtered.map((team) => <TeamCard key={team.id} team={team} expanded={team.id === selectedId} onToggle={() => { const next = team.id === selectedId ? '' : team.id; setSelectedId(next); setParams(next ? { team: next } : mode === 'All' ? {} : { mode }) }} />)}</div>
    {selected && <span className="sr-only">Selected {selected.name}</span>}
  </div>
}

function CrownSchedule() {
  const today = new Date().getDay()
  return <section className="crown-schedule panel"><header><div><span className="eyebrow">Weekly rotation</span><h2>Crown Challenge access</h2></div><span><Info size={14} /> Factionless champions remain legal everywhere</span></header><div>{crownRegions.map((region) => <article className={region.days.includes(today) ? `region-card region-card--${region.accent} region-card--open` : `region-card region-card--${region.accent}`} key={region.id}><div><Target size={17} /><strong>{region.name}</strong>{region.days.includes(today) && <span>Open today</span>}</div><p>{region.factions.join(' · ')}</p><small>{region.days.map((day) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]).join(' · ')}</small></article>)}</div></section>
}

function TeamCard({ team, expanded, onToggle }: { team: StrategyTeam; expanded: boolean; onToggle: () => void }) {
  const roster = team.championIds.map((id) => championById.get(id)).filter(Boolean)
  const EvidenceIcon = team.evidence.startsWith('Official') ? CheckCircle2 : Users
  return <article className={expanded ? 'team-card team-card--expanded panel' : 'team-card panel'}>
    <button className="team-card__summary" onClick={onToggle} aria-expanded={expanded}>
      <div className="team-card__top"><span className={`tier-mark tier-mark--${team.tier.toLowerCase()}`}>{team.tier}</span><span className="pill">{team.mode}</span><span className="evidence-chip"><EvidenceIcon size={12} /> {team.evidence}</span></div>
      <div><span className="eyebrow">{team.target}</span><h2>{team.name}</h2><p>{team.summary}</p></div>
      <div className="team-lineup">{roster.map((champion) => champion && <div key={champion.id}><ChampionAvatar champion={champion} leader={champion.id === team.leaderId} /><strong>{champion.name}</strong><small>{champion.title || champion.role}</small></div>)}</div>
      <footer><span><Shield size={14} /> Updated {new Date(team.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span><span>{expanded ? 'Close playbook' : 'Open playbook'} <ArrowUpRight size={14} /></span></footer>
    </button>
    {expanded && <div className="team-card__playbook"><div><span className="eyebrow">Battle plan</span><ol>{team.playbook.map((step) => <li key={step}>{step}</li>)}</ol></div><aside><span className="eyebrow">Evidence</span><strong>{team.evidence}</strong><p>{team.evidence === 'Official lineup' ? 'All five positions were published together by the game team.' : team.evidence === 'Official-tested core' ? 'The official design team named the key champions; the remaining slots complete the mechanic.' : 'Curated from current mechanics and community usage, not official win-rate data.'}</p><a href={team.sourceUrl} target="_blank" rel="noreferrer">{team.sourceLabel} <ExternalLink size={13} /></a></aside></div>}
  </article>
}
