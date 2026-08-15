import { readFile, writeFile } from 'node:fs/promises'

const SOURCE_URL = 'https://www.gameofthroneslegends.com/news'
const DATA_PATH = new URL('../public/data/news.json', import.meta.url)

function decode(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&#x27;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
}

function categoryFor(title) {
  if (/new champion/i.test(title)) return 'Champion'
  if (/patch notes|release \d/i.test(title)) return 'Patch notes'
  if (/calendar|event|season|summon/i.test(title)) return 'Event'
  if (/focusing|designing|team setup/i.test(title)) return 'Community'
  return 'News'
}

function summaryFor(title) {
  const category = categoryFor(title)
  if (category === 'Champion') return 'A new champion enters the roster with an overview of their skills, synergies, and best battle modes.'
  if (category === 'Patch notes') return 'Read the latest feature updates, balance changes, fixes, and quality-of-life improvements.'
  if (category === 'Event') return 'Review the latest official schedule, featured rewards, and limited-time activities.'
  if (category === 'Community') return 'A development dispatch with strategy, design insight, and news from behind the battle lines.'
  return 'The latest official dispatch from the Game of Thrones: Legends team.'
}

function parseDate(text) {
  const match = text.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/)
  if (!match) return null
  const parsed = new Date(`${match[0]} 12:00:00 GMT-0400`)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

const response = await fetch(SOURCE_URL, { headers: { 'user-agent': 'maesters-index-news-bot/1.0' } })
if (!response.ok) throw new Error(`News request failed: ${response.status}`)
const html = await response.text()
const existing = JSON.parse(await readFile(DATA_PATH, 'utf8'))
const articles = []
const pattern = /<a href="(\/news\/[^"#?]+)"[^>]*data-article="[^"]+"[\s\S]*?<\/a>/g

for (const match of html.matchAll(pattern)) {
  const clean = decode(match[0]
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim())
  const date = parseDate(clean)
  if (!date) continue
  const dateLabel = clean.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/)?.[0]
  const title = dateLabel ? clean.slice(dateLabel.length).trim() : clean
  if (!title || articles.some((article) => article.url.endsWith(match[1]))) continue
  articles.push({ title, date, url: new URL(match[1], SOURCE_URL).href, category: categoryFor(title), summary: summaryFor(title) })
  if (articles.length === 9) break
}

if (articles.length < 3) throw new Error(`Only found ${articles.length} news articles; refusing to replace the feed.`)
if (JSON.stringify(existing.items) === JSON.stringify(articles)) {
  console.log('Official news is already current.')
  process.exit(0)
}
await writeFile(DATA_PATH, `${JSON.stringify({ ...existing, updatedAt: new Date().toISOString(), items: articles }, null, 2)}\n`)
console.log(`Updated ${articles.length} official news items.`)
