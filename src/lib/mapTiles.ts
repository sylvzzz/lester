export const TILE_SIZE = 256
export const MIN_ZOOM = 0
export const MAX_ZOOM = 6

const GAME_ORIGIN = 16384
const CROP_GAME_WIDTH = 24576
const CROP_GAME_HEIGHT = 32768

const DAY_TILE_RANGES: Record<number, { x0: number; x1: number; y0: number; y1: number }> = {
  0: { x0: 0, x1: 2, y0: 0, y1: 3 },
  1: { x0: 1, x1: 5, y0: 1, y1: 6 },
  2: { x0: 2, x1: 10, y0: 2, y1: 12 },
  3: { x0: 4, x1: 20, y0: 4, y1: 25 },
  4: { x0: 8, x1: 41, y0: 8, y1: 51 },
  5: { x0: 17, x1: 83, y0: 17, y1: 103 },
  6: { x0: 34, x1: 167, y0: 34, y1: 206 },
}

export function cropTileSize(zoom: number) {
  const factor = 2 ** zoom
  return { width: 768 * factor, height: 1024 * factor }
}

export function tileBounds(zoom: number) {
  const size = cropTileSize(zoom)
  return {
    maxX: Math.ceil(size.width / TILE_SIZE) - 1,
    maxY: Math.ceil(size.height / TILE_SIZE) - 1,
  }
}

export function markerToTile(xPct: number, yPct: number, zoom: number) {
  const gameX = (xPct / 100) * CROP_GAME_WIDTH - GAME_ORIGIN
  const gameY = GAME_ORIGIN - (yPct / 100) * CROP_GAME_HEIGHT
  const pixelsPerGameUnit = 2 ** zoom / 32
  return {
    x: Math.floor(((gameX + GAME_ORIGIN) * pixelsPerGameUnit) / TILE_SIZE),
    y: Math.floor(((GAME_ORIGIN - gameY) * pixelsPerGameUnit) / TILE_SIZE),
  }
}

export function isKnownTile(zoom: number, x: number, y: number) {
  const range = DAY_TILE_RANGES[zoom]
  return !!range && x >= range.x0 && x <= range.x1 && y >= range.y0 && y <= range.y1
}
