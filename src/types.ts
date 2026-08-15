export type GemColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple'
export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary'
export type ChampionRole = 'Damage' | 'Tank' | 'Support' | 'Strategist' | 'Healer'

export interface Champion {
  id: string
  name: string
  level: number
  stars: number
  power: number
  shards: number
  rarity: Rarity
  color: GemColor
  role: ChampionRole
  faction: string
  isFavorite: boolean
  updatedAt: string
}

export interface Team {
  id: string
  name: string
  mode: 'Campaign' | 'Raids' | 'PvP' | 'Alliance Wars' | 'Events'
  championIds: string[]
  leaderId: string | null
  notes: string
  updatedAt: string
}

export interface ActivityItem {
  id: string
  kind: 'import' | 'edit' | 'team' | 'sync'
  message: string
  createdAt: string
}

export interface AppData {
  schemaVersion: 1
  houseName: string
  roster: Champion[]
  teams: Team[]
  activity: ActivityItem[]
  updatedAt: string
}

export interface SyncSettings {
  apiUrl: string
  accessToken: string
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
