import type { ChatMessage, ChatResponse } from '../../types.ts'

const TIMEOUT_ERROR = 'Something went wrong, please try again ...'

export async function sendChat(
  messages: ChatMessage[],
  allowSpoilers = false,
  signal?: AbortSignal,
): Promise<ChatResponse> {
  let response: Response
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages, allowSpoilers }),
      signal,
    })
  } catch {
    if (signal?.aborted) throw new Error(TIMEOUT_ERROR)
    throw new Error('Cannot reach Lester. Check your connection.')
  }

  const data = (await response.json().catch(() => null)) as
    | (Partial<ChatResponse> & { error?: string })
    | null

  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status}).`)
  }
  if (!data || typeof data.reply !== 'string') {
    throw new Error('Lester sent an unexpected response.')
  }

  return {
    reply: data.reply,
    sources: Array.isArray(data.sources) ? data.sources : [],
    images: Array.isArray(data.images) ? data.images : [],
    ...(data.map ? { map: data.map } : {}),
    ...(data.markers?.length ? { markers: data.markers } : {}),
    ...(data.spoilerWarning ? { spoilerWarning: true } : {}),
  }
}
