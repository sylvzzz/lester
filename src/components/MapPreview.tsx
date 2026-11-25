import { lazy, Suspense, useState } from 'react'
import type { MapMarker } from '../../types.ts'
import { CONFIDENCE_LABELS, MAP_CATEGORIES } from '../lib/mapCategories.ts'
import { CategoryIcon, LocationPinIcon } from './CategoryIcon.tsx'

const InteractiveMap = lazy(() =>
  import('./InteractiveMap.tsx').then((module) => ({ default: module.InteractiveMap })),
)

type Props = {
  markers: MapMarker[]
}

const PREVIEW_ZOOM = 1.8

export function MapPreview({ markers }: Props) {
  const [open, setOpen] = useState(false)
  const primary = markers[0]
  const focusStyle = primary
    ? {
        transform: `translate(${Number((50 - primary.x).toFixed(2))}%, ${Number((50 - primary.y).toFixed(2))}%) scale(${PREVIEW_ZOOM})`,
        transformOrigin: `${primary.x}% ${primary.y}%`,
      }
    : undefined

  return (
    <>
      <div className="group relative mt-3 w-full max-w-[18rem] sm:max-w-[20rem]">
        <div className="absolute -inset-px rounded-[1.15rem] bg-gradient-to-br from-neon-pink/60 via-electric-purple/40 to-cyan-400/30 opacity-70 blur-[1px] transition duration-300 group-hover:opacity-100" />

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-vice-950/90 shadow-[0_0_25px_rgba(217,70,239,0.18)]">
          <div className="relative aspect-[3/4] w-full overflow-hidden">
            <div className="absolute inset-0" style={focusStyle}>
              <img
                src="/gta6-map.jpg"
                alt="Mapa in-game de Leonida"
                className="h-full w-full object-cover"
              />

              {markers.map((marker) => {
                const config = MAP_CATEGORIES[marker.category]
                const isPrimary = marker.id === primary?.id
                const markerTransform = `translate(-50%, -50%) scale(${primary ? 1 / PREVIEW_ZOOM : 1})`

                if (isPrimary) {
                  return (
                    <span
                      key={marker.id}
                      title={marker.name}
                      className="absolute z-20 grid h-9 w-9 place-items-center rounded-full bg-[#ff3b5c] text-white ring-4 ring-[#ff3b5c]/30 shadow-[0_0_18px_rgba(255,59,92,0.9)]"
                      style={{
                        left: `${marker.x}%`,
                        top: `${marker.y}%`,
                        transform: markerTransform,
                      }}
                    >
                      <span className="absolute inset-0 animate-ping rounded-full bg-[#ff3b5c]/40" />
                      <LocationPinIcon className="relative h-5 w-5" />
                    </span>
                  )
                }

                return (
                  <span
                    key={marker.id}
                    title={marker.name}
                    className="absolute grid h-6 w-6 place-items-center rounded-full border border-white/40 opacity-50"
                    style={{
                      left: `${marker.x}%`,
                      top: `${marker.y}%`,
                      transform: markerTransform,
                      backgroundColor: config.color,
                      color: '#0a0610',
                      borderStyle: marker.confidence === 'rumour' ? 'dashed' : 'solid',
                      boxShadow: `0 0 12px ${config.color}aa`,
                    }}
                  >
                    <CategoryIcon category={marker.category} className="h-3.5 w-3.5" />
                  </span>
                )
              })}
            </div>

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-vice-950 via-vice-950/5 to-fuchsia-500/10" />
            <div className="pointer-events-none absolute inset-2 rounded-xl border border-white/5" />

            <span className="absolute left-2 top-2 rounded-md border border-fuchsia-400/30 bg-vice-950/85 px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-fuchsia-200 backdrop-blur">
              Atlas // Leonida
            </span>

            <span className="absolute bottom-2 left-2 rounded-md border border-fuchsia-500/20 bg-vice-950/85 px-2 py-1 text-[9px] text-white/60 backdrop-blur">
              {markers.length} {markers.length === 1 ? 'marcador' : 'marcadores'} · GTADB
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-gradient-to-r from-vice-950/90 to-vice-900/70 p-2.5">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white">
                {primary ? primary.name : 'Mapa in-game de Leonida'}
              </p>
              <p className="truncate text-[10px] text-white/40">
                {primary ? CONFIDENCE_LABELS[primary.confidence] : 'Mapa comunitário'} · não oficial
                Rockstar
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="shrink-0 rounded-lg bg-gradient-to-r from-neon-pink/80 to-electric-purple/80 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-[0_0_12px_rgba(217,70,239,0.35)] transition hover:brightness-110"
            >
              Explorar
            </button>
          </div>
        </div>
      </div>

      {open && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 grid place-items-center bg-vice-950/95 text-sm text-fuchsia-200">
              A carregar mapa...
            </div>
          }
        >
          <InteractiveMap markers={markers} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
