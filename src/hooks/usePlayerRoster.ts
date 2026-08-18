import { useEffect, useSyncExternalStore } from 'react'
import { champions } from '../data/gameData'
import { createPlayerRosterStore, PLAYER_ROSTER_STORAGE_KEY } from '../lib/playerRoster'

const validChampionIds = new Set(champions.map((champion) => champion.id))
const playerRosterStore = createPlayerRosterStore({
  storage: typeof window === 'undefined' ? undefined : window.localStorage,
  validChampionIds,
})

export function usePlayerRoster() {
  const roster = useSyncExternalStore(playerRosterStore.subscribe, playerRosterStore.getSnapshot, playerRosterStore.getSnapshot)
  const compatibilityStatus = useSyncExternalStore(playerRosterStore.subscribe, playerRosterStore.getCompatibilityStatus, playerRosterStore.getCompatibilityStatus)

  useEffect(() => {
    const refreshFromAnotherTab = (event: StorageEvent) => {
      if (event.key === PLAYER_ROSTER_STORAGE_KEY) playerRosterStore.refresh()
    }
    window.addEventListener('storage', refreshFromAnotherTab)
    return () => window.removeEventListener('storage', refreshFromAnotherTab)
  }, [])

  return {
    roster,
    compatibilityStatus,
    updateChampion: playerRosterStore.updateChampion,
    removeChampion: playerRosterStore.removeChampion,
    replaceRoster: playerRosterStore.replaceRoster,
    clearRoster: playerRosterStore.clear,
  }
}
