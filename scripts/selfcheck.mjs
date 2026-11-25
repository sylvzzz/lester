import assert from 'node:assert/strict'
import { cropTileSize, markerToTile, tileBounds } from '../src/lib/mapTiles.ts'
import worker from '../worker/index.ts'

const env = { GROQ_API_KEY: 'groq-test-key', TAVILY_API_KEY: 'tavily-test-key' }
const calls = []
let search = true
let spoiler = false
let rateLimitOnce = false
let rateLimitAll = false

globalThis.fetch = async (url, init) => {
  const target = String(url)
  const body = init.body ? JSON.parse(init.body) : {}
  calls.push({ target, init, body })

  if (target.includes('api.groq.com')) {
    if (rateLimitOnce || rateLimitAll) {
      rateLimitOnce = false
      return new Response(JSON.stringify({ error: { message: 'Rate limit reached' } }), {
        status: 429,
        headers: { 'content-type': 'application/json' },
      })
    }
    if (body.response_format?.type === 'json_object') {
      return Response.json({
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify({
                query: search ? 'GTA VI release date' : null,
                spoiler,
                ...(spoiler
                  ? { warning: 'SPOILER ALERT - spoilers da história principal. Continuar? Sim ou Não.' }
                  : {}),
              }),
            },
          },
        ],
      })
    }
    return Response.json({
      choices: [
        {
          message: {
            role: 'assistant',
            content: search
              ? 'Confirmed for now [1]. [IMG1] [MAP:Vice Beach] [MAP:Mount Kalaga] [MAP:Albany Hotel, Washington Beach, Vice Beach] [MAP:Nowhere]'
              : 'Just a quick answer.',
          },
        },
      ],
    })
  }

  if (target.includes('api.tavily.com')) {
    return Response.json({
      results: [
        {
          title: 'Rockstar Games',
          url: 'https://www.rockstargames.com/VI',
          content: 'Official information.',
        },
      ],
      images: ['https://example.com/vice-city-map.jpg', 'not-a-url'],
    })
  }

  if (target === 'https://example.com/vice-city-map.jpg') {
    return new Response('image', { headers: { 'content-type': 'image/jpeg' } })
  }

  if (target.startsWith('https://maps.gtadb.org/tiles/')) {
    return new Response('tile', { headers: { 'content-type': 'image/jpeg' } })
  }

  throw new Error(`Unexpected fetch to ${target}`)
}

function post(body) {
  return worker.fetch(
    new Request('https://example.com/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    env,
  )
}

const bad = await post({ messages: [{ role: 'user', content: 'x'.repeat(4001) }] })
assert.equal(bad.status, 400)

const response = await post({ messages: [{ role: 'user', content: 'When does GTA VI come out?' }] })
assert.equal(response.status, 200)
const data = await response.json()
assert.match(data.reply, /\[1\]/)
assert.ok(!data.reply.includes('[IMG1]'))
assert.ok(!data.reply.includes('[MAP:'))
assert.equal(data.images.length, 1)
assert.equal(data.images[0].url, 'https://example.com/vice-city-map.jpg')
assert.equal(data.markers.length, 3)
assert.equal(data.markers[0].name, 'Vice Beach')
assert.equal(data.markers[0].x, 73.3)
assert.equal(data.markers[0].y, 46.7)
assert.equal(data.markers[0].confidence, 'approximate')
assert.equal(data.markers[0].source.url, 'https://github.com/rolux/gtadb.org')
assert.equal(data.markers[1].name, 'Mount Kalaga')
assert.equal(data.markers[1].x, 52.9)
assert.equal(data.markers[1].y, 28.8)
assert.equal(data.markers[2].name, 'Albany Hotel, Washington Beach, Vice Beach')
assert.equal(data.markers[2].category, 'landmark')
assert.equal(data.markers[2].source.url, 'https://github.com/rolux/gtadb.org')
assert.equal(data.map, undefined)
assert.equal(data.sources.length, 1)
assert.equal(data.sources[0].number, 1)
assert.equal(data.sources[0].site, 'rockstargames.com')
assert.ok(!JSON.stringify(data).includes('groq-test-key'))
assert.ok(!JSON.stringify(data).includes('tavily-test-key'))

const groqCalls = calls.filter((call) => call.target.includes('api.groq.com'))
const tavilyCalls = calls.filter((call) => call.target.includes('api.tavily.com'))
assert.equal(groqCalls.length, 2)
assert.equal(tavilyCalls.length, 1)
assert.equal(groqCalls[0].init.headers.authorization, 'Bearer groq-test-key')
assert.equal(groqCalls[0].body.response_format.type, 'json_object')
assert.ok(!('tools' in groqCalls[0].body))
assert.equal(tavilyCalls[0].body.api_key, 'tavily-test-key')
assert.equal(tavilyCalls[0].body.query, 'GTA VI release date')
assert.equal(tavilyCalls[0].body.include_images, true)
assert.match(groqCalls[1].body.messages.at(-1).content, /RESEARCH RESULTS/)
assert.match(groqCalls[1].body.messages.at(-1).content, /\[IMG1\] https:\/\/example.com\/vice-city-map.jpg/)
assert.match(groqCalls[1].body.messages[0].content, /not Rockstar-confirmed/)

calls.length = 0
search = true
spoiler = true
const warned = await post({
  messages: [{ role: 'user', content: 'What happens in the main story?' }],
})
assert.equal(warned.status, 200)
const warnedData = await warned.json()
assert.equal(warnedData.spoilerWarning, true)
assert.match(warnedData.reply, /SPOILER ALERT/)
assert.deepEqual(warnedData.sources, [])
assert.deepEqual(warnedData.images, [])
assert.equal(calls.filter((call) => call.target.includes('api.tavily.com')).length, 0)
assert.equal(calls.filter((call) => call.target.includes('api.groq.com')).length, 1)

calls.length = 0
const allowed = await post({
  messages: [{ role: 'user', content: 'What happens in the main story?' }],
  allowSpoilers: true,
})
assert.equal(allowed.status, 200)
const allowedData = await allowed.json()
assert.equal(allowedData.spoilerWarning, undefined)
assert.match(allowedData.reply, /Confirmed for now/)
assert.equal(calls.filter((call) => call.target.includes('api.tavily.com')).length, 1)
const allowedGroqCalls = calls.filter((call) => call.target.includes('api.groq.com'))
assert.equal(allowedGroqCalls.length, 2)
assert.match(allowedGroqCalls[1].body.messages[1].content, /SPOILER CONSENT/)

calls.length = 0
search = true
spoiler = false
rateLimitOnce = true
const retried = await post({ messages: [{ role: 'user', content: 'Which vehicles are confirmed?' }] })
assert.equal(retried.status, 200)
assert.equal(calls.filter((call) => call.target.includes('api.groq.com')).length, 3)

calls.length = 0
rateLimitAll = true
const failed = await post({ messages: [{ role: 'user', content: 'Which vehicles are confirmed?' }] })
assert.equal(failed.status, 502)
const failedData = await failed.json()
assert.equal(failedData.error, 'Something went wrong, please try again ...')
assert.equal(calls.filter((call) => call.target.includes('api.groq.com')).length, 4)

calls.length = 0
search = false
spoiler = false
rateLimitAll = false
const direct = await post({ messages: [{ role: 'user', content: 'Who are you?' }] })
assert.equal(direct.status, 200)
const directData = await direct.json()
assert.deepEqual(directData.sources, [])
assert.deepEqual(directData.images, [])
assert.equal(directData.markers, undefined)
assert.equal(calls.filter((call) => call.target.includes('api.tavily.com')).length, 0)

assert.deepEqual(cropTileSize(0), { width: 768, height: 1024 })
assert.deepEqual(tileBounds(6), { maxX: 191, maxY: 255 })
assert.deepEqual(markerToTile(72.4, 41.4, 6), { x: 139, y: 105 })

calls.length = 0
const tile = await worker.fetch(new Request('https://example.com/api/tile/6/105/139'), env)
assert.equal(tile.status, 200)
assert.equal(tile.headers.get('content-type'), 'image/jpeg')
assert.equal(tile.headers.get('cache-control'), 'public, max-age=31536000, immutable')
assert.equal(calls.length, 1)
assert.equal(calls[0].target, 'https://maps.gtadb.org/tiles/6/day/6/6,105,139.jpg')
assert.equal(calls[0].init.headers.referer, 'https://map.gtadb.org/')

const missingTile = await worker.fetch(new Request('https://example.com/api/tile/6/999/999'), env)
assert.equal(missingTile.status, 204)

assert.equal(
  (await worker.fetch(new Request('https://example.com/index.html'), env)).status,
  404,
)

console.log('worker self-check passed')
