import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { MapCategory, MapLocation, MapMarker } from '../../types.ts'
import { MAP_LOCATIONS } from '../data/mapLocations.ts'
import {
  CATEGORY_ORDER,
  CONFIDENCE_LABELS,
  MAP_CATEGORIES,
  MAP_SOURCE,
} from '../lib/mapCategories.ts'
import { CategoryIcon } from './CategoryIcon.tsx'

type Props = {
  markers: MapMarker[]
  onClose: () => void
}

type Offset = { x: number; y: number }

const DEFAULT_SCALE = 1.25
const MIN_SCALE = 1
const MAX_SCALE = 5

function asMarker(location: MapLocation): MapMarker {
  return {
    ...location,
    description: `${location.name} — localização catalogada pela GTADB.`,
    source: MAP_SOURCE,
  }
}

const MarkerLayer = memo(function MarkerLayer({
  locations,
  scale,
  selectedId,
  onSelect,
}: {
  locations: MapMarker[]
  scale: number
  selectedId?: string
  onSelect: (location: MapMarker) => void
}) {
  return (
    <>
      {locations.map((location) => {
        const config = MAP_CATEGORIES[location.category]
        const isSelected = selectedId === location.id
        return (
          <button
            key={location.id}
            type="button"
            aria-label={location.name}
            title={location.name}
            onClick={(event) => {
              event.stopPropagation()
              onSelect(location)
            }}
            className={`absolute z-10 grid h-6 w-6 place-items-center rounded-full border transition ${
              isSelected ? 'ring-2 ring-white' : 'border-white/30'
            }`}
            style={{
              left: `${location.x}%`,
              top: `${location.y}%`,
              transform: `translate(-50%, -50%) scale(${1 / scale})`,
              backgroundColor: config.color,
              color: '#0a0610',
              borderStyle: location.confidence === 'rumour' ? 'dashed' : 'solid',
              boxShadow: `0 0 10px ${config.color}99`,
            }}
          >
            <CategoryIcon category={location.category} className="h-3.5 w-3.5" />
          </button>
        )
      })}
    </>
  )
})

export function InteractiveMap({ markers, onClose }: Props) {
  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 })
  const [selected, setSelected] = useState<MapMarker | null>(null)
  const [query, setQuery] = useState('')
  const [activeCategories, setActiveCategories] = useState<Set<MapCategory>>(
    () => new Set(CATEGORY_ORDER),
  )
  const [layerSize, setLayerSize] = useState({ width: 0, height: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)
  const scaleRef = useRef(DEFAULT_SCALE)
  const offsetRef = useRef<Offset>({ x: 0, y: 0 })
  const layerSizeRef = useRef({ width: 0, height: 0 })

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const applyTransform = useCallback((nextOffset: Offset, nextScale: number) => {
    const layer = layerRef.current
    if (!layer) return
    layer.style.transform = `translate(-50%, -50%) translate3d(${nextOffset.x}px, ${nextOffset.y}px, 0) scale(${nextScale})`
  }, [])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const update = () => {
      const { width, height } = container.getBoundingClientRect()
      const mapWidth = Math.max(1, Math.min(width, (height * 3) / 4))
      const size = { width: mapWidth, height: (mapWidth * 4) / 3 }
      layerSizeRef.current = size
      setLayerSize(size)
      applyTransform(offsetRef.current, scaleRef.current)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [applyTransform])

  const clampOffset = useCallback((next: Offset, nextScale: number): Offset => {
    const container = containerRef.current?.getBoundingClientRect()
    const size = layerSizeRef.current
    if (!container || !size.width) return next
    const maxX = Math.max(0, (size.width * nextScale - container.width) / 2) + 48
    const maxY = Math.max(0, (size.height * nextScale - container.height) / 2) + 48
    return {
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    }
  }, [])

  const applyView = useCallback(
    (nextOffset: Offset, nextScale: number) => {
      const boundedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, nextScale))
      const boundedOffset = clampOffset(nextOffset, boundedScale)
      offsetRef.current = boundedOffset
      scaleRef.current = boundedScale
      applyTransform(boundedOffset, boundedScale)
    },
    [applyTransform, clampOffset],
  )

  const commitView = useCallback(
    (nextOffset: Offset, nextScale: number) => {
      applyView(nextOffset, nextScale)
      setOffset(offsetRef.current)
      setScale(scaleRef.current)
    },
    [applyView],
  )

  const zoomAt = useCallback(
    (factor: number, localX: number, localY: number) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scaleRef.current * factor))
      const cursorX = localX - rect.width / 2
      const cursorY = localY - rect.height / 2
      const mapX = (cursorX - offsetRef.current.x) / scaleRef.current
      const mapY = (cursorY - offsetRef.current.y) / scaleRef.current
      commitView(
        { x: cursorX - mapX * nextScale, y: cursorY - mapY * nextScale },
        nextScale,
      )
    },
    [commitView],
  )

  const zoomFromCenter = useCallback(
    (factor: number) => {
      const rect = containerRef.current?.getBoundingClientRect()
      zoomAt(factor, rect ? rect.width / 2 : 0, rect ? rect.height / 2 : 0)
    },
    [zoomAt],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = container.getBoundingClientRect()
      zoomAt(event.deltaY < 0 ? 1.12 : 0.89, event.clientX - rect.left, event.clientY - rect.top)
    }
    container.addEventListener('wheel', onWheel, { passive: false })
    return () => container.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  const reset = useCallback(() => {
    commitView({ x: 0, y: 0 }, DEFAULT_SCALE)
    setSelected(null)
  }, [commitView])

  const focus = useCallback(
    (location: MapMarker) => {
      const size = layerSizeRef.current
      const nextScale = Math.max(scaleRef.current, 2.4)
      commitView(
        {
          x: (size.width / 2 - (location.x / 100) * size.width) * nextScale,
          y: (size.height / 2 - (location.y / 100) * size.height) * nextScale,
        },
        nextScale,
      )
      setSelected(location)
    },
    [commitView],
  )

  const selectLocation = useCallback((location: MapMarker) => setSelected(location), [])

  const locations = useMemo(() => {
    const fromLester = new Set(markers.map((marker) => `${marker.name}|${marker.x}|${marker.y}`))
    return [
      ...markers,
      ...MAP_LOCATIONS.filter(
        (location) => !fromLester.has(`${location.name}|${location.x}|${location.y}`),
      ).map(asMarker),
    ]
  }, [markers])

  const visible = useMemo(
    () => locations.filter((location) => activeCategories.has(location.category)),
    [locations, activeCategories],
  )

  const results = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return []
    return locations
      .filter((location) => location.name.toLowerCase().includes(term))
      .slice(0, 30)
  }, [locations, query])

  function toggleCategory(category: MapCategory) {
    setActiveCategories((current) => {
      const next = new Set(current)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      tx: offsetRef.current.x,
      ty: offsetRef.current.y,
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) return
    applyView(
      {
        x: drag.tx + event.clientX - drag.x,
        y: drag.ty + event.clientY - drag.y,
      },
      scaleRef.current,
    )
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const wasDragging = dragRef.current !== null
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (wasDragging) commitView(offsetRef.current, scaleRef.current)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mapa interativo de Leonida"
      className="fixed inset-0 z-50 flex flex-col bg-vice-950/95 backdrop-blur-xl"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-fuchsia-500/20 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.35em] text-fuchsia-400">Lester Atlas</p>
          <h2 className="truncate text-base font-semibold text-white">Mapa de Leonida</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-fuchsia-500/30 px-3 py-1.5 text-xs text-fuchsia-200 transition hover:bg-fuchsia-500/10"
        >
          Fechar
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div
          ref={containerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={() => setSelected(null)}
          className="relative min-h-[55vh] flex-1 touch-none select-none overflow-hidden bg-[#0b0512]"
        >
          <div
            ref={layerRef}
            className="absolute left-1/2 top-1/2"
            style={{
              width: layerSize.width,
              height: layerSize.height,
              transform: `translate(-50%, -50%) translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
              transformOrigin: 'center center',
              willChange: 'transform',
            }}
          >
            <img
              src="/gta6-map.jpg"
              alt="Mapa in-game de Leonida"
              draggable={false}
              className="pointer-events-none h-full w-full object-fill"
            />

            <MarkerLayer
              locations={visible}
              scale={scale}
              selectedId={selected?.id}
              onSelect={selectLocation}
            />
          </div>

          <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-lg border border-fuchsia-500/20 bg-vice-950/90 px-2.5 py-1.5 text-[10px] uppercase tracking-widest text-fuchsia-200 backdrop-blur">
            {visible.length} pontos · {Math.round(scale * 100)}%
          </div>

          <div className="absolute right-3 top-3 z-20 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => zoomFromCenter(1.25)}
              aria-label="Aproximar"
              className="grid h-9 w-9 place-items-center rounded-lg border border-fuchsia-500/30 bg-vice-950/90 text-lg text-white backdrop-blur transition hover:bg-fuchsia-500/20"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => zoomFromCenter(0.8)}
              aria-label="Afastar"
              className="grid h-9 w-9 place-items-center rounded-lg border border-fuchsia-500/30 bg-vice-950/90 text-lg text-white backdrop-blur transition hover:bg-fuchsia-500/20"
            >
              −
            </button>
            <button
              type="button"
              onClick={reset}
              aria-label="Repor mapa"
              title="Repor mapa"
              className="grid h-9 w-9 place-items-center rounded-lg border border-fuchsia-500/30 bg-vice-950/90 text-[10px] uppercase text-fuchsia-200 backdrop-blur transition hover:bg-fuchsia-500/20"
            >
              Reset
            </button>
          </div>

          {selected && (
            <div
              className="absolute left-3 top-14 z-30 w-[min(20rem,calc(100%-5rem))] rounded-xl border border-fuchsia-500/30 bg-vice-950/95 p-3 text-left shadow-[0_0_30px_rgba(217,70,239,0.2)] backdrop-blur"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start gap-2">
                <span
                  className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full"
                  style={{ backgroundColor: MAP_CATEGORIES[selected.category].color, color: '#0a0610' }}
                >
                  <CategoryIcon category={selected.category} className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{selected.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-fuchsia-300">
                    {MAP_CATEGORIES[selected.category].label} ·{' '}
                    {CONFIDENCE_LABELS[selected.confidence]}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-white/70">{selected.description}</p>
              <a
                href={selected.source.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-[11px] text-cyan-300 hover:underline"
              >
                Fonte: {selected.source.title} ↗
              </a>
            </div>
          )}

          <div className="absolute bottom-3 left-3 z-20 max-w-[calc(100%-6rem)] rounded-lg border border-white/10 bg-vice-950/90 p-2 backdrop-blur">
            <p className="mb-1 text-[9px] uppercase tracking-widest text-white/40">Legenda</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {CATEGORY_ORDER.map((category) => {
                const config = MAP_CATEGORIES[category]
                const isActive = activeCategories.has(category)
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    aria-pressed={isActive}
                    className={`flex items-center gap-1 text-[10px] transition ${
                      isActive ? 'text-white/80' : 'text-white/25 line-through'
                    }`}
                  >
                    <span style={{ color: config.color }}>
                      <CategoryIcon category={category} className="h-3.5 w-3.5" />
                    </span>
                    {config.label}
                  </button>
                )
              })}
            </div>
            <p className="mt-1 text-[9px] text-white/35">
              Tracejado = rumor · mapa comunitário, não oficial Rockstar Games
            </p>
          </div>

          <a
            href={MAP_SOURCE.url}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-3 right-3 z-20 rounded-md border border-white/10 bg-vice-950/90 px-2 py-1 text-[9px] text-cyan-300 backdrop-blur hover:underline"
          >
            GTADB · CC BY 4.0 ↗
          </a>
        </div>

        <aside className="flex max-h-64 w-full shrink-0 flex-col border-t border-fuchsia-500/15 bg-[#0d0716] lg:max-h-none lg:w-80 lg:border-l lg:border-t-0">
          <div className="border-b border-white/10 p-3">
            <label htmlFor="map-search" className="text-[10px] uppercase tracking-widest text-fuchsia-300">
              Procurar no mapa
            </label>
            <input
              id="map-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex.: Vice Regal, aeroporto, golf..."
              className="mt-2 w-full rounded-lg border border-fuchsia-500/25 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-fuchsia-400"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {!query.trim() ? (
              <div className="space-y-2 p-2 text-[11px] leading-relaxed text-white/45">
                <p>Arrasta para navegar. A roda do rato amplia o mapa, não a página.</p>
                <p>Clica num marcador para ver a descrição, a confiança e a fonte.</p>
                <p>Posições aproximadas e rumores estão identificados; nada é inventado.</p>
              </div>
            ) : results.length === 0 ? (
              <p className="p-3 text-xs text-white/50">Sem correspondência nesta pesquisa.</p>
            ) : (
              results.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => focus(location)}
                  className="mb-1 flex w-full items-center gap-2 rounded-lg border border-transparent px-2 py-2 text-left transition hover:border-fuchsia-500/20 hover:bg-fuchsia-500/10"
                >
                  <span style={{ color: MAP_CATEGORIES[location.category].color }}>
                    <CategoryIcon category={location.category} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs text-white/85">{location.name}</span>
                    <span className="block text-[9px] uppercase tracking-wider text-white/35">
                      {MAP_CATEGORIES[location.category].label} ·{' '}
                      {CONFIDENCE_LABELS[location.confidence]}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-white/10 p-3 text-[10px] leading-relaxed text-white/35">
            Mapa e dados: GTADB community, CC BY 4.0. Não é um mapa oficial da Rockstar Games.
          </div>
        </aside>
      </div>
    </div>
  )
}
