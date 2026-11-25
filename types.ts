export type Role = 'user' | 'assistant'

export interface ChatMessage {
  role: Role
  content: string
}

export interface Source {
  number: number
  title: string
  url: string
  site: string
  snippet: string
}

export interface ChatImage {
  url: string
  caption: string
}

export type MapCategory = 'landmark' | 'shop' | 'vehicle' | 'transport' | 'leisure' | 'mission' | 'collectible'

export type MapConfidence = 'confirmed' | 'approximate' | 'rumour'

export interface MapLocation {
  id: string
  name: string
  x: number
  y: number
  category: MapCategory
  confidence: MapConfidence
}

export interface MapMarker extends MapLocation {
  description: string
  source: {
    title: string
    url: string
  }
}

export interface ChatMapPin {
  label: string
  x: number
  y: number
}

export interface ChatResponse {
  reply: string
  sources: Source[]
  images: ChatImage[]
  map?: ChatMapPin
  markers?: MapMarker[]
  spoilerWarning?: boolean
}
