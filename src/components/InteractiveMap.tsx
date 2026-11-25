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
import {
  cropTileSize,
  isKnownTile,
  MAX_ZOOM,
  MIN_ZOOM,
  TILE_SIZE,
  tileBounds,
} from '../lib/mapTiles.ts'
import { CategoryIcon, LocationPinIcon } from './CategoryIcon.tsx'

type Props = {
  markers: MapMarker[]
  onClose: () => void
}

type Offset = { x: number; y: number }
type Viewport = { width: number; height: number }

const DEFAULT_ZOOM = 4
const FOCUS_ZOOM = 6

function asMarker(location: MapLocation): MapMarker {
  return {
    ...location,
    description: `${location.name} — localização catalogada pela GTADB.`,
    source: MAP_SOURCE,
  }
}

const TileLayer = memo(function TileLayer({
  zoom,
  offset,
  viewport,
}: {
  zoom: number
  offset: Offset
  viewport: Viewport
}) {
  if (!viewport.width || !viewport.height) return null

  const size = cropTileSize(zoom)
  const { maxX, maxY } = tileBounds(zoom)
  const left = size.width / 2 - offset.x - viewport.width / 2
  const top = size.height / 2 - offset.y - viewport.height / 2
  const x0 = Math.max(0, Math.floor(left / TILE_SIZE))
  const y0 = Math.max(0, Math.floor(top / TILE_SIZE))
  const x1 = Math.min(maxX, Math.floor((left + viewport.width) / TILE_SIZE))
  const y1 = Math.min(maxY, Math.floor((top + viewport.height) / TILE_SIZE))
  const tiles = []

  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      if (!isKnownTile(zoom, x, y)) continue
      tiles.push(
        <img
          key={`${zoom}-${y}-${x}`}
          src={`/api/tile/${zoom}/${y}/${x}`}
          alt=""
          aria-hidden="true"
          draggable={false}
          decoding="async"
          className="pointer-events-none absolute"
          style={{ left: x * TILE_SIZE, top: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}
          onError={(event) => {
            event.currentTarget.style.visibility = 'hidden'
          }}
        />,
      )
    }
  }

  return <>{tiles}</>
})

const MarkerLayer = memo(function MarkerLayer({
  locations,
  selectedId,
  primaryId,
  onSelect,
}: {
  locations: MapMarker[]
  selectedId?: string
  primaryId?: string
  onSelect: (location: MapMarker) => void
}) {
  return (
    <>
      {locations.map((location) => {
        const config = MAP_CATEGORIES[location.category]
        const isSelected = selectedId === location.id
        const isPrimary = primaryId === location.id

        if (isPrimary) {
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
              className="absolute z-30 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#ff3b5c] text-white ring-4 ring-[#ff3b5c]/30 shadow-[0_0_22px_rgba(255,59,92,0.9)]"
              style={{ left: `${location.x}%`, top: `${location.y}%` }}
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-[#ff3b5c]/40" />
              <LocationPinIcon className="relative h-5 w-5" />
            </button>
          )
        }

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
            className={`absolute z-10 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border transition hover:opacity-100 ${
              isSelected ? 'ring-2 ring-white' : 'border-white/30'
            } ${primaryId ? 'opacity-35' : ''}`}
            style={{
              left: `${location.x}%`,
              top: `${location.y}%`,
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
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 })
  const [viewport, setViewport] = useState<Viewport>({ width: 0, height: 0 })
  const [selected, setSelected] = useState<MapMarker | null>(null)
  const [query, setQuery] = useState('')
  const [activeCategories, setActiveCategories] = useState<Set<MapCategory>>(
    () => new Set(CATEGORY_ORDER),
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)
  const zoomRef = useRef(DEFAULT_ZOOM)
  const offsetRef = useRef<Offset>({ x: 0, y: 0 })
  const lastWheelRef = useRef(0)

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

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const update = () => {
      const { width, height } = container.getBoundingClientRect()
      setViewport({ width, height })
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const clampOffset = useCallback(
    (next: Offset, nextZoom: number): Offset => {
      if (!viewport.width || !viewport.height) return next
      const size = cropTileSize(nextZoom)
      const maxX = Math.max(0, (size.width - viewport.width) / 2) + 48
      const maxY = Math.max(0, (size.height - viewport.height) / 2) + 48
      return {
        x: Math.max(-maxX, Math.min(maxX, next.x)),
        y: Math.max(-maxY, Math.min(maxY, next.y)),
      }
    },
    [viewport],
  )

  const applyView = useCallback(
    (nextOffset: Offset, nextZoom: number) => {
      const boundedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom))
      const boundedOffset = clampOffset(nextOffset, boundedZoom)
      zoomRef.current = boundedZoom
      offsetRef.current = boundedOffset
      setZoom(boundedZoom)
      setOffset(boundedOffset)
    },
    [clampOffset],
  )

  const zoomAt = useCallback(
    (step: number, localX: number, localY: number) => {
      if (!viewport.width || !viewport.height) return
      const current = zoomRef.current
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current + step))
      if (next === current) return

      const size = cropTileSize(current)
      const nextSize = cropTileSize(next)
      const ratio = nextSize.width / size.width
      const cursorX = localX - viewport.width / 2
      const cursorY = localY - viewport.height / 2
      const mapX = cursorX - offsetRef.current.x + size.width / 2
      const mapY = cursorY - offsetRef.current.y + size.height / 2
      applyView(
        {
          x: cursorX - mapX * ratio + nextSize.width / 2,
          y: cursorY - mapY * ratio + nextSize.height / 2,
        },
        next,
      )
    },
    [applyView, viewport],
  )

  const zoomFromCenter = useCallback(
    (step: number) => zoomAt(step, viewport.width / 2, viewport.height / 2),
    [viewport, zoomAt],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const now = Date.now()
      if (now - lastWheelRef.current < 180) return
      lastWheelRef.current = now
      const rect = container.getBoundingClientRect()
      zoomAt(event.deltaY < 0 ? 1 : -1, event.clientX - rect.left, event.clientY - rect.top)
    }
    container.addEventListener('wheel', onWheel, { passive: false })
    return () => container.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  const focusOn = useCallback(
    (location: MapMarker, targetZoom = FOCUS_ZOOM, select = true) => {
      const size = cropTileSize(targetZoom)
      applyView(
        {
          x: size.width / 2 - (location.x / 100) * size.width,
          y: size.height / 2 - (location.y / 100) * size.height,
        },
        targetZoom,
      )
      if (select) setSelected(location)
    },
    [applyView],
  )

  const focus = useCallback(
    (location: MapMarker) => focusOn(location),
    [focusOn],
  )

  const reset = useCallback(() => {
    const primary = markers[0]
    if (primary) focusOn(primary, DEFAULT_ZOOM, false)
    else {
      applyView({ x: 0, y: 0 }, DEFAULT_ZOOM)
      setSelected(null)
    }
  }, [applyView, focusOn, markers])

  const initialFocusRef = useRef(false)
  useEffect(() => {
    if (initialFocusRef.current || !viewport.width || markers.length === 0) return
    initialFocusRef.current = true
    focusOn(markers[0])
  }, [focusOn, markers, viewport.width])

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
      zoomRef.current,
    )
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const wasDragging = dragRef.current !== null
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (wasDragging) applyView(offsetRef.current, zoomRef.current)
  }

  const size = cropTileSize(zoom)

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
            className="absolute left-1/2 top-1/2"
            style={{
              width: size.width,
              height: size.height,
              transform: `translate(-50%, -50%) translate3d(${offset.x}px, ${offset.y}px, 0)`,
              transformOrigin: 'center center',
              willChange: 'transform',
            }}
          >
            <img
              src="/gta6-map.jpg"
              alt=""
              aria-hidden="true"
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full object-fill"
            />

            <TileLayer zoom={zoom} offset={offset} viewport={viewport} />

            <MarkerLayer
              locations={visible}
              selectedId={selected?.id}
              primaryId={markers[0]?.id}
              onSelect={selectLocation}
            />
          </div>

          <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-lg border border-fuchsia-500/20 bg-vice-950/90 px-2.5 py-1.5 text-[10px] uppercase tracking-widest text-fuchsia-200 backdrop-blur">
            {visible.length} pontos · Z{zoom}/{MAX_ZOOM}
          </div>

          <div className="absolute right-3 top-3 z-20 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => zoomFromCenter(1)}
              aria-label="Aproximar"
              className="grid h-9 w-9 place-items-center rounded-lg border border-fuchsia-500/30 bg-vice-950/90 text-lg text-white backdrop-blur transition hover:bg-fuchsia-500/20"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => zoomFromCenter(-1)}
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
            {markers[0] && (
              <p className="mt-1 flex items-center gap-1 text-[9px] text-[#ff8da1]">
                <LocationPinIcon className="h-3 w-3" />
                Vermelho = local indicado pela Lester
              </p>
            )}
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
