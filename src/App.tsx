import { useEffect, useRef, useState } from 'react'
import Header from './components/Header.tsx'
import MessageBubble from './components/MessageBubble.tsx'
import ThinkingIndicator from './components/ThinkingIndicator.tsx'
import Composer from './components/Composer.tsx'
import ViceBackdrop from './components/ViceBackdrop.tsx'
import { sendChat } from './lib/chat.ts'
import type { ChatImage, ChatMapPin, ChatMessage, MapMarker, Source } from '../types.ts'

type DisplayMessage = ChatMessage & {
  id: number
  sources?: Source[]
  images?: ChatImage[]
  map?: ChatMapPin
  markers?: MapMarker[]
  spoilerPrompt?: boolean
  spoilerCancelled?: boolean
}

const PROMPTS = [
  'What is actually confirmed about GTA VI?',
  'Which vehicles have been confirmed so far?',
  'Tell me about Vice City and its locations.',
  'What money-making methods are known?',
]

const THINKING_LABEL = 'Lester is working'
const SLOW_LABEL = 'Lester is using 1% more of his brain to help you...'
const SLOW_AFTER_MS = 5_000
const TIMEOUT_AFTER_MS = 10_000

export default function App() {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [thinkingLabel, setThinkingLabel] = useState(THINKING_LABEL)
  const nextId = useRef(0)
  const requestId = useRef(0)
  const spoilerHistoryRef = useRef<ChatMessage[] | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading, error])

  function newChat() {
    requestId.current++
    spoilerHistoryRef.current = null
    setMessages([])
    setLoading(false)
    setError('')
    setThinkingLabel(THINKING_LABEL)
  }

  async function runChat(history: ChatMessage[], allowSpoilers = false) {
    const id = ++requestId.current
    const controller = new AbortController()
    const slowTimer = setTimeout(() => setThinkingLabel(SLOW_LABEL), SLOW_AFTER_MS)
    const timeoutTimer = setTimeout(() => controller.abort(), TIMEOUT_AFTER_MS)

    setLoading(true)
    setError('')
    setThinkingLabel(THINKING_LABEL)

    try {
      const data = await sendChat(history, allowSpoilers, controller.signal)
      if (id !== requestId.current) return

      if (data.spoilerWarning) {
        spoilerHistoryRef.current = history
        setMessages((current) => [
          ...current,
          {
            id: nextId.current++,
            role: 'assistant',
            content: data.reply,
            spoilerPrompt: true,
          },
        ])
        return
      }

      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: 'assistant',
          content: data.reply,
          sources: data.sources,
          images: data.images,
          map: data.map,
          markers: data.markers,
        },
      ])
    } catch (cause) {
      if (id !== requestId.current) return
      setError(cause instanceof Error ? cause.message : 'Something went wrong, please try again ...')
    } finally {
      clearTimeout(slowTimer)
      clearTimeout(timeoutTimer)
      setThinkingLabel(THINKING_LABEL)
      if (id === requestId.current) setLoading(false)
    }
  }

  function send(text: string) {
    const content = text.trim()
    if (!content || loading) return

    spoilerHistoryRef.current = null
    const updated: DisplayMessage[] = [
      ...messages,
      { id: nextId.current++, role: 'user', content },
    ]
    setMessages(updated)
    void runChat(
      updated.map(({ role, content: message }) => ({
        role,
        content: message,
      })),
    )
  }

  function confirmSpoilers() {
    const history = spoilerHistoryRef.current
    if (!history || loading) return

    spoilerHistoryRef.current = null
    setMessages((current) => current.filter((message) => !message.spoilerPrompt))
    void runChat(history, true)
  }

  function cancelSpoilers() {
    spoilerHistoryRef.current = null
    setMessages((current) =>
      current.map((message) =>
        message.spoilerPrompt
          ? {
              ...message,
              spoilerCancelled: true,
              content: 'Sem spoilers. Pergunta cancelada.',
            }
          : message,
      ),
    )
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-vice-950">
      <ViceBackdrop />
      <Header onNewChat={newChat} />

      <main className="chat-scroll relative flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-6 sm:px-6">
          {messages.length === 0 ? (
            <Welcome onPick={send} />
          ) : (
            <div className="space-y-6 py-2">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onConfirmSpoilers={confirmSpoilers}
                  onCancelSpoilers={cancelSpoilers}
                />
              ))}
            </div>
          )}

          {loading && (
            <div className="mt-6">
              <ThinkingIndicator label={thinkingLabel} />
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-neon-pink/30 bg-vice-900/80 px-4 py-3 text-sm text-sunset-pink"
            >
              {error}
            </div>
          )}

          <div ref={bottomRef} className="shrink-0 pt-6" />
        </div>
      </main>

      <Composer onSend={send} disabled={loading} />
    </div>
  )
}

function Welcome({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="my-auto py-8">
      <div className="rounded-2xl border border-neon-pink/20 bg-vice-900/75 p-6 shadow-[0_12px_40px_rgba(12,4,24,0.4)] sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-electric-purple/30 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-tropical-cyan/80">
          <span className="size-1.5 rounded-full bg-tropical-cyan shadow-[0_0_6px_#45ddeb]" />
          Secure line established
        </div>
        <h2 className="mt-6 bg-gradient-to-r from-sunset-pink to-tropical-cyan bg-clip-text font-mono text-2xl font-semibold tracking-tight text-transparent sm:text-3xl">
          Vice City&apos;s on the line.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-300">
          I keep track of Vice City and everything Rockstar leaks, confirms or quietly buries. Ask me
          about vehicles, missions, characters, collectibles or money. I check the web before I open
          my mouth.
        </p>
        <div className="mt-7 grid gap-2 sm:grid-cols-2">
          {PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onPick(prompt)}
              className="rounded-xl border border-electric-purple/25 bg-vice-950/50 px-3 py-2.5 text-left text-xs text-zinc-300 transition hover:border-neon-pink/50 hover:text-sunset-pink"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
