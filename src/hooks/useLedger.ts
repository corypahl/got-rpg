import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { demoRoster } from '../data/catalog'
import { createId } from '../lib/id'
import { isSyncConfigured, pullFromCloud, pushToCloud, uploadScreenshot } from '../lib/sync'
import type { ActivityItem, AppData, Champion, SyncSettings, Team } from '../types'

const DATA_KEY = 'maesters-ledger:data:v1'
const SETTINGS_KEY = 'maesters-ledger:sync:v1'

const now = () => new Date().toISOString()

function blankData(): AppData {
  return { schemaVersion: 1, houseName: 'My House', roster: [], teams: [], activity: [], updatedAt: now() }
}

function readData(): AppData {
  try {
    const value = localStorage.getItem(DATA_KEY)
    return value ? (JSON.parse(value) as AppData) : blankData()
  } catch {
    return blankData()
  }
}

function readSettings(): SyncSettings {
  try {
    const value = localStorage.getItem(SETTINGS_KEY)
    return value ? (JSON.parse(value) as SyncSettings) : { apiUrl: '', accessToken: '' }
  } catch {
    return { apiUrl: '', accessToken: '' }
  }
}

function activity(kind: ActivityItem['kind'], message: string): ActivityItem {
  return { id: createId(), kind, message, createdAt: now() }
}

export function useLedger() {
  const [data, setData] = useState<AppData>(readData)
  const [settings, setSettingsState] = useState<SyncSettings>(readSettings)
  const [syncState, setSyncState] = useState<'local' | 'syncing' | 'synced' | 'error'>('local')
  const [syncError, setSyncError] = useState('')
  const skipNextAutoSync = useRef(true)

  const update = useCallback((producer: (current: AppData) => AppData) => {
    setData((current) => {
      const next = producer(current)
      return { ...next, updatedAt: now() }
    })
  }, [])

  useEffect(() => {
    localStorage.setItem(DATA_KEY, JSON.stringify(data))
    if (skipNextAutoSync.current) {
      skipNextAutoSync.current = false
      return
    }
    if (!isSyncConfigured(settings)) return

    setSyncState('syncing')
    const timer = window.setTimeout(() => {
      pushToCloud(settings, data)
        .then(() => {
          setSyncState('synced')
          setSyncError('')
        })
        .catch((error: unknown) => {
          setSyncState('error')
          setSyncError(error instanceof Error ? error.message : 'Cloud sync failed.')
        })
    }, 1_000)
    return () => window.clearTimeout(timer)
  }, [data, settings])

  const saveSettings = useCallback((next: SyncSettings) => {
    setSettingsState(next)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
    setSyncState(isSyncConfigured(next) ? 'syncing' : 'local')
  }, [])

  const addOrMergeChampions = useCallback((champions: Champion[], screenshot?: File) => {
    update((current) => {
      const roster = [...current.roster]
      let added = 0
      champions.forEach((incoming) => {
        const index = roster.findIndex((item) => item.name.toLowerCase() === incoming.name.toLowerCase())
        if (index >= 0) {
          roster[index] = { ...roster[index], ...incoming, id: roster[index].id, updatedAt: now() }
        } else {
          roster.push({ ...incoming, updatedAt: now() })
          added += 1
        }
      })
      return {
        ...current,
        roster,
        activity: [activity('import', `Scanned ${champions.length} champions · ${added} newly unlocked`), ...current.activity].slice(0, 30),
      }
    })
    if (screenshot && isSyncConfigured(settings)) {
      uploadScreenshot(settings, screenshot).catch((error: unknown) => {
        setSyncState('error')
        setSyncError(error instanceof Error ? error.message : 'Screenshot upload failed.')
      })
    }
  }, [settings, update])

  const saveChampion = useCallback((champion: Champion) => {
    update((current) => {
      const exists = current.roster.some((item) => item.id === champion.id)
      return {
        ...current,
        roster: exists
          ? current.roster.map((item) => item.id === champion.id ? { ...champion, updatedAt: now() } : item)
          : [...current.roster, { ...champion, updatedAt: now() }],
        activity: [activity('edit', `${exists ? 'Updated' : 'Unlocked'} ${champion.name}`), ...current.activity].slice(0, 30),
      }
    })
  }, [update])

  const removeChampion = useCallback((id: string) => {
    update((current) => ({
      ...current,
      roster: current.roster.filter((item) => item.id !== id),
      teams: current.teams.map((team) => ({
        ...team,
        championIds: team.championIds.filter((championId) => championId !== id),
        leaderId: team.leaderId === id ? null : team.leaderId,
      })),
    }))
  }, [update])

  const saveTeam = useCallback((team: Team) => {
    update((current) => {
      const exists = current.teams.some((item) => item.id === team.id)
      return {
        ...current,
        teams: exists
          ? current.teams.map((item) => item.id === team.id ? { ...team, updatedAt: now() } : item)
          : [...current.teams, { ...team, updatedAt: now() }],
        activity: [activity('team', `${exists ? 'Updated' : 'Forged'} team “${team.name}”`), ...current.activity].slice(0, 30),
      }
    })
  }, [update])

  const removeTeam = useCallback((id: string) => {
    update((current) => ({ ...current, teams: current.teams.filter((item) => item.id !== id) }))
  }, [update])

  const loadDemo = useCallback(() => {
    const roster = demoRoster()
    const timestamp = now()
    update((current) => ({
      ...current,
      roster,
      teams: [{
        id: createId(),
        name: 'The Long Night',
        mode: 'Raids',
        championIds: roster.slice(0, 5).map((item) => item.id),
        leaderId: roster[0].id,
        notes: 'Sample formation — replace it with your own champions.',
        updatedAt: timestamp,
      }],
      activity: [activity('import', 'Loaded the sample roster'), ...current.activity],
    }))
  }, [update])

  const clearData = useCallback(() => {
    setData(blankData())
    setSyncState(isSyncConfigured(settings) ? 'syncing' : 'local')
  }, [settings])

  const syncNow = useCallback(async (direction: 'push' | 'pull') => {
    setSyncState('syncing')
    setSyncError('')
    try {
      if (direction === 'push') {
        await pushToCloud(settings, data)
      } else {
        const cloudData = await pullFromCloud(settings)
        if (cloudData) {
          skipNextAutoSync.current = true
          setData(cloudData)
        }
      }
      setSyncState('synced')
    } catch (error) {
      setSyncState('error')
      setSyncError(error instanceof Error ? error.message : 'Cloud sync failed.')
      throw error
    }
  }, [data, settings])

  const stats = useMemo(() => ({
    champions: data.roster.length,
    combinedPower: data.roster.reduce((sum, champion) => sum + champion.power, 0),
    teams: data.teams.length,
    favorites: data.roster.filter((champion) => champion.isFavorite).length,
  }), [data])

  return {
    data,
    settings,
    syncState,
    syncError,
    stats,
    saveSettings,
    addOrMergeChampions,
    saveChampion,
    removeChampion,
    saveTeam,
    removeTeam,
    loadDemo,
    clearData,
    syncNow,
    setHouseName: (houseName: string) => update((current) => ({ ...current, houseName })),
  }
}

export type Ledger = ReturnType<typeof useLedger>
