import { Camera, Check, ChevronDown, Filter, Heart, ImagePlus, Pencil, Plus, Search, Shield, Sparkles, Trash2, UploadCloud } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChampionAvatar } from '../components/ChampionAvatar'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { championCatalog, championFromCatalog } from '../data/catalog'
import type { Ledger } from '../hooks/useLedger'
import { formatPower } from '../lib/format'
import { scanRosterScreenshot, type OcrProgress } from '../lib/ocr'
import type { Champion, ChampionRole, GemColor, Rarity } from '../types'

type SortMode = 'power' | 'level' | 'name' | 'recent'

function blankChampion(): Champion {
  return championFromCatalog('', { name: '', rarity: 'Legendary', stars: 3 })
}

export function RosterPage({ ledger }: { ledger: Ledger }) {
  const [query, setQuery] = useState('')
  const [color, setColor] = useState<'all' | GemColor>('all')
  const [sort, setSort] = useState<SortMode>('power')
  const [importOpen, setImportOpen] = useState(false)
  const [editing, setEditing] = useState<Champion | null>(null)

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return ledger.data.roster
      .filter((champion) => color === 'all' || champion.color === color)
      .filter((champion) => !normalized || [champion.name, champion.faction, champion.role].some((value) => value.toLowerCase().includes(normalized)))
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name)
        if (sort === 'level') return b.level - a.level
        if (sort === 'recent') return b.updatedAt.localeCompare(a.updatedAt)
        return b.power - a.power
      })
  }, [color, ledger.data.roster, query, sort])

  return (
    <div className="page">
      <PageHeader
        eyebrow="The great houses"
        title="Champion roster"
        description="Record every champion beneath your banner and keep their strength current."
        actions={
          <>
            <button className="button button--ghost" onClick={() => setEditing(blankChampion())}><Plus size={17} /> Add champion</button>
            <button className="button button--primary" onClick={() => setImportOpen(true)}><Camera size={17} /> Scan screenshot</button>
          </>
        }
      />

      <section className="roster-toolbar panel">
        <label className="search-field">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search champion, faction, or role…" />
        </label>
        <div className="gem-filters" aria-label="Filter by gem color">
          {(['all', 'red', 'blue', 'green', 'yellow', 'purple'] as const).map((item) => (
            <button key={item} className={color === item ? 'gem-filter gem-filter--active' : 'gem-filter'} onClick={() => setColor(item)} aria-label={`Show ${item} champions`}>
              {item === 'all' ? <Filter size={14} /> : <i className={`gem gem--${item}`} />}
              <span>{item}</span>
            </button>
          ))}
        </div>
        <label className="select-field select-field--compact">
          <span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
            <option value="power">Highest power</option>
            <option value="level">Highest level</option>
            <option value="name">Name</option>
            <option value="recent">Recently updated</option>
          </select>
          <ChevronDown size={15} />
        </label>
      </section>

      <div className="collection-meta">
        <span><strong>{filtered.length}</strong> of {ledger.data.roster.length} champions</span>
        {ledger.data.roster.length > 0 && <span>{formatPower(ledger.stats.combinedPower)} total power</span>}
      </div>

      {filtered.length ? (
        <section className="champion-grid">
          {filtered.map((champion) => (
            <ChampionCard
              key={champion.id}
              champion={champion}
              onEdit={() => setEditing(champion)}
              onFavorite={() => ledger.saveChampion({ ...champion, isFavorite: !champion.isFavorite })}
            />
          ))}
        </section>
      ) : (
        <section className="panel">
          <EmptyState
            icon={ledger.data.roster.length ? Search : Shield}
            title={ledger.data.roster.length ? 'No champions match' : 'Your banners are still furled'}
            body={ledger.data.roster.length ? 'Try another search or clear a gem filter.' : 'Import a roster screenshot and review the results before anything is added.'}
            action={!ledger.data.roster.length ? <button className="button button--primary" onClick={() => setImportOpen(true)}><ImagePlus size={17} /> Import roster</button> : undefined}
          />
        </section>
      )}

      <ImportRosterModal open={importOpen} onClose={() => setImportOpen(false)} onImport={ledger.addOrMergeChampions} />
      <ChampionEditor
        champion={editing}
        onClose={() => setEditing(null)}
        onSave={(champion) => { ledger.saveChampion(champion); setEditing(null) }}
        onDelete={editing && ledger.data.roster.some((item) => item.id === editing.id)
          ? () => { ledger.removeChampion(editing.id); setEditing(null) }
          : undefined}
      />
    </div>
  )
}

function ChampionCard({ champion, onEdit, onFavorite }: { champion: Champion; onEdit: () => void; onFavorite: () => void }) {
  return (
    <article className={`champion-card champion-card--${champion.color}`}>
      <div className="champion-card__visual">
        <ChampionAvatar champion={champion} />
        <button className={champion.isFavorite ? 'favorite-button favorite-button--active' : 'favorite-button'} onClick={onFavorite} aria-label="Toggle favorite">
          <Heart size={16} fill={champion.isFavorite ? 'currentColor' : 'none'} />
        </button>
        <span className="rarity-badge">{champion.rarity}</span>
      </div>
      <div className="champion-card__body">
        <div className="champion-card__title"><div><h3>{champion.name}</h3><span>{champion.faction}</span></div><button className="icon-button icon-button--small" onClick={onEdit} aria-label={`Edit ${champion.name}`}><Pencil size={15} /></button></div>
        <div className="champion-card__stats">
          <div><span>Power</span><strong>{champion.power.toLocaleString()}</strong></div>
          <div><span>Level</span><strong>{champion.level}</strong></div>
        </div>
        <div className="champion-card__footer">
          <span className="stars">{'★'.repeat(champion.stars)}<i>{'★'.repeat(6 - champion.stars)}</i></span>
          <span>{champion.role}</span>
        </div>
      </div>
    </article>
  )
}

function ChampionEditor({ champion, onClose, onSave, onDelete }: { champion: Champion | null; onClose: () => void; onSave: (champion: Champion) => void; onDelete?: () => void }) {
  const [draft, setDraft] = useState<Champion>(champion ?? blankChampion())
  useEffect(() => { if (champion) setDraft(champion) }, [champion])

  const updateName = (name: string) => {
    const catalog = championCatalog.find((item) => item.name.toLowerCase() === name.toLowerCase())
    setDraft((current) => catalog ? { ...current, ...catalog, name: catalog.name } : { ...current, name })
  }

  return (
    <Modal open={Boolean(champion)} title={onDelete ? 'Update champion' : 'Record a champion'} subtitle="Correct the details whenever your champion grows stronger." onClose={onClose}>
      <form className="form-grid" onSubmit={(event) => { event.preventDefault(); if (draft.name.trim()) onSave({ ...draft, name: draft.name.trim() }) }}>
        <label className="field field--full"><span>Champion name</span><input list="champion-catalog" value={draft.name} onChange={(event) => updateName(event.target.value)} required autoFocus /></label>
        <datalist id="champion-catalog">{championCatalog.map((item) => <option key={item.name} value={item.name} />)}</datalist>
        <label className="field"><span>Level</span><input type="number" min="1" max="100" value={draft.level} onChange={(event) => setDraft({ ...draft, level: Number(event.target.value) })} /></label>
        <label className="field"><span>Power</span><input type="number" min="0" value={draft.power} onChange={(event) => setDraft({ ...draft, power: Number(event.target.value) })} /></label>
        <label className="field"><span>Stars</span><select value={draft.stars} onChange={(event) => setDraft({ ...draft, stars: Number(event.target.value) })}>{[1, 2, 3, 4, 5, 6].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="field"><span>Shards</span><input type="number" min="0" value={draft.shards} onChange={(event) => setDraft({ ...draft, shards: Number(event.target.value) })} /></label>
        <label className="field"><span>Rarity</span><select value={draft.rarity} onChange={(event) => setDraft({ ...draft, rarity: event.target.value as Rarity })}>{['Common', 'Rare', 'Epic', 'Legendary'].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="field"><span>Gem color</span><select value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value as GemColor })}>{['red', 'blue', 'green', 'yellow', 'purple'].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="field"><span>Role</span><select value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value as ChampionRole })}>{['Damage', 'Tank', 'Support', 'Strategist', 'Healer'].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="field"><span>Faction</span><input value={draft.faction} onChange={(event) => setDraft({ ...draft, faction: event.target.value })} /></label>
        <div className="modal__actions field--full">
          {onDelete && <button type="button" className="button button--danger" onClick={() => window.confirm(`Remove ${draft.name} from your roster?`) && onDelete()}><Trash2 size={16} /> Remove</button>}
          <span />
          <button type="button" className="button button--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="button button--primary"><Check size={16} /> Save champion</button>
        </div>
      </form>
    </Modal>
  )
}

function ImportRosterModal({ open, onClose, onImport }: { open: boolean; onClose: () => void; onImport: (champions: Champion[], screenshot?: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [progress, setProgress] = useState<OcrProgress | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [detected, setDetected] = useState<Champion[]>([])

  useEffect(() => {
    if (!file) { setPreview(''); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const chooseFile = (next: File | null) => {
    if (!next) return
    if (!next.type.startsWith('image/')) { setError('Choose a PNG, JPEG, or WebP screenshot.'); return }
    setFile(next)
    setDetected([])
    setProgress(null)
    setError('')
  }

  const scan = async () => {
    if (!file) return
    setScanning(true)
    setError('')
    try {
      const result = await scanRosterScreenshot(file, setProgress)
      setDetected(result.champions)
      if (!result.champions.length) setError('No known champions were found. Try a tighter crop, or add them manually after closing this window.')
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'The screenshot could not be read.')
    } finally {
      setScanning(false)
    }
  }

  const finish = () => {
    onImport(detected, file ?? undefined)
    setFile(null); setDetected([]); setProgress(null); setError(''); onClose()
  }

  return (
    <Modal open={open} title="Read a roster screenshot" subtitle="OCR runs in your browser. Review every result before it reaches your ledger." onClose={onClose} size="large">
      <div className="import-layout">
        <div className="import-source">
          {preview ? (
            <button className="screenshot-preview" type="button" onClick={() => inputRef.current?.click()}>
              <img src={preview} alt="Roster screenshot preview" />
              <span>Choose another screenshot</span>
            </button>
          ) : (
            <button
              className="drop-zone"
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files[0] ?? null) }}
            >
              <span><UploadCloud /></span>
              <strong>Drop your roster screenshot here</strong>
              <small>or choose an image · PNG, JPEG, WebP</small>
            </button>
          )}
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} />
          {file && !detected.length && (
            <button className="button button--primary button--full" disabled={scanning} onClick={scan}>
              {scanning ? <><span className="spinner" /> Reading {Math.round((progress?.progress ?? 0) * 100)}%</> : <><Sparkles size={17} /> Read screenshot</>}
            </button>
          )}
          {progress && scanning && <div className="progress-bar"><i style={{ width: `${Math.max(3, progress.progress * 100)}%` }} /><span>{progress.status}</span></div>}
          <div className="privacy-note"><Shield size={17} /><p><strong>Private by design.</strong> Images stay in this browser unless S3 sync is configured, in which case the original is archived to your private bucket.</p></div>
        </div>
        <div className="import-results">
          <div className="import-results__heading"><div><span className="eyebrow">Recognition results</span><h3>{detected.length ? `${detected.length} champions found` : 'Waiting for a screenshot'}</h3></div></div>
          {error && <div className="alert alert--error">{error}</div>}
          {detected.length ? (
            <div className="detected-list">
              {detected.map((champion, index) => (
                <div className="detected-row" key={champion.id}>
                  <ChampionAvatar champion={champion} compact />
                  <input aria-label="Champion name" value={champion.name} onChange={(event) => setDetected((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} />
                  <label><span>Lvl</span><input type="number" value={champion.level} onChange={(event) => setDetected((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, level: Number(event.target.value) } : item))} /></label>
                  <label><span>Power</span><input type="number" value={champion.power} onChange={(event) => setDetected((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, power: Number(event.target.value) } : item))} /></label>
                  <button className="icon-button icon-button--small" onClick={() => setDetected((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove result"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          ) : !error && (
            <div className="scan-placeholder"><ImagePlus /><p>For the best result, use the Champions roster view and crop away navigation or resource bars.</p></div>
          )}
        </div>
      </div>
      <div className="modal__actions modal__actions--bordered">
        <button className="button button--ghost" onClick={onClose}>Cancel</button>
        <button className="button button--primary" disabled={!detected.length} onClick={finish}><Check size={16} /> Add to ledger</button>
      </div>
    </Modal>
  )
}
