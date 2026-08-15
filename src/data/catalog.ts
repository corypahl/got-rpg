import type { Champion, ChampionRole, GemColor, Rarity } from '../types'
import { createId } from '../lib/id'

export interface CatalogChampion {
  name: string
  rarity: Rarity
  color: GemColor
  role: ChampionRole
  faction: string
}

export const championCatalog: CatalogChampion[] = [
  { name: 'Aegon II Targaryen', rarity: 'Legendary', color: 'yellow', role: 'Damage', faction: 'The Greens' },
  { name: 'Alicent Hightower', rarity: 'Legendary', color: 'green', role: 'Support', faction: 'The Greens' },
  { name: 'Arya Stark', rarity: 'Epic', color: 'green', role: 'Damage', faction: 'The North' },
  { name: 'Bran Stark', rarity: 'Legendary', color: 'purple', role: 'Strategist', faction: 'The North' },
  { name: 'Brienne of Tarth', rarity: 'Legendary', color: 'blue', role: 'Tank', faction: 'The North' },
  { name: 'Bronn', rarity: 'Epic', color: 'red', role: 'Damage', faction: 'The Lannisters' },
  { name: 'Caraxes', rarity: 'Legendary', color: 'red', role: 'Damage', faction: 'The Blacks' },
  { name: 'Catelyn Stark', rarity: 'Legendary', color: 'blue', role: 'Healer', faction: 'The North' },
  { name: 'Cersei Lannister', rarity: 'Legendary', color: 'green', role: 'Support', faction: 'The Lannisters' },
  { name: 'Corlys Velaryon', rarity: 'Legendary', color: 'blue', role: 'Strategist', faction: 'The Blacks' },
  { name: 'Criston Cole', rarity: 'Legendary', color: 'yellow', role: 'Tank', faction: 'The Greens' },
  { name: 'Daemon Targaryen', rarity: 'Legendary', color: 'red', role: 'Damage', faction: 'The Blacks' },
  { name: 'Daenerys Targaryen', rarity: 'Legendary', color: 'red', role: 'Damage', faction: 'House Targaryen' },
  { name: 'Daario Naharis', rarity: 'Legendary', color: 'blue', role: 'Damage', faction: 'Free Cities' },
  { name: 'Davos Seaworth', rarity: 'Epic', color: 'blue', role: 'Support', faction: 'House Baratheon' },
  { name: 'Drogon', rarity: 'Legendary', color: 'red', role: 'Damage', faction: 'House Targaryen' },
  { name: 'Ghost', rarity: 'Epic', color: 'blue', role: 'Damage', faction: 'The North' },
  { name: 'Gregor Clegane', rarity: 'Legendary', color: 'red', role: 'Tank', faction: 'The Lannisters' },
  { name: 'Jacaerys Velaryon', rarity: 'Legendary', color: 'yellow', role: 'Support', faction: 'The Blacks' },
  { name: 'Jon Snow', rarity: 'Legendary', color: 'blue', role: 'Damage', faction: 'The North' },
  { name: 'Jorah Mormont', rarity: 'Legendary', color: 'yellow', role: 'Tank', faction: 'House Targaryen' },
  { name: 'Mance Rayder', rarity: 'Legendary', color: 'green', role: 'Strategist', faction: 'Free Folk' },
  { name: 'Margaery Tyrell', rarity: 'Legendary', color: 'green', role: 'Healer', faction: 'House Tyrell' },
  { name: 'Meleys', rarity: 'Legendary', color: 'red', role: 'Damage', faction: 'The Blacks' },
  { name: 'Ned Stark', rarity: 'Legendary', color: 'blue', role: 'Tank', faction: 'The North' },
  { name: 'Oberyn Martell', rarity: 'Legendary', color: 'purple', role: 'Damage', faction: 'House Martell' },
  { name: 'Olenna Tyrell', rarity: 'Legendary', color: 'green', role: 'Strategist', faction: 'House Tyrell' },
  { name: 'Otto Hightower', rarity: 'Legendary', color: 'purple', role: 'Strategist', faction: 'The Greens' },
  { name: 'Rhaegal', rarity: 'Legendary', color: 'green', role: 'Damage', faction: 'House Targaryen' },
  { name: 'Rhaenyra Targaryen', rarity: 'Legendary', color: 'red', role: 'Support', faction: 'The Blacks' },
  { name: 'Robb Stark', rarity: 'Legendary', color: 'blue', role: 'Damage', faction: 'The North' },
  { name: 'Robert Baratheon', rarity: 'Legendary', color: 'yellow', role: 'Tank', faction: 'House Baratheon' },
  { name: 'Sandor Clegane', rarity: 'Epic', color: 'yellow', role: 'Tank', faction: 'The Lannisters' },
  { name: 'Sansa Stark', rarity: 'Legendary', color: 'purple', role: 'Support', faction: 'The North' },
  { name: 'Ser Gwayne Hightower', rarity: 'Legendary', color: 'yellow', role: 'Damage', faction: 'The Greens' },
  { name: 'Sunfyre', rarity: 'Legendary', color: 'yellow', role: 'Damage', faction: 'The Greens' },
  { name: 'The Night King', rarity: 'Legendary', color: 'blue', role: 'Strategist', faction: 'The Dead' },
  { name: 'Theon Greyjoy', rarity: 'Epic', color: 'purple', role: 'Damage', faction: 'House Greyjoy' },
  { name: 'Tormund Giantsbane', rarity: 'Legendary', color: 'red', role: 'Tank', faction: 'Free Folk' },
  { name: 'Tyland Lannister', rarity: 'Legendary', color: 'green', role: 'Strategist', faction: 'The Lannisters' },
  { name: 'Tyrion Lannister', rarity: 'Legendary', color: 'purple', role: 'Strategist', faction: 'The Lannisters' },
  { name: 'Tywin Lannister', rarity: 'Legendary', color: 'yellow', role: 'Strategist', faction: 'The Lannisters' },
  { name: 'Viserys I Targaryen', rarity: 'Legendary', color: 'green', role: 'Support', faction: 'The Blacks' },
  { name: 'Viserys III Targaryen', rarity: 'Legendary', color: 'yellow', role: 'Damage', faction: 'House Targaryen' },
  { name: 'Woodland Archer', rarity: 'Common', color: 'green', role: 'Damage', faction: 'The North' },
  { name: 'Northern Brawler', rarity: 'Common', color: 'blue', role: 'Tank', faction: 'The North' },
  { name: 'Lannister Spearman', rarity: 'Common', color: 'yellow', role: 'Tank', faction: 'The Lannisters' },
  { name: 'Stone Crow Mender', rarity: 'Common', color: 'purple', role: 'Healer', faction: 'Free Cities' },
]

export function championFromCatalog(name: string, seed: Partial<Champion> = {}): Champion {
  const match = championCatalog.find((item) => item.name.toLowerCase() === name.toLowerCase())
  const now = new Date().toISOString()
  return {
    id: createId(),
    name: match?.name ?? name,
    level: 1,
    stars: match?.rarity === 'Legendary' ? 3 : match?.rarity === 'Epic' ? 2 : 1,
    power: 0,
    shards: 0,
    rarity: match?.rarity ?? 'Rare',
    color: match?.color ?? 'blue',
    role: match?.role ?? 'Damage',
    faction: match?.faction ?? 'Unknown',
    isFavorite: false,
    updatedAt: now,
    ...seed,
  }
}

export function demoRoster(): Champion[] {
  return [
    championFromCatalog('Jon Snow', { level: 68, stars: 5, power: 211420, isFavorite: true }),
    championFromCatalog('Rhaenyra Targaryen', { level: 65, stars: 5, power: 198760, isFavorite: true }),
    championFromCatalog('Tyrion Lannister', { level: 62, stars: 4, power: 174230 }),
    championFromCatalog('The Night King', { level: 60, stars: 4, power: 168940 }),
    championFromCatalog('Oberyn Martell', { level: 58, stars: 4, power: 151870 }),
    championFromCatalog('Alicent Hightower', { level: 56, stars: 4, power: 142610 }),
    championFromCatalog('Arya Stark', { level: 51, stars: 4, power: 119840 }),
    championFromCatalog('Sandor Clegane', { level: 49, stars: 3, power: 104290 }),
  ]
}
