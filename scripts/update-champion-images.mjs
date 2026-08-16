import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const SITE = 'https://www.gameofthroneslegends.com'
const SITEMAP_URL = `${SITE}/sitemap.xml`
const OUTPUT_DIR = new URL('../public/champions/', import.meta.url)
const MANIFEST_PATH = new URL('../src/data/officialImages.json', import.meta.url)
const USER_AGENT = 'maesters-index-image-bot/1.0 (unofficial noncommercial fansite)'

// Most announcement art has a detectable face. Daemon's official artwork is a
// wide helmeted banner, so keep the full image and let the avatar frame crop it.
const portraitOverrides = {
  'daemon-targaryen': { preserveBanner: true, objectPosition: '60% center' },
}

const articles = [
  ['tyland-lannister', 'new-champion-tyland-lannister'],
  ['viserys-i', 'new-champion-viserys-i-targaryen'],
  ['ser-gwayne', 'new-champion-ser-gwayne-hightower'],
  ['daemon-targaryen', 'new-champion-daemon-targaryen'],
  ['seasmoke', 'new-champion-seasmoke'],
  ['oberyn-martell', 'new-champion-oberyn-martell'],
  ['mance-rayder', 'new-champion-mance-rayder'],
  ['nymeria-sand', 'new-champion-nymeria-sand'],
  ['olenna-tyrell', 'new-champion-olenna-tyrell'],
  ['tywin-lannister', 'new-champion-tywin-lannister'],
  ['jaqen-hghar', 'new-champion-jaqen-hghar'],
  ['osha', 'new-champion-osha'],
  ['egg', 'new-champion-egg'],
  ['jacaerys-velaryon', 'new-champion-jacaerys-velaryon'],
  ['ser-duncan', 'new-champion-ser-duncan-the-tall'],
  ['bran-stark', 'new-champion-bran-stark'],
  ['night-king', 'new-champion-the-night-king'],
  ['corlys-velaryon', 'new-champion-corlys-velaryon'],
  ['laenor-velaryon', 'new-champion-laenor-velaryon'],
  ['gregor-clegane', 'new-champion-gregor-clegane'],
  ['rhaenyra-black-queen', 'new-blacks-champion-rhaenyra-targaryen-the-black-queen'],
  ['cersei-seven-kingdoms', 'new-champion-cersei-lannister-queen-of-the-seven-kingdoms'],
]

const decodeHtml = (value) => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#x27;', "'")

function imageCandidates(html) {
  return [...html.matchAll(/<img\b[^>]*>/gi)].map((match, index) => {
    const tag = match[0]
    const alt = decodeHtml(tag.match(/\balt="([^"]*)"/i)?.[1] ?? '')
    const src = decodeHtml(tag.match(/\bsrc="([^"]+)"/i)?.[1] ?? '')
    if (!src.startsWith('https://images.ctfassets.net/7qho9llfhoio/')) return null
    const rawUrl = src.split('?')[0]
    const signal = `${alt} ${decodeURIComponent(rawUrl.split('/').at(-1) ?? '')}`.toLowerCase()
    let score = 0
    if (/new.?champ/.test(signal)) score += 100
    if (/\bsolo\b|\bsingle\b/.test(signal)) score += 80
    if (/blog.?post/.test(signal)) score += 45
    if (/best.?team|recommended.?team|team.?blog|raids.?team|bleed.?team|faction.?banner/.test(signal)) score -= 160
    if (/ability|passive|leader|skill|summon|icon|logo|favicon|social|browser|youtube|instagram|discord|facebook|screen.?shot/.test(signal)) score -= 200
    if (!/\.(?:jpe?g|png)$/i.test(rawUrl)) score -= 200
    return { alt, index, rawUrl, score }
  }).filter(Boolean).sort((a, b) => b.score - a.score || a.index - b.index)
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT } })
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.text()
}

async function fetchPortrait(assetUrl, options = {}) {
  const url = new URL(assetUrl)
  if (options.preserveBanner) {
    url.searchParams.set('w', '960')
  } else {
    url.searchParams.set('w', '320')
    url.searchParams.set('h', '400')
    url.searchParams.set('fit', 'thumb')
    url.searchParams.set('f', 'face')
  }
  url.searchParams.set('fm', 'webp')
  url.searchParams.set('q', '82')
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT } })
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  if (!response.headers.get('content-type')?.startsWith('image/')) throw new Error(`${url} did not return an image`)
  return Buffer.from(await response.arrayBuffer())
}

const sitemap = await fetchText(SITEMAP_URL)
const discovered = new Set([...sitemap.matchAll(/<loc>(https:\/\/www\.gameofthroneslegends\.com\/news\/new-(?:blacks-)?champion-[^<]+)<\/loc>/g)].map((match) => match[1]))
const mapped = new Set(articles.map(([, slug]) => `${SITE}/news/${slug}`))
for (const url of discovered) {
  if (!mapped.has(url)) console.warn(`Official champion article needs a roster mapping: ${url}`)
}

await mkdir(OUTPUT_DIR, { recursive: true })
const manifest = {}

for (const [championId, slug] of articles) {
  const sourceUrl = `${SITE}/news/${slug}`
  try {
    const html = await fetchText(sourceUrl)
    const candidate = imageCandidates(html)[0]
    if (!candidate || candidate.score < 1) throw new Error('no suitable champion artwork found')
    const options = portraitOverrides[championId] ?? {}
    const portrait = await fetchPortrait(candidate.rawUrl, options)
    await writeFile(new URL(`${championId}.webp`, OUTPUT_DIR), portrait)
    manifest[championId] = {
      sourceUrl,
      assetUrl: candidate.rawUrl,
      alt: candidate.alt || championId,
      version: createHash('sha256').update(portrait).digest('hex').slice(0, 10),
      ...(options.objectPosition ? { objectPosition: options.objectPosition } : {}),
    }
    console.log(`Added ${championId} from ${candidate.alt || candidate.rawUrl.split('/').at(-1)}`)
  } catch (error) {
    console.warn(`Skipped ${championId}: ${error.message}`)
  }
}

if (Object.keys(manifest).length < 15) throw new Error(`Only found ${Object.keys(manifest).length} official portraits; refusing to replace the manifest.`)
await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Updated ${Object.keys(manifest).length} official champion portraits.`)
