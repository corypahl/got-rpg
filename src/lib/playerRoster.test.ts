import { describe, expect, it } from 'vitest'
import {
  createPlayerChampion,
  createPlayerRosterStore,
  getChampionLevelCap,
  getChampionSkillLevelCap,
  getPlayerChampionProgress,
  loadPlayerRoster,
  normalizePlayerRoster,
  PLAYER_ROSTER_STORAGE_KEY,
  type PlayerRosterStorage,
} from './playerRoster'

class MemoryStorage implements PlayerRosterStorage {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

const timestamp = '2026-08-18T12:00:00.000Z'

describe('player roster model', () => {
  it('uses the current official star-based level and skill caps', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map((stars) => getChampionLevelCap(stars as 1 | 2 | 3 | 4 | 5 | 6 | 7))).toEqual([125, 200, 250, 275, 300, 325, 350])
    expect([1, 2, 3, 4, 5, 6, 7].map((stars) => getChampionSkillLevelCap(stars as 1 | 2 | 3 | 4 | 5 | 6 | 7))).toEqual([2, 3, 4, 5, 7, 9, 11])
  })

  it('derives whether an unlocked champion can still level without rewriting legacy levels', () => {
    const capped = createPlayerChampion('arya-stark', { unlocked: true, stars: 2, currentLevel: 200 })
    const legacy = createPlayerChampion('arya-stark', { unlocked: true, stars: 1, currentLevel: 130 })
    expect(getPlayerChampionProgress(capped)).toEqual({ levelCap: 200, levelsAvailable: 0, isLevelCapped: true, canLevel: false })
    expect(getPlayerChampionProgress(legacy)).toEqual({ levelCap: 125, levelsAvailable: 0, isLevelCapped: true, canLevel: false })
    expect(legacy.currentLevel).toBe(130)
  })

  it('normalizes imported fields and enforces iconic and skill constraints', () => {
    const roster = normalizePlayerRoster({
      champions: [
        { championId: 'arya-stark', unlocked: true, stars: 2, currentLevel: 84, iconicUnlocked: true, iconicLevel: 99, skillLevels: { active: 8 } },
        { championId: 'ned-stark', unlocked: true, stars: 3, currentLevel: 201, iconicUnlocked: true, iconicLevel: 0, skillLevels: { leader: 9 } },
        { championId: 'unknown', unlocked: true, stars: 7 },
      ],
    }, { validChampionIds: new Set(['arya-stark', 'ned-stark']), now: () => timestamp })

    expect(roster.schemaVersion).toBe(1)
    expect(roster.updatedAt).toBe(timestamp)
    expect(roster.champions['arya-stark']).toMatchObject({ iconicUnlocked: false, iconicLevel: 0, skillLevels: { active: 3 } })
    expect(roster.champions['ned-stark']).toMatchObject({ iconicUnlocked: true, iconicLevel: 1, skillLevels: { leader: 4 } })
    expect(roster.champions.unknown).toBeUndefined()
  })

  it('persists sparse champion records and notifies every store subscriber', () => {
    const storage = new MemoryStorage()
    const store = createPlayerRosterStore({ storage, validChampionIds: new Set(['arya-stark']), now: () => timestamp })
    let notifications = 0
    store.subscribe(() => { notifications += 1 })

    store.updateChampion('arya-stark', { unlocked: true, stars: 2, currentLevel: 80, shardsTowardNextStar: 14, favorite: true })

    expect(notifications).toBe(1)
    expect(store.getSnapshot().champions['arya-stark']).toMatchObject({ currentLevel: 80, shardsTowardNextStar: 14, favorite: true })
    expect(loadPlayerRoster(storage).champions['arya-stark'].stars).toBe(2)
    expect(JSON.parse(storage.getItem(PLAYER_ROSTER_STORAGE_KEY) ?? '{}').schemaVersion).toBe(1)
  })

  it('recovers safely from corrupt storage and can clear persisted data', () => {
    const storage = new MemoryStorage()
    storage.setItem(PLAYER_ROSTER_STORAGE_KEY, '{bad json')
    expect(loadPlayerRoster(storage, { now: () => timestamp })).toEqual({ schemaVersion: 1, updatedAt: timestamp, champions: {} })

    const store = createPlayerRosterStore({ storage, now: () => timestamp })
    store.updateChampion('arya-stark', { unlocked: true, stars: 1 })
    store.clear()
    expect(store.getSnapshot().champions).toEqual({})
    expect(storage.getItem(PLAYER_ROSTER_STORAGE_KEY)).toBeNull()
  })

  it('does not overwrite a roster written by a newer schema', () => {
    const storage = new MemoryStorage()
    const futureRoster = JSON.stringify({ schemaVersion: 99, updatedAt: timestamp, champions: { future: { championId: 'future' } } })
    storage.setItem(PLAYER_ROSTER_STORAGE_KEY, futureRoster)
    const store = createPlayerRosterStore({ storage, now: () => timestamp })

    expect(store.getCompatibilityStatus()).toBe('unsupported')
    expect(() => store.updateChampion('arya-stark', { unlocked: true, stars: 1 })).toThrow(/newer version/)
    expect(storage.getItem(PLAYER_ROSTER_STORAGE_KEY)).toBe(futureRoster)

    store.clear()
    expect(store.getCompatibilityStatus()).toBe('ready')
    expect(storage.getItem(PLAYER_ROSTER_STORAGE_KEY)).toBeNull()
  })
})
