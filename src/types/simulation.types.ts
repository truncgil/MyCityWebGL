import { GridPosition, ZoneType } from './game.types'

// ============================================
// Economy Types
// ============================================

export interface EconomyState {
  balance: number
  income: number
  expenses: number
  
  taxRates: TaxRates
  taxIncome: TaxIncome
  
  serviceExpenses: ServiceExpenses
  maintenanceExpenses: number
  
  history: EconomyHistoryEntry[]
}

export interface TaxRates {
  residential: number // 0-20%
  commercial: number
  industrial: number
}

export interface TaxIncome {
  residential: number
  commercial: number
  industrial: number
  total: number
}

export interface ServiceExpenses {
  police: number
  fire: number
  health: number
  education: number
  power: number
  water: number
  waste: number
  total: number
}

export interface EconomyHistoryEntry {
  day: number
  balance: number
  income: number
  expenses: number
}

// ============================================
// Population Types
// ============================================

export interface PopulationState {
  total: number
  residential: number
  workers: number
  
  employed: number
  unemployed: number
  employmentRate: number
  
  happiness: number
  health: number
  education: number
  
  growth: number
  births: number
  deaths: number
  migration: number
  
  demographics: Demographics
}

export interface Demographics {
  children: number  // 0-18
  adults: number    // 18-65
  elderly: number   // 65+
}

// ============================================
// Traffic Types
// ============================================

export interface TrafficState {
  vehicles: Vehicle[]
  congestionMap: Map<string, number>
  averageCongestion: number
  totalTrips: number
}

export interface Vehicle {
  id: string
  type: VehicleType
  position: WorldPosition3D
  targetPosition: WorldPosition3D
  path: GridPosition[]
  currentPathIndex: number
  speed: number
  state: VehicleState
}

export type VehicleType = 'car' | 'truck' | 'bus' | 'emergency'

export type VehicleState = 'moving' | 'stopped' | 'waiting' | 'parked'

export interface WorldPosition3D {
  x: number
  y: number
  z: number
}

// ============================================
// Zoning Types
// ============================================

export interface ZoningState {
  zones: Map<string, ZoneData>
  demand: ZoneDemand
  development: ZoneDevelopment
}

export interface ZoneData {
  position: GridPosition
  type: ZoneType
  developmentLevel: number
  isOccupied: boolean
  buildingId: string | null
}

export interface ZoneDemand {
  residential: number // -100 to 100
  commercial: number
  industrial: number
}

export interface ZoneDevelopment {
  residential: { total: number; developed: number }
  commercial: { total: number; developed: number }
  industrial: { total: number; developed: number }
}

// ============================================
// Services Types
// ============================================

export interface ServicesState {
  power: PowerServiceState
  water: WaterServiceState
  police: CoverageServiceState
  fire: CoverageServiceState
  health: CoverageServiceState
  education: CoverageServiceState
}

export interface PowerServiceState {
  production: number
  consumption: number
  surplus: number
  coverage: number // 0-100%
  buildings: string[] // building ids
}

export interface WaterServiceState {
  production: number
  consumption: number
  surplus: number
  coverage: number
  buildings: string[]
}

export interface CoverageServiceState {
  coverage: number
  buildings: string[]
  coveredTiles: Set<string>
}

// ============================================
// Time Types
// ============================================

export interface TimeState {
  day: number
  hour: number
  minute: number
  totalMinutes: number
  
  speed: TimeSpeed
  isPaused: boolean
  
  dayOfWeek: DayOfWeek
  season: Season
  
  sunPosition: number // 0-1, for day/night cycle
  isDaytime: boolean
}

export type TimeSpeed = 0 | 1 | 2 | 3 // paused, normal, fast, ultra

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

// ============================================
// Statistics Types
// ============================================

export interface CityStatistics {
  // General
  cityAge: number // days
  landArea: number // tiles
  developedArea: number
  
  // Ratings
  overallRating: number // 0-100
  safetyRating: number
  healthRating: number
  educationRating: number
  environmentRating: number
  trafficRating: number
  
  // Environment
  pollution: number
  greenSpace: number
  
  // Records
  peakPopulation: number
  peakBalance: number
}

// ============================================
// Road Types
// ============================================

export interface Road {
  id: string
  position: GridPosition
  type: RoadType
  connections: RoadConnection[]
  trafficLoad: number
}

export type RoadType = 'road' | 'highway' | 'bridge' | 'tunnel'

export interface RoadConnection {
  direction: Direction
  connectedTo: string | null // road id
}

export type Direction = 'north' | 'south' | 'east' | 'west'

// ============================================
// Pathfinding Types
// ============================================

export interface PathNode {
  position: GridPosition
  g: number // cost from start
  h: number // heuristic to end
  f: number // g + h
  parent: PathNode | null
}

export interface PathfindingResult {
  path: GridPosition[]
  cost: number
  found: boolean
}
