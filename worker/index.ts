import type { ChatImage, ChatMessage, ChatResponse, MapMarker, Source } from '../types.ts'
import { isKnownTile, MAX_ZOOM, MIN_ZOOM } from '../src/lib/mapTiles.ts'
import { findMapLocation, toMapMarker, toMapMarkerFromLocation } from './mapPins.ts'

interface Env {
  GROQ_API_KEY: string
  TAVILY_API_KEY: string
  GROQ_MODEL?: string
  ASSETS: { fetch: (request: Request) => Promise<Response> }
}

interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const TAVILY_ENDPOINT = 'https://api.tavily.com/search'
const MAX_BODY_BYTES = 32_000
const MAX_MESSAGES = 30
const MAX_MESSAGE_CHARS = 4_000
const MAX_RESULTS = 5
const MAX_IMAGES = 4
const GROQ_BUDGET_MS = 9_000
const GROQ_RETRY_DELAYS = [600, 1_200, 1_800]
const RETRY_ERROR = 'Something went wrong, please try again ...'
const TILE_UPSTREAM = 'https://maps.gtadb.org/tiles/6/day'

const SYSTEM_PROMPT = `You are Lester, a research assistant who specializes exclusively in Grand Theft Auto VI. You sound like Lester Crest: intelligent, analytical, dry and slightly sarcastic, but always concise and direct. Never over-explain.

Language: always answer in the same language the user writes in.

Accuracy rules, which override your personality:
- Never invent facts, numbers, locations, URLs or source titles.
- Clearly label anything uncertain as CONFIRMED, RUMOR or SPECULATION. CONFIRMED means supported by a cited source, not necessarily by Rockstar.
- Lack of Rockstar confirmation is provenance, not disproof. A detailed community/database source can support a claim: attribute it ("segundo [n]...", "according to [n]...") and say "not Rockstar-confirmed" when relevant, but never say something is invalid or does not exist solely because Rockstar has not confirmed it.
- If something cannot be verified from any available source, say so explicitly.
- Search results are leads, not gospel. Judge source quality: prefer official Rockstar Games material, then GTA Wiki, then reputable gaming publications, then established community sources. Mention contradictions when sources disagree.
- Never assume GTA V details also apply to GTA VI. If a detail comes from GTA V or an earlier game, say which game it is from.
- Never answer from memory when a question depends on specific GTA VI details that could change. Say you cannot verify it rather than guessing.

Research results:
- You will sometimes receive numbered research results. Treat them as leads, not proof. If they are absent, say so rather than inventing details.
- Answer the user's actual question, not the research instruction.

Citations:
- When you use search results, cite them inline using their numbers, like [1] or [2][3]. Put citations next to the claim they support.
- Only cite results you actually relied on. Never cite a result you did not use.
- Do not write your own Sources section; the interface adds one.
- If you did not search, do not include citations.
- When the user asks to see a place, map, vehicle or anything visual, mark the image with [IMG1] or [IMG2] right next to the claim it supports. Those numbers refer to the image URLs supplied with the research results. Never invent an image URL and never write markdown image syntax. Do not write "here is an image" or similar unless you also include an [IMGn] marker. If no supplied image is clearly an in-game GTA VI map, screenshot or vehicle photo, say no usable image was found.
- "Map" means the in-game GTA VI map: prefer screenshots or diagrams from Rockstar, GTA Wiki or gaming publications. Never substitute real-world map services such as Google Maps. If only real-world maps were found, say no in-game map image was found.
- Location markers: when the user asks where a place is, add up to 4 [MAP:<name>] markers, one per place backed by research or by the local GTADB index. Common indexed names include: Y Vice City sign, Vice Regal, Ocean View Hotel, Sahara Arena, VCIA Control Tower, Gellhorn International Raceway, Grassrivers Visitor Center, Jason's House, Leaf Links Golf Club, NINE1NINE, Break Inn (Downtown), Pegassi Residences South Tower, Bite House, Sugar Mill, Vice Beach, Downtown Vice City, Port Vice City, Tequesta Key, Vice City International Airport, Waning Sands, Rockridge, Stockyard, Port Gellhorn, Ambrosia, Grassrivers, Hamlet, Leonida Keys, Key Lento, Lake Leonida, Leaf Links, Watson Bay, Vice-Dale County, Mount Kalaga, Vice City. You may also use a precise named place from the GTADB index if research mentions it. Unknown names are silently ignored, so never invent a marker or coordinates. If no verified coordinate exists, do not add a marker and say the precise spot is not in the local map index.
- The local map is a GTADB community map, not an official Rockstar Games map. Some markers are approximate; say when a position is approximate and never present it as exact.

Formatting: short paragraphs or short bullet lists. No preamble like "Based on my research". Get to the point.`

const DECISION_PROMPT = `You decide whether a question needs a web search to be answered accurately about Grand Theft Auto VI. Reply with JSON only, using exactly these fields: {"query":"..."|null,"spoiler":true|false,"warning":"..."}

query: a focused search query, or null when no search is needed.
spoiler: true when answering would reveal main story details, plot, mission outcomes, character fates, twists or endings. When unsure, set true.
warning: required only when spoiler is true; one short spoiler alert in the same language as the user, ending with a yes/no choice.

Search when the question depends on facts that may be recent, specific or unverified: vehicles, prices, locations, characters, missions, properties, collectibles, leaks, update notes, release information or game mechanics.

Do not search for greetings, small talk, questions about who you are, or questions answerable from stable general knowledge. For location/map questions, search for the in-game GTA VI map or screenshot, not real-world maps. Keep the query under 200 characters and in the language of the question.`

class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function parseMessages(body: unknown): ChatMessage[] {
  if (!body || typeof body !== 'object' || !('messages' in body)) {
    throw new ApiError('A messages array is required.', 400)
  }

  const raw = (body as { messages: unknown }).messages
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) {
    throw new ApiError(`Send between 1 and ${MAX_MESSAGES} messages.`, 400)
  }

  const messages = raw.map((item) => {
    if (!item || typeof item !== 'object') {
      throw new ApiError('Each message must be an object.', 400)
    }
    const { role, content } = item as { role?: unknown; content?: unknown }
    if (role !== 'user' && role !== 'assistant') {
      throw new ApiError('Each message needs a valid role.', 400)
    }
    if (typeof content !== 'string') {
      throw new ApiError('Each message needs text content.', 400)
    }
    if (content.length === 0 || content.length > MAX_MESSAGE_CHARS) {
      throw new ApiError(`Messages must be 1-${MAX_MESSAGE_CHARS} characters.`, 400)
    }
    return { role: role as ChatMessage['role'], content }
  })

  if (messages[messages.length - 1].role !== 'user') {
    throw new ApiError('The last message must be from the user.', 400)
  }

  return messages
}

function parseAllowSpoilers(body: unknown): boolean {
  if (!body || typeof body !== 'object' || !('allowSpoilers' in body)) return false
  return (body as { allowSpoilers?: unknown }).allowSpoilers === true
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function callGroq(
  env: Env,
  messages: GroqMessage[],
  jsonMode = false,
  deadline = Date.now() + GROQ_BUDGET_MS,
): Promise<GroqMessage> {
  let attempt = 0

  while (true) {
    const remaining = deadline - Date.now()
    if (remaining <= 250) throw new ApiError(RETRY_ERROR, 504)

    let response: Response
    try {
      response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.GROQ_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: env.GROQ_MODEL || 'openai/gpt-oss-120b',
          messages,
          temperature: 0.4,
          max_completion_tokens: 1400,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
        signal: AbortSignal.timeout(remaining),
      })
    } catch {
      const delay = GROQ_RETRY_DELAYS[attempt]
      if (delay !== undefined && deadline - Date.now() > delay + 250) {
        await wait(delay)
        attempt++
        continue
      }
      throw new ApiError(RETRY_ERROR, 504)
    }

    if (!response.ok) {
      const status = response.status
      console.error('Groq error', status, (await response.text()).slice(0, 300))
      const delay = GROQ_RETRY_DELAYS[attempt]
      if (
        (status === 429 || status >= 500) &&
        delay !== undefined &&
        deadline - Date.now() > delay + 250
      ) {
        await wait(delay)
        attempt++
        continue
      }
      throw new ApiError(RETRY_ERROR, 502)
    }

    try {
      const data = (await response.json()) as {
        choices?: Array<{ message?: GroqMessage }>
      }
      const message = data.choices?.[0]?.message
      if (!message) throw new Error('Empty Groq response')
      return message
    } catch {
      throw new ApiError(RETRY_ERROR, 502)
    }
  }
}

async function searchTavily(
  env: Env,
  query: string,
  offset: number,
): Promise<{ sources: Source[]; images: string[] }> {
  let response: Response
  try {
    response = await fetch(TAVILY_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        api_key: env.TAVILY_API_KEY,
        query: query.slice(0, 300),
        max_results: MAX_RESULTS,
        search_depth: 'basic',
        include_answer: false,
        include_raw_content: false,
        include_images: true,
      }),
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    throw new ApiError('The search service did not respond in time. Try again.', 504)
  }

  if (!response.ok) {
    console.error('Tavily error', response.status)
    throw new ApiError('The search service is unavailable right now.', 502)
  }

  const data = (await response.json()) as {
    results?: Array<{ title?: string; url?: string; content?: string }>
    images?: unknown[]
  }

  const sources = (data.results || [])
    .filter((result): result is { title: string; url: string; content: string } =>
      typeof result.url === 'string' && result.url.startsWith('https://')
    )
    .map((result, index) => {
      let site = 'unknown'
      try {
        site = new URL(result.url).hostname.replace(/^www\./, '')
      } catch {
        site = 'unknown'
      }
      return {
        number: offset + index + 1,
        title: result.title || result.url,
        url: result.url,
        site,
        snippet: (result.content || '').slice(0, 1200),
      }
    })

  const candidates = (data.images || [])
    .map((image) => {
      if (typeof image === 'string') return image
      if (image && typeof image === 'object' && 'url' in image && typeof image.url === 'string') {
        return image.url
      }
      return ''
    })
    .filter((url) => url.startsWith('https://'))
    .slice(0, MAX_IMAGES)

  const images = await Promise.all(
    candidates.map(async (url) => {
      try {
        const response = await fetch(url, {
          headers: { 'user-agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(6_000),
        })
        const isImage = response.ok && (response.headers.get('content-type') || '').startsWith('image/')
        void response.body?.cancel()
        return isImage ? url : ''
      } catch {
        return ''
      }
    }),
  )

  return { sources, images: images.filter(Boolean) }
}

function citedSources(answer: string, sources: Source[]): Source[] {
  const used = new Set<number>()
  for (const match of answer.matchAll(/\[(\d+)\]/g)) {
    const index = Number(match[1])
    if (index >= 1 && index <= sources.length) used.add(index - 1)
  }
  if (used.size === 0) return sources
  return sources.filter((_, index) => used.has(index))
}

function selectImages(
  answer: string,
  candidates: string[],
): { reply: string; images: ChatImage[] } {
  const images: ChatImage[] = []
  const seen = new Set<string>()

  function add(index: number, caption: string) {
    const url = candidates[index - 1]
    if (!url || seen.has(url) || images.length >= 2) return
    seen.add(url)
    images.push({ url, caption: caption.trim().slice(0, 120) || 'Imagem encontrada na pesquisa' })
  }

  const reply = answer
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_match, caption: string, url: string) => {
      const index = candidates.indexOf(url)
      if (index >= 0) add(index + 1, caption)
      return ''
    })
    .replace(/\[IMG(\d+)\]/g, (_match, index: string) => {
      add(Number(index), '')
      return ''
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return { reply, images }
}

function selectMapPins(answer: string): { reply: string; markers: MapMarker[] } {
  const markers: MapMarker[] = []
  const seen = new Set<string>()

  for (const match of answer.matchAll(/\[MAP:([^\]]+)\]/gi)) {
    const found = findMapLocation(match[1])
    if (!found) continue
    const marker = 'aliases' in found ? toMapMarker(found) : toMapMarkerFromLocation(found)
    if (seen.has(marker.id) || markers.length >= 4) continue
    seen.add(marker.id)
    markers.push(marker)
  }

  const reply = answer
    .replace(/\[MAP:[^\]]+\]/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return { reply, markers }
}

async function handleChat(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Use POST.' }, 405)
  }

  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (declaredLength > MAX_BODY_BYTES) {
    return json({ error: 'Message is too large.' }, 413)
  }

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return json({ error: 'Could not read the request.' }, 400)
  }
  if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
    return json({ error: 'Message is too large.' }, 413)
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return json({ error: 'Invalid JSON.' }, 400)
  }

  let messages: ChatMessage[]
  try {
    messages = parseMessages(body)
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Invalid request.'
    return json({ error: message }, 400)
  }

  const allowSpoilers = parseAllowSpoilers(body)

  if (!env.GROQ_API_KEY || !env.TAVILY_API_KEY) {
    return json({ error: 'The assistant is not configured yet.' }, 503)
  }

  const history: GroqMessage[] = messages.map((message) => ({
    role: message.role,
    content: message.content,
  }))

  const groqDeadline = Date.now() + GROQ_BUDGET_MS

  try {
    const decision = await callGroq(
      env,
      [{ role: 'system', content: DECISION_PROMPT }, ...history],
      true,
      groqDeadline,
    )
    let query: string | null = null
    let spoiler = false
    let warning = 'SPOILER ALERT - a tua pergunta pode levar a spoilers da história principal. Continuar? Sim ou Não.'
    try {
      const parsed = JSON.parse(decision.content) as {
        query?: unknown
        spoiler?: unknown
        warning?: unknown
      }
      if (typeof parsed.query === 'string' && parsed.query.trim()) {
        query = parsed.query.trim().slice(0, 300)
      }
      spoiler = parsed.spoiler === true
      if (typeof parsed.warning === 'string' && parsed.warning.trim()) {
        warning = parsed.warning.trim().slice(0, 240)
      }
    } catch {
      query = null
    }

    if (spoiler && !allowSpoilers) {
      return json({
        reply: warning,
        sources: [],
        images: [],
        spoilerWarning: true,
      } satisfies ChatResponse)
    }

    const { sources, images } = query
      ? await searchTavily(env, query, 0)
      : { sources: [] as Source[], images: [] as string[] }
    const conversation: GroqMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(allowSpoilers
        ? [
            {
              role: 'system' as const,
              content:
                'SPOILER CONSENT: the user explicitly accepted spoilers. You may discuss main story details when supported by the sources.',
            },
          ]
        : []),
      ...history,
    ]

    if (query) {
      const findings =
        sources
          .map(
            (source) =>
              `[${source.number}] ${source.title} (${source.site})\nURL: ${source.url}\n${source.snippet}`,
          )
          .join('\n\n') || 'No results found.'
      const imageLines = images.map((url, index) => `[IMG${index + 1}] ${url}`).join('\n')
      conversation.push({
        role: 'user',
        content: `RESEARCH RESULTS:\n${findings}\n\nIMAGE URLS FOUND IN SEARCH:\n${imageLines || 'none'}\n\nAnswer the user's previous message using these results. Cite only the results you actually used as [n]. If they are unreliable or contradictory, say so. If the user wants to see something visual, include at most 2 [IMGn] markers using only the URLs listed above. If the user asks where a place is, include its [MAP:name] marker from the available names.`,
      })
    }

    const reply = await callGroq(env, conversation, false, groqDeadline)
    const answer = reply.content.trim()
    if (!answer) return json({ error: 'Lester came back empty. Try again.' }, 502)
    const { reply: withImages, images: selectedImages } = selectImages(answer, images)
    const { reply: text, markers } = selectMapPins(withImages)
    if (selectedImages.length) {
      console.log('Selected images', selectedImages.map((image) => image.url).join(' '))
    }
    return json(
      {
        reply: text,
        sources: citedSources(answer, sources),
        images: selectedImages,
        ...(markers.length ? { markers } : {}),
      } satisfies ChatResponse,
    )
  } catch (error) {
    if (error instanceof ApiError) {
      return json({ error: error.message }, error.status)
    }
    console.error('Unexpected chat error', error)
    return json({ error: 'Something went wrong. Try again.' }, 500)
  }
}

async function handleTile(request: Request, zRaw: string, yRaw: string, xRaw: string) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const z = Number(zRaw)
  const y = Number(yRaw)
  const x = Number(xRaw)
  if (
    !Number.isInteger(z) ||
    !Number.isInteger(y) ||
    !Number.isInteger(x) ||
    z < MIN_ZOOM ||
    z > MAX_ZOOM ||
    !isKnownTile(z, x, y)
  ) {
    return new Response(null, { status: 204 })
  }

  try {
    const response = await fetch(`${TILE_UPSTREAM}/${z}/${z},${y},${x}.jpg`, {
      headers: {
        'user-agent': 'Lester/1.0 (+https://github.com/rolux/gtadb.org)',
        referer: 'https://map.gtadb.org/',
      },
    })
    if (!response.ok || !response.body) return new Response(null, { status: 204 })
    return new Response(response.body, {
      status: 200,
      headers: {
        'content-type': response.headers.get('content-type') ?? 'image/jpeg',
        'cache-control': 'public, max-age=31536000, immutable',
        'x-content-type-options': 'nosniff',
      },
    })
  } catch {
    return new Response(null, { status: 204 })
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (pathname === '/api/debug') {
      return json({
        keys: Object.keys(env),
        groq: Boolean(env.GROQ_API_KEY),
        tavily: Boolean(env.TAVILY_API_KEY),
        model: env.GROQ_MODEL ?? null,
      })
    }
    if (pathname === '/api/chat') {
      return handleChat(request, env)
    }
    const tileMatch = pathname.match(/^\/api\/tile\/(\d+)\/(\d+)\/(\d+)$/)
    if (tileMatch) {
      return handleTile(request, tileMatch[1], tileMatch[2], tileMatch[3])
    }
    if (request.method === 'GET' && request.headers.get('accept')?.includes('text/html')) {
      return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request))
    }
    return new Response('Not found', { status: 404 })
  },
}
