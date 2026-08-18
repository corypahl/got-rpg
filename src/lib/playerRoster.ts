import type { ChampionStarRank, PlayerChampion, PlayerChampionProgress, PlayerRoster } from '../types'

export const PLAYER_ROSTER_SCHEMA_VERSION = 1 as const
export const PLAYER_ROSTER_STORAGE_KEY = 'maesters-index:player-roster'
export const CHAMPION_STAR_CAP_SOURCE_URL = 'https://zyngasupport.helpshift.com/hc/en/124-game-of-thrones-legends/faq/22141-release-1-0-451-patch-notes/'

export const STAR_LEVEL_CAPS: Readonly<Record<Exclude<ChampionStarRank, 0>, number>> = {
  1: 125,
  2: 200,
  3: 250,
  4: 275,
  5: 300,
  6: 325,
  7: 350,
}

export const STAR_SKILL_LEVEL_CAPS: Readonly<Record<Exclude<ChampionStarRank, 0>, number>> = {
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 7,
  6: 9,
  7: 11,
}

export interface PlayerRosterStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface PlayerRosterStore {
  getSnapshot(): PlayerRoster
  getCompatibilityStatus(): 'ready' | 'unsupported'
  subscribe(listener: () => void): () => void
  updateChampion(championId: string, changes: Partial<Omit<PlayerChampion, 'championId'>>): PlayerChampion
  removeChampion(championId: string): void
  replaceRoster(value: unknown): PlayerRoster
  clear(): void
  refresh(): void
}

interface RosterOptions {
  validChampionIds?: ReadonlySet<string>
  now?: () => string
}

interface StoreOptions extends RosterOptions {
  storage?: PlayerRosterStorage
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

function integer(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function hasUnsupportedSchema(value: unknown) {
  return isRecord(value) && integer(value.schemaVersion, PLAYER_ROSTER_SCHEMA_VERSION) > PLAYER_ROSTER_SCHEMA_VERSION
}

function storedRosterHasUnsupportedSchema(storage?: PlayerRosterStorage) {
  if (!storage) return false
  const serialized = storage.getItem(PLAYER_ROSTER_STORAGE_KEY)
  if (!serialized) return false
  try {
    return hasUnsupportedSchema(JSON.parse(serialized))
  } catch {
    return false
  }
}

function normalizeSkillLevels(value: unknown, cap: number) {
  if (!isRecord(value)) return undefined
  const entries = Object.entries(value)
    .filter(([key, level]) => key.trim() && typeof level === 'number' && Number.isFinite(level))
    .map(([key, level]) => [key.trim(), clamp(Math.round(level as number), 1, cap)] as const)
  return entries.length ? Object.fromEntries(entries) : undefined
}

export function getChampionLevelCap(stars: ChampionStarRank) {
  return stars === 0 ? 0 : STAR_LEVEL_CAPS[stars]
}

export function getChampionSkillLevelCap(stars: ChampionStarRank) {
  return stars === 0 ? 0 : STAR_SKILL_LEVEL_CAPS[stars]
}

export function getPlayerChampionProgress(champion: PlayerChampion): PlayerChampionProgress {
  const levelCap = getChampionLevelCap(champion.stars)
  const levelsAvailable = champion.unlocked ? Math.max(0, levelCap - champion.currentLevel) : 0
  return {
    levelCap,
    levelsAvailable,
    isLevelCapped: champion.unlocked && champion.currentLevel >= levelCap,
    canLevel: champion.unlocked && champion.currentLevel < levelCap,
  }
}

export function normalizePlayerChampion(value: unknown, fallbackChampionId?: string): PlayerChampion | null {
  if (!isRecord(value)) return null
  const championId = typeof value.championId === 'string' && value.championId.trim() ? value.championId.trim() : fallbackChampionId?.trim()
  if (!championId) return null

  const requestedStars = clamp(integer(value.stars), 0, 7) as ChampionStarRank
  const unlocked = typeof value.unlocked === 'boolean' ? value.unlocked : requestedStars > 0
  const stars = (unlocked ? Math.max(1, requestedStars) : 0) as ChampionStarRank
  const currentLevel = unlocked ? Math.max(1, integer(value.currentLevel, 1)) : 0
  const shardsTowardNextStar = Math.max(0, integer(value.shardsTowardNextStar))
  const currentPower = unlocked ? Math.max(0, integer(value.currentPower)) : 0
  const iconicUnlocked = unlocked && stars >= 3 && value.iconicUnlocked === true
  const iconicLevel = iconicUnlocked ? clamp(integer(value.iconicLevel, 1), 1, 20) : 0
  const skillLevels = unlocked ? normalizeSkillLevels(value.skillLevels, getChampionSkillLevelCap(stars)) : undefined
  const notes = typeof value.notes === 'string' && value.notes.length ? value.notes : undefined
  const favorite = value.favorite === true ? true : undefined

  return {
    championId,
    unlocked,
    stars,
    currentLevel,
    shardsTowardNextStar,
    currentPower,
    iconicUnlocked,
    iconicLevel,
    ...(skillLevels ? { skillLevels } : {}),
    ...(notes ? { notes } : {}),
    ...(favorite ? { favorite } : {}),
  }
}

export function createPlayerChampion(championId: string, changes: Partial<Omit<PlayerChampion, 'championId'>> = {}) {
  const champion = normalizePlayerChampion({ championId, ...changes })
  if (!champion) throw new Error('A champion ID is required')
  return champion
}

export function createEmptyPlayerRoster(updatedAt = new Date().toISOString()): PlayerRoster {
  return { schemaVersion: PLAYER_ROSTER_SCHEMA_VERSION, updatedAt, champions: {} }
}

export function normalizePlayerRoster(value: unknown, options: RosterOptions = {}): PlayerRoster {
  const now = options.now?.() ?? new Date().toISOString()
  if (!isRecord(value)) return createEmptyPlayerRoster(now)

  const schemaVersion = integer(value.schemaVersion, PLAYER_ROSTER_SCHEMA_VERSION)
  if (schemaVersion > PLAYER_ROSTER_SCHEMA_VERSION) return createEmptyPlayerRoster(now)

  const rawChampions = Array.isArray(value.champions)
    ? value.champions.map((champion) => [undefined, champion] as const)
    : isRecord(value.champions)
      ? Object.entries(value.champions)
      : []
  const champions: Record<string, PlayerChampion> = {}

  for (const [fallbackChampionId, rawChampion] of rawChampions) {
    const champion = normalizePlayerChampion(rawChampion, fallbackChampionId)
    if (!champion || (options.validChampionIds && !options.validChampionIds.has(champion.championId))) continue
    champions[champion.championId] = champion
  }

  const updatedAt = typeof value.updatedAt === 'string' && !Number.isNaN(Date.parse(value.updatedAt)) ? value.updatedAt : now
  return { schemaVersion: PLAYER_ROSTER_SCHEMA_VERSION, updatedAt, champions }
}

export function loadPlayerRoster(storage?: PlayerRosterStorage, options: RosterOptions = {}) {
  if (!storage) return createEmptyPlayerRoster(options.now?.())
  const serialized = storage.getItem(PLAYER_ROSTER_STORAGE_KEY)
  if (!serialized) return createEmptyPlayerRoster(options.now?.())
  try {
    return normalizePlayerRoster(JSON.parse(serialized), options)
  } catch {
    return createEmptyPlayerRoster(options.now?.())
  }
}

export function savePlayerRoster(storage: PlayerRosterStorage, roster: PlayerRoster) {
  storage.setItem(PLAYER_ROSTER_STORAGE_KEY, JSON.stringify(roster))
}

export function createPlayerRosterStore({ storage, validChampionIds, now = () => new Date().toISOString() }: StoreOptions = {}): PlayerRosterStore {
  const rosterOptions = { validChampionIds, now }
  let snapshot = loadPlayerRoster(storage, rosterOptions)
  let compatibilityStatus: 'ready' | 'unsupported' = storedRosterHasUnsupportedSchema(storage) ? 'unsupported' : 'ready'
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())
  const persist = (champions: Record<string, PlayerChampion>) => {
    if (compatibilityStatus === 'unsupported') throw new Error('This roster was created by a newer version of The Maester\'s Index')
    snapshot = { schemaVersion: PLAYER_ROSTER_SCHEMA_VERSION, updatedAt: now(), champions }
    if (storage) savePlayerRoster(storage, snapshot)
    emit()
  }

  return {
    getSnapshot: () => snapshot,
    getCompatibilityStatus: () => compatibilityStatus,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    updateChampion: (championId, changes) => {
      if (validChampionIds && !validChampionIds.has(championId)) throw new Error(`Unknown champion ID: ${championId}`)
      const current = snapshot.champions[championId] ?? createPlayerChampion(championId)
      const champion = normalizePlayerChampion({ ...current, ...changes, championId })
      if (!champion) throw new Error(`Invalid champion data: ${championId}`)
      persist({ ...snapshot.champions, [championId]: champion })
      return champion
    },
    removeChampion: (championId) => {
      if (compatibilityStatus === 'unsupported') throw new Error('This roster was created by a newer version of The Maester\'s Index')
      if (!snapshot.champions[championId]) return
      const champions = { ...snapshot.champions }
      delete champions[championId]
      persist(champions)
    },
    replaceRoster: (value) => {
      if (hasUnsupportedSchema(value)) throw new Error('This roster was created by a newer version of The Maester\'s Index')
      compatibilityStatus = 'ready'
      const normalized = normalizePlayerRoster(value, rosterOptions)
      persist(normalized.champions)
      return snapshot
    },
    clear: () => {
      compatibilityStatus = 'ready'
      snapshot = createEmptyPlayerRoster(now())
      storage?.removeItem(PLAYER_ROSTER_STORAGE_KEY)
      emit()
    },
    refresh: () => {
      const previousCompatibilityStatus = compatibilityStatus
      compatibilityStatus = storedRosterHasUnsupportedSchema(storage) ? 'unsupported' : 'ready'
      const next = loadPlayerRoster(storage, rosterOptions)
      if (JSON.stringify(next) === JSON.stringify(snapshot)) {
        if (previousCompatibilityStatus !== compatibilityStatus) emit()
        return
      }
      snapshot = next
      emit()
    },
  }
}
