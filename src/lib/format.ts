export function formatPower(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: value >= 100_000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value)
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', options ?? { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export function relativeTime(value: string): string {
  const delta = new Date(value).getTime() - Date.now()
  const minutes = Math.round(delta / 60_000)
  const formatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour')
  return formatter.format(Math.round(hours / 24), 'day')
}

export function daysBetween(start: string, end: string): number {
  return Math.max(0, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000))
}

export function classNames(...items: Array<string | false | null | undefined>): string {
  return items.filter(Boolean).join(' ')
}
