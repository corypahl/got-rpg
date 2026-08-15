import { championCatalog, championFromCatalog } from '../data/catalog'
import type { Champion } from '../types'

export interface OcrProgress {
  status: string
  progress: number
}

export interface OcrResult {
  rawText: string
  champions: Champion[]
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function distance(a: string, b: string): number {
  const matrix = Array.from({ length: b.length + 1 }, (_, row) => [row])
  for (let col = 0; col <= a.length; col += 1) matrix[0][col] = col
  for (let row = 1; row <= b.length; row += 1) {
    for (let col = 1; col <= a.length; col += 1) {
      matrix[row][col] = b[row - 1] === a[col - 1]
        ? matrix[row - 1][col - 1]
        : Math.min(matrix[row - 1][col - 1], matrix[row][col - 1], matrix[row - 1][col]) + 1
    }
  }
  return matrix[b.length][a.length]
}

function findCatalogMatch(line: string): string | null {
  const normalizedLine = normalize(line)
  if (normalizedLine.length < 3) return null

  let best: { name: string; score: number } | null = null
  for (const champion of championCatalog) {
    const target = normalize(champion.name)
    if (normalizedLine.includes(target) || target.includes(normalizedLine)) return champion.name
    const score = distance(normalizedLine, target) / Math.max(normalizedLine.length, target.length)
    if (!best || score < best.score) best = { name: champion.name, score }
  }
  return best && best.score <= 0.34 ? best.name : null
}

export function parseRosterText(rawText: string): Champion[] {
  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const found = new Map<string, Champion>()

  lines.forEach((line, index) => {
    const name = findCatalogMatch(line)
    if (!name || found.has(name)) return

    const context = lines.slice(index, index + 3).join(' ')
    const numbers = [...context.matchAll(/\b(?:lvl?\.?\s*)?(\d{1,6})\b/gi)].map((match) => Number(match[1]))
    const labeledLevel = context.match(/\b(?:lvl?|level)\.?\s*(\d{1,3})\b/i)
    const level = labeledLevel ? Number(labeledLevel[1]) : (numbers.find((number) => number > 0 && number <= 100) ?? 1)
    const power = [...numbers].reverse().find((number) => number >= 100) ?? 0
    const starMatch = context.match(/([1-6])\s*(?:star|★|\*)/i)
    found.set(name, championFromCatalog(name, {
      level,
      power,
      ...(starMatch ? { stars: Number(starMatch[1]) } : {}),
    }))
  })

  return [...found.values()]
}

export async function scanRosterScreenshot(file: File, onProgress: (value: OcrProgress) => void): Promise<OcrResult> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng', 1, {
    logger: (message) => {
      if (typeof message.progress === 'number') {
        onProgress({ status: message.status.replace(/_/g, ' '), progress: message.progress })
      }
    },
  })

  try {
    const result = await worker.recognize(file)
    return { rawText: result.data.text, champions: parseRosterText(result.data.text) }
  } finally {
    await worker.terminate()
  }
}
