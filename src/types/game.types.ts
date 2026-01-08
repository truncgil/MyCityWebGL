import { Vector3 } from 'three'

// ============================================
// Core Game Types
// ============================================

export type GameSpeed = 'paused' | 'normal' | 'fast' | 'ultra'

export type GameMode = 'build' | 'demolish' | 'zone' | 'road' | 'view'

export type OverlayType = 'none' | 'traffic' | 'pollution' | 'landValue' | 'crime' | 'happiness' | 'services'

export interface GameTime {
  day: number
  hour: number
  minute: number
  totalMinutes: number
  speed: GameSpeed
  isDaytime: boolean
}

export interface GameState {
  mode: GameMode
  selectedBuilding: string | null
  selectedZone: ZoneType | null
  hoveredTile: GridPosition | null
  overlay: OverlayType
  isPlacing: boolean
  rotation: number // 0, 90, 180, 270
}

// ============================================
// Grid & World Types
// ============================================

export interface GridPosition {
  x: number
  z: number
}

export interface WorldPosition {
  x: number
  y: number
  z: number
}

export interface TileData {
  id: string
  position: GridPosition
  type: TileType
  buildingId: string | null
  roadId: string | null
  zone: ZoneType | null
  elevation: number
  landValue: number
  pollution: number
  crime: number
  traffic: number
}

export type TileType = 'empty' | 'building' | 'road' | 'water' | 'park' | 'special'

// ============================================
// Zoning Types
// ============================================

export type ZoneType = 'residential' | 'commercial' | 'industrial'

export interface ZoneDemand {
  residential: number
  commercial: number
  industrial: number
}

export interface ZoneStats {
  type: ZoneType
  count: number
  developed: number
  capacity: number
  demand: number
}

// ============================================
// Camera Types
// ============================================

export interface CameraState {
  position: WorldPosition
  target: WorldPosition
  zoom: number
  rotation: number
  minZoom: number
  maxZoom: number
}

// ============================================
// Input Types
// ============================================

export interface InputState {
  mousePosition: { x: number; y: number }
  mouseWorldPosition: WorldPosition | null
  isMouseDown: boolean
  isDragging: boolean
  keys: Set<string>
}

export type InputAction =
  | 'pan_up'
  | 'pan_down'
  | 'pan_left'
  | 'pan_right'
  | 'zoom_in'
  | 'zoom_out'
  | 'rotate_left'
  | 'rotate_right'
  | 'place'
  | 'cancel'
  | 'demolish'
  | 'rotate_building'
  | 'save'
  | 'load'

// ============================================
// Simulation System Types
// ============================================

export interface ISimulationSystem {
  name: string
  priority: number
  enabled: boolean
  update(delta: number, gameTime: GameTime): void
  getState(): unknown
  reset(): void
  serialize(): unknown
  deserialize(data: unknown): void
}

// ============================================
// Save/Load Types
// ============================================

export interface SaveData {
  version: string
  timestamp: number
  cityName: string
  gameTime: GameTime
  tiles: TileData[]
  buildings: SerializedBuilding[]
  roads: SerializedRoad[]
  economy: SerializedEconomy
  population: SerializedPopulation
}

export interface SerializedBuilding {
  id: string
  type: string
  position: GridPosition
  rotation: number
  level: number
  occupancy: number
}

export interface SerializedRoad {
  id: string
  position: GridPosition
  connections: GridPosition[]
  type: string
}

export interface SerializedEconomy {
  balance: number
  income: number
  expenses: number
  taxRates: {
    residential: number
    commercial: number
    industrial: number
  }
}

export interface SerializedPopulation {
  total: number
  employed: number
  unemployed: number
  happiness: number
}

// ============================================
// Event Types
// ============================================

export type GameEventType =
  | 'building:placed'
  | 'building:removed'
  | 'road:placed'
  | 'road:removed'
  | 'zone:changed'
  | 'economy:updated'
  | 'population:changed'
  | 'time:changed'
  | 'game:saved'
  | 'game:loaded'
  | 'game:reset'

export interface GameEvent<T = unknown> {
  type: GameEventType
  payload: T
  timestamp: number
}

// ============================================
// UI Types
// ============================================

export interface TooltipData {
  title: string
  description?: string
  stats?: { label: string; value: string | number }[]
  position: { x: number; y: number }
}

export interface NotificationData {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
}
