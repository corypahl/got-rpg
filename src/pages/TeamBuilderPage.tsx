import { Check, ChevronRight, Crown, Plus, Save, Search, ShieldAlert, Swords, Trash2, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ChampionAvatar } from '../components/ChampionAvatar'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import type { Ledger } from '../hooks/useLedger'
import { formatPower } from '../lib/format'
import { createId } from '../lib/id'
import type { Team } from '../types'

const modes: Team['mode'][] = ['Campaign', 'Raids', 'PvP', 'Alliance Wars', 'Events']

function newTeam(): Team {
  return { id: createId(), name: 'Untitled formation', mode: 'Raids', championIds: [], leaderId: null, notes: '', updatedAt: new Date().toISOString() }
}

export function TeamBuilderPage({ ledger }: { ledger: Ledger }) {
  const [selectedId, setSelectedId] = useState<string | null>(ledger.data.teams[0]?.id ?? null)
  const [draft, setDraft] = useState<Team>(() => ledger.data.teams[0] ?? newTeam())
  const [query, setQuery] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!selectedId) return
    const team = ledger.data.teams.find((item) => item.id === selectedId)
    if (team) setDraft(team)
  }, [ledger.data.teams, selectedId])

  const selectedChampions = draft.championIds.map((id) => ledger.data.roster.find((item) => item.id === id)).filter(Boolean)
  const available = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return [...ledger.data.roster]
      .filter((champion) => !draft.championIds.includes(champion.id))
      .filter((champion) => !normalized || [champion.name, champion.faction, champion.color].some((value) => value.toLowerCase().includes(normalized)))
      .sort((a, b) => b.power - a.power)
  }, [draft.championIds, ledger.data.roster, query])
  const totalPower = selectedChampions.reduce((sum, champion) => sum + (champion?.power ?? 0), 0)
  const distinctColors = new Set(selectedChampions.map((champion) => champion?.color)).size
  const factionCounts = selectedChampions.reduce<Record<string, number>>((counts, champion) => {
    if (champion) counts[champion.faction] = (counts[champion.faction] ?? 0) + 1
    return counts
  }, {})
  const strongestFaction = Object.entries(factionCounts).sort((a, b) => b[1] - a[1])[0]

  const save = () => {
    ledger.saveTeam(draft)
    setSelectedId(draft.id)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1_500)
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="The war room"
        title="Forge a formation"
        description="Balance colors, factions, and raw might across five battle positions."
        actions={<button className="button button--primary" disabled={!draft.championIds.length} onClick={save}>{saved ? <Check size={17} /> : <Save size={17} />}{saved ? 'Saved' : 'Save formation'}</button>}
      />

      {ledger.data.roster.length === 0 ? (
        <section className="panel"><EmptyState icon={ShieldAlert} title="A war room without warriors" body="Record your unlocked champions before building a formation." /></section>
      ) : (
        <div className="war-room">
          <aside className="formations-panel panel">
            <div className="formations-panel__heading"><div><span className="eyebrow">Saved</span><h2>Formations</h2></div><button className="icon-button icon-button--small" onClick={() => { const team = newTeam(); setSelectedId(null); setDraft(team) }} aria-label="New formation"><Plus /></button></div>
            <div className="formation-list">
              {ledger.data.teams.map((team) => {
                const power = team.championIds.reduce((sum, id) => sum + (ledger.data.roster.find((champion) => champion.id === id)?.power ?? 0), 0)
                return (
                  <button key={team.id} onClick={() => setSelectedId(team.id)} className={selectedId === team.id ? 'formation-item formation-item--active' : 'formation-item'}>
                    <span className="formation-item__icon"><Swords size={17} /></span>
                    <span><strong>{team.name}</strong><small>{team.mode} · {formatPower(power)} power</small></span>
                    <ChevronRight size={15} />
                  </button>
                )
              })}
              {!ledger.data.teams.length && <p className="formation-list__empty">Your saved teams will gather here.</p>}
            </div>
            <button className="button button--ghost button--full" onClick={() => { const team = newTeam(); setSelectedId(null); setDraft(team) }}><Plus size={16} /> New formation</button>
          </aside>

          <section className="builder-panel panel">
            <div className="team-title-fields">
              <label className="field"><span>Formation name</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
              <label className="field"><span>Battle mode</span><select value={draft.mode} onChange={(event) => setDraft({ ...draft, mode: event.target.value as Team['mode'] })}>{modes.map((mode) => <option key={mode}>{mode}</option>)}</select></label>
              {selectedId && <button className="icon-button icon-button--danger" onClick={() => {
                if (!window.confirm(`Disband “${draft.name}”?`)) return
                ledger.removeTeam(draft.id); const team = newTeam(); setSelectedId(null); setDraft(team)
              }} aria-label="Delete formation"><Trash2 size={17} /></button>}
            </div>

            <div className="battlefield">
              <div className="battlefield__header"><span>Battle line</span><small>Choose up to five · click the crown to assign a leader</small></div>
              <div className="team-slots">
                {[0, 1, 2, 3, 4].map((slot) => {
                  const champion = selectedChampions[slot]
                  if (!champion) return <div className="team-slot team-slot--empty" key={slot}><span>{slot + 1}</span><Plus size={17} /><small>Open</small></div>
                  return (
                    <div className={`team-slot team-slot--${champion.color}`} key={champion.id}>
                      <button className={draft.leaderId === champion.id ? 'leader-toggle leader-toggle--active' : 'leader-toggle'} onClick={() => setDraft({ ...draft, leaderId: champion.id })} aria-label={`Make ${champion.name} leader`}><Crown size={14} fill={draft.leaderId === champion.id ? 'currentColor' : 'none'} /></button>
                      <button className="remove-slot" onClick={() => setDraft({ ...draft, championIds: draft.championIds.filter((id) => id !== champion.id), leaderId: draft.leaderId === champion.id ? null : draft.leaderId })} aria-label={`Remove ${champion.name}`}><X size={13} /></button>
                      <ChampionAvatar champion={champion} leader={draft.leaderId === champion.id} />
                      <strong>{champion.name}</strong><small>{formatPower(champion.power)} power</small>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="team-metrics">
              <div><span>Team power</span><strong>{totalPower.toLocaleString()}</strong></div>
              <div><span>Gem coverage</span><strong>{distinctColors}<small> / 5</small></strong></div>
              <div><span>Faction bond</span><strong>{strongestFaction && strongestFaction[1] >= 2 ? `${strongestFaction[1]}×` : '—'}</strong><small>{strongestFaction && strongestFaction[1] >= 2 ? strongestFaction[0] : 'No synergy yet'}</small></div>
              <div><span>Leader</span><strong className="metric-name">{ledger.data.roster.find((item) => item.id === draft.leaderId)?.name ?? 'Unassigned'}</strong></div>
            </div>

            <label className="field"><span>Tactical notes</span><textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Opening move, target priorities, substitutions…" rows={3} /></label>
          </section>

          <aside className="recruit-panel panel">
            <div className="recruit-panel__heading"><span className="eyebrow">Your roster</span><h2>Choose champions</h2></div>
            <label className="search-field search-field--small"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a champion…" /></label>
            <div className="recruit-list">
              {available.map((champion) => (
                <button key={champion.id} disabled={draft.championIds.length >= 5} onClick={() => setDraft({ ...draft, championIds: [...draft.championIds, champion.id], leaderId: draft.leaderId ?? champion.id })}>
                  <ChampionAvatar champion={champion} compact />
                  <span><strong>{champion.name}</strong><small>{champion.role} · {formatPower(champion.power)}</small></span>
                  <Plus size={15} />
                </button>
              ))}
              {!available.length && <div className="recruit-empty"><Users size={20} /><span>No champions available</span></div>}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
