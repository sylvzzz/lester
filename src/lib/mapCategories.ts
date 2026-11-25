import type { MapCategory, MapConfidence } from '../../types.ts'

export const MAP_CATEGORIES: Record<
  MapCategory,
  { label: string; color: string; icon: string }
> = {
  landmark: { label: 'Landmarks', color: '#ff4fa3', icon: 'landmark' },
  shop: { label: 'Shops', color: '#a855f7', icon: 'shop' },
  vehicle: { label: 'Vehicles', color: '#45ddeb', icon: 'vehicle' },
  transport: { label: 'Transport', color: '#fbbf24', icon: 'transport' },
  leisure: { label: 'Leisure', color: '#34d399', icon: 'leisure' },
  mission: { label: 'Missions', color: '#f97316', icon: 'mission' },
  collectible: { label: 'Collectibles', color: '#f472b6', icon: 'collectible' },
}

export const CATEGORY_ORDER = Object.keys(MAP_CATEGORIES) as MapCategory[]

export const CONFIDENCE_LABELS: Record<MapConfidence, string> = {
  confirmed: 'Confirmed',
  approximate: 'Approximate',
  rumour: 'Rumour',
}

export const MAP_SOURCE = {
  title: 'GTADB community landmarks',
  url: 'https://github.com/rolux/gtadb.org',
}
