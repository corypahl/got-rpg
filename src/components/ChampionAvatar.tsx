import { Crown } from 'lucide-react'
import { classNames } from '../lib/format'
import type { Champion } from '../types'

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export function ChampionAvatar({ champion, compact = false, leader = false }: { champion: Champion; compact?: boolean; leader?: boolean }) {
  return (
    <div className={classNames('champion-avatar', `champion-avatar--${champion.color}`, compact && 'champion-avatar--compact')}>
      <span className="champion-avatar__rune">{initials(champion.name)}</span>
      <span className="champion-avatar__level">{champion.level}</span>
      {leader && <span className="champion-avatar__leader"><Crown size={12} fill="currentColor" /></span>}
    </div>
  )
}
