import { describe, expect, it } from 'vitest'
import { championById, champions, crownRegions, eventChampionMap, releaseRadar, teamById, teams } from './gameData'

describe('strategy index data', () => {
  it('contains a full-sized champion index with unique ids', () => {
    expect(champions.length).toBeGreaterThanOrEqual(150)
    expect(new Set(champions.map((champion) => champion.id)).size).toBe(champions.length)
  })

  it('resolves every team member and leader', () => {
    for (const team of teams) {
      expect(team.championIds).toHaveLength(5)
      expect(new Set(team.championIds).size).toBe(5)
      expect(team.championIds).toContain(team.leaderId)
      for (const championId of team.championIds) expect(championById.has(championId), `${team.id}: ${championId}`).toBe(true)
    }
  })

  it('resolves every Crown route, event feature, and named release', () => {
    for (const region of crownRegions) expect(teamById.has(region.teamId), region.teamId).toBe(true)
    for (const championIds of Object.values(eventChampionMap)) {
      for (const championId of championIds) expect(championById.has(championId), championId).toBe(true)
    }
    for (const release of releaseRadar) {
      if (release.championId) expect(championById.has(release.championId), release.championId).toBe(true)
    }
  })
})
