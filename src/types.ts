export type GemColor = 'red' | 'blue' | 'green' | 'gold' | 'purple'
export type Rarity = 'Legendary' | 'Epic' | 'Common'
export type ChampionTier = 'S' | 'A' | 'B' | 'Unranked'
export type ChampionRole = 'Fighter' | 'Protector' | 'Strategist' | 'Mender' | 'Marksman' | 'Beast'
export type ChampionStarRank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface Champion {
  id: string
  name: string
  title?: string
  rarity: Rarity
  color: GemColor
  factions: string[]
  role: ChampionRole
  keywords: string[]
  tier: ChampionTier
  verified: boolean
  sourceUrl?: string
  imageUrl?: string
  imageAlt?: string
  imagePosition?: string
}

export interface PlayerChampion {
  championId: string
  unlocked: boolean
  stars: ChampionStarRank
  currentLevel: number
  shardsTowardNextStar: number
  currentPower: number
  iconicUnlocked: boolean
  iconicLevel: number
  skillLevels?: Record<string, number>
  notes?: string
  favorite?: boolean
}

export interface PlayerRoster {
  schemaVersion: 1
  updatedAt: string
  champions: Record<string, PlayerChampion>
}

export interface PlayerChampionProgress {
  levelCap: number
  levelsAvailable: number
  isLevelCapped: boolean
  canLevel: boolean
}

export type TeamMode = 'Meta' | 'Crown Challenge' | 'Raid Offense' | 'Raid Defense' | 'Legendary Assault'
export type EvidenceLevel = 'Official lineup' | 'Official-tested core' | 'Community meta' | 'Mechanic-based'

export interface StrategyTeam {
  id: string
  name: string
  mode: TeamMode
  target: string
  championIds: string[]
  leaderId: string
  tier: 'S' | 'A' | 'Specialist'
  evidence: EvidenceLevel
  summary: string
  playbook: string[]
  sourceLabel: string
  sourceUrl: string
  updatedAt: string
}

export interface CrownRegion {
  id: string
  name: string
  days: number[]
  factions: string[]
  teamId: string
  accent: GemColor
}

export interface ReleaseRadarItem {
  id: string
  championId?: string
  name: string
  status: 'Announced' | 'Teased' | 'New release'
  eta: string
  detail: string
  sourceUrl: string
}

export interface NewsItem {
  title: string
  date: string
  url: string
  category: 'Champion' | 'Patch notes' | 'Event' | 'Community' | 'News'
  summary: string
}

export interface GameEvent {
  title: string
  type: 'Quest' | 'Summon' | 'Season' | 'PvP' | 'Trial'
  startsAt: string
  endsAt: string
  featured?: string
  sourceUrl: string
}

export interface NewsFeed {
  updatedAt: string
  sourceUrl: string
  items: NewsItem[]
  events: GameEvent[]
}
