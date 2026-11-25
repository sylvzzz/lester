import type { MapCategory, MapConfidence, MapLocation, MapMarker } from '../types.ts'
import { MAP_LOCATIONS } from '../src/data/mapLocations.ts'

export interface MapPin {
  label: string
  aliases: string[]
  x: number
  y: number
  category: MapCategory
  confidence: MapConfidence
  description: string
}

export const MAP_SOURCE = {
  title: 'GTADB community landmarks',
  url: 'https://github.com/rolux/gtadb.org',
}

export const MAP_PINS: MapPin[] = [
  { label: 'Y Vice City sign', aliases: ['y vice city', 'y vice city sign', 'vice city sign'], x: 74.6, y: 45.1, category: 'landmark', confidence: 'confirmed', description: 'Letreiro Y Vice City em Washington Beach.' },
  { label: 'Vice Regal', aliases: ['vice regal'], x: 72.4, y: 41.4, category: 'landmark', confidence: 'confirmed', description: 'Hotel Vice Regal, em Washington Beach.' },
  { label: 'Ocean View Hotel', aliases: ['ocean view hotel'], x: 74.6, y: 48, category: 'landmark', confidence: 'confirmed', description: 'Ocean View Hotel, em Ocean Beach.' },
  { label: 'Sahara Arena', aliases: ['sahara arena'], x: 65.4, y: 48.6, category: 'leisure', confidence: 'confirmed', description: 'Sahara Arena, no centro de Vice City.' },
  { label: 'VCIA Control Tower', aliases: ['vcia control tower', 'airport control tower'], x: 57, y: 52.4, category: 'transport', confidence: 'confirmed', description: 'Torre de controlo do aeroporto internacional.' },
  { label: 'Gellhorn International Raceway', aliases: ['gellhorn raceway', 'gellhorn international raceway'], x: 39.3, y: 42.9, category: 'vehicle', confidence: 'confirmed', description: 'Circuito internacional de Port Gellhorn.' },
  { label: 'Grassrivers Visitor Center', aliases: ['grassrivers visitor center'], x: 55.8, y: 64.5, category: 'landmark', confidence: 'confirmed', description: 'Centro de visitantes de Grassrivers.' },
  { label: "Jason's House", aliases: ["jason's house", 'jason house'], x: 57.1, y: 66.9, category: 'landmark', confidence: 'confirmed', description: 'Casa associada a Jason, em Grassrivers.' },
  { label: 'Leaf Links Golf Club', aliases: ['leaf links golf club'], x: 69, y: 42.4, category: 'leisure', confidence: 'confirmed', description: 'Campo de golfe Leaf Links.' },
  { label: 'NINE1NINE', aliases: ['nine1nine', 'nine one nine'], x: 63.9, y: 48.6, category: 'shop', confidence: 'confirmed', description: 'NINE1NINE, em Downtown Vice City.' },
  { label: 'Break Inn (Downtown)', aliases: ['break inn downtown', 'break inn'], x: 64.7, y: 49, category: 'shop', confidence: 'confirmed', description: 'Break Inn, em Downtown Vice City.' },
  { label: 'Pegassi Residences South Tower', aliases: ['pegassi residences south tower'], x: 66.9, y: 53.3, category: 'landmark', confidence: 'confirmed', description: 'Torre sul das Pegassi Residences.' },
  { label: 'Bite House', aliases: ['bite house'], x: 45.3, y: 60.3, category: 'shop', confidence: 'confirmed', description: 'Bite House, em Watson Bay.' },
  { label: 'Sugar Mill, Allied Crystal', aliases: ['sugar mill', 'allied crystal'], x: 54.4, y: 39.8, category: 'landmark', confidence: 'confirmed', description: 'Antiga fábrica de açúcar Allied Crystal.' },
  { label: 'Vice Beach', aliases: ['vice beach'], x: 73.3, y: 46.7, category: 'landmark', confidence: 'approximate', description: 'Área de Vice Beach; posição aproximada a partir de vários pontos catalogados.' },
  { label: 'Downtown Vice City', aliases: ['downtown', 'downtown vice city'], x: 64, y: 50.3, category: 'landmark', confidence: 'approximate', description: 'Centro de Vice City; posição aproximada a partir de vários pontos catalogados.' },
  { label: 'Port Vice City', aliases: ['port vice city', 'port vice'], x: 69.6, y: 51.5, category: 'transport', confidence: 'approximate', description: 'Área portuária de Vice City; posição aproximada.' },
  { label: 'Tequesta Key', aliases: ['tequesta', 'tequesta key', 'tequesta retreat'], x: 65.8, y: 53.3, category: 'landmark', confidence: 'approximate', description: 'Tequesta Key; posição aproximada.' },
  { label: 'Vice City International Airport', aliases: ['airport', 'vice city international airport'], x: 57.3, y: 52.2, category: 'transport', confidence: 'approximate', description: 'Aeroporto Internacional de Vice City; posição aproximada.' },
  { label: 'Waning Sands', aliases: ['waning sands'], x: 66.7, y: 38.6, category: 'landmark', confidence: 'approximate', description: 'Waning Sands; posição aproximada.' },
  { label: 'Rockridge', aliases: ['rockridge'], x: 61.5, y: 47.4, category: 'landmark', confidence: 'approximate', description: 'Rockridge; posição aproximada.' },
  { label: 'Stockyard', aliases: ['stockyard'], x: 65.3, y: 44.5, category: 'landmark', confidence: 'approximate', description: 'Stockyard; posição aproximada.' },
  { label: 'Port Gellhorn', aliases: ['port gellhorn', 'gellhorn'], x: 39.9, y: 38.4, category: 'transport', confidence: 'approximate', description: 'Port Gellhorn; posição aproximada.' },
  { label: 'Ambrosia', aliases: ['ambrosia'], x: 55.3, y: 37.9, category: 'landmark', confidence: 'approximate', description: 'Ambrosia; posição aproximada.' },
  { label: 'Grassrivers', aliases: ['grassrivers'], x: 54.7, y: 64.1, category: 'leisure', confidence: 'approximate', description: 'Região de Grassrivers; posição aproximada.' },
  { label: 'Hamlet', aliases: ['hamlet'], x: 55.7, y: 59.8, category: 'landmark', confidence: 'approximate', description: 'Hamlet; posição aproximada.' },
  { label: 'Leonida Keys', aliases: ['leonida keys', 'the keys'], x: 52, y: 70, category: 'leisure', confidence: 'approximate', description: 'Leonida Keys; posição aproximada.' },
  { label: 'Key Lento', aliases: ['key lento'], x: 56.4, y: 68.1, category: 'landmark', confidence: 'approximate', description: 'Key Lento; posição aproximada.' },
  { label: 'Lake Leonida', aliases: ['lake leonida'], x: 58.6, y: 35.6, category: 'leisure', confidence: 'approximate', description: 'Lake Leonida; posição aproximada.' },
  { label: 'Leaf Links', aliases: ['leaf links'], x: 68.6, y: 42.6, category: 'leisure', confidence: 'approximate', description: 'Leaf Links; posição aproximada.' },
  { label: 'Watson Bay', aliases: ['watson bay'], x: 46.4, y: 60, category: 'landmark', confidence: 'approximate', description: 'Watson Bay; posição aproximada.' },
  { label: 'Vice-Dale County', aliases: ['vice-dale', 'vice dale'], x: 67.4, y: 48, category: 'landmark', confidence: 'approximate', description: 'Vice-Dale County; posição aproximada.' },
  { label: 'Mount Kalaga', aliases: ['mount kalaga', 'kalaga'], x: 52.9, y: 28.8, category: 'leisure', confidence: 'approximate', description: 'Mount Kalaga; posição aproximada a partir de pontos catalogados no monte.' },
  { label: 'Vice City', aliases: ['vice city', 'vicecity'], x: 62.5, y: 50.4, category: 'landmark', confidence: 'approximate', description: 'Vice City; posição aproximada do centro da cidade.' },
]

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function exactMapPin(target: string): MapPin | undefined {
  return MAP_PINS.find((pin) => pin.aliases.some((alias) => normalize(alias) === target))
}

export function findMapPin(name: string): MapPin | undefined {
  const target = normalize(name)
  const exact = exactMapPin(target)
  if (exact) return exact
  return MAP_PINS.find((pin) =>
    pin.aliases.some((alias) => normalize(alias).length > 4 && target.includes(normalize(alias))),
  )
}

export function toMapMarker(pin: MapPin): MapMarker {
  return {
    id: `lester-${pin.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: pin.label,
    x: pin.x,
    y: pin.y,
    category: pin.category,
    confidence: pin.confidence,
    description: pin.description,
    source: MAP_SOURCE,
  }
}

export function findMapLocation(name: string): MapPin | MapLocation | undefined {
  const target = normalize(name)
  if (target.length < 4) return undefined

  const exactLocation = MAP_LOCATIONS.find((location) => normalize(location.name) === target)
  if (exactLocation) return exactLocation

  const exactPin = exactMapPin(target)
  if (exactPin) return exactPin

  const fuzzyLocation = MAP_LOCATIONS.find((location) => {
    const candidate = normalize(location.name)
    return candidate.length > 8 && (candidate.includes(target) || target.includes(candidate))
  })
  return fuzzyLocation ?? findMapPin(name)
}

export function toMapMarkerFromLocation(location: MapLocation): MapMarker {
  return {
    ...location,
    description: `${location.name} — localização catalogada pela GTADB.`,
    source: MAP_SOURCE,
  }
}
