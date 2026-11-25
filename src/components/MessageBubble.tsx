import type { ChatImage, ChatMapPin, ChatMessage, MapMarker, Source } from '../../types.ts'
import { MAP_SOURCE } from '../lib/mapCategories.ts'
import ImageGallery from './ImageGallery.tsx'
import { MapPreview } from './MapPreview.tsx'
import Markdown from './Markdown.tsx'
import SourceList from './SourceList.tsx'

type Message = ChatMessage & {
  sources?: Source[]
  images?: ChatImage[]
  map?: ChatMapPin
  markers?: MapMarker[]
  spoilerPrompt?: boolean
  spoilerCancelled?: boolean
}

type Props = {
  message: Message
  onConfirmSpoilers: () => void
  onCancelSpoilers: () => void
}

export default function MessageBubble({
  message,
  onConfirmSpoilers,
  onCancelSpoilers,
}: Props) {
  const isUser = message.role === 'user'

  const markers =
    message.markers && message.markers.length > 0
      ? message.markers
      : message.map
        ? [
            {
              id: 'legacy-map-pin',
              name: message.map.label,
              x: message.map.x,
              y: message.map.y,
              category: 'landmark',
              confidence: 'approximate',
              description: `${message.map.label}: posição aproximada a partir do índice local.`,
              source: MAP_SOURCE,
            } satisfies MapMarker,
          ]
        : []

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] rounded-2xl border px-4 py-3 shadow-[0_6px_24px_rgba(12,4,24,0.35)] sm:max-w-[82%] ${
          isUser
            ? 'border-neon-pink/30 bg-gradient-to-br from-neon-pink/20 to-electric-purple/15 text-white'
            : message.spoilerPrompt && !message.spoilerCancelled
              ? 'border-amber-400/40 bg-amber-950/30 text-zinc-100'
              : 'border-electric-purple/25 bg-vice-900/80 text-zinc-100'
        }`}
      >
        {!isUser && (
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-sunset-pink">
            Lester // analysis
          </div>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
        ) : message.spoilerPrompt && !message.spoilerCancelled ? (
          <div>
            <p className="text-sm font-semibold text-amber-300">SPOILER ALERT</p>
            <p className="mt-1 text-xs leading-relaxed text-white/70">
              {message.content.replace(/^SPOILER ALERT\s*-\s*/i, '')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onConfirmSpoilers}
                className="rounded-lg border border-amber-400/50 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/25"
              >
                Sim, continuar
              </button>
              <button
                type="button"
                onClick={onCancelSpoilers}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10"
              >
                Não
              </button>
            </div>
          </div>
        ) : (
          <Markdown content={message.content} />
        )}
        {!isUser && markers.length > 0 && <MapPreview markers={markers} />}
        {!isUser && message.images && <ImageGallery images={message.images} />}
        {!isUser && message.sources && message.sources.length > 0 && (
          <SourceList sources={message.sources} />
        )}
      </div>
    </div>
  )
}
