import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  TileData,
  GridPosition,
  ZoneType,
  SaveData,
} from '@/types/game.types'
import { Building, BuildingDefinition, DEFAULT_BUILDINGS } from '@/types/building.types'
import { Road, EconomyState, PopulationState, ZoneDemand } from '@/types/simulation.types'
import {
  GRID_SIZE,
  STORAGE_KEYS,
  STARTING_BALANCE,
  DEFAULT_TAX_RATE,
  GAME_VERSION,
  SAVE_VERSION,
} from '@/lib/constants'
import { generateId, gridPositionToKey, keyToGridPosition } from '@/lib/utils'

interface CityStore {
  // City Info
  cityName: string
  
  // Grid Data
  tiles: Map<string, TileData>
  
  // Entities
  buildings: Map<string, Building>
  roads: Map<string, Road>
  
  // Building Catalog
  buildingCatalog: BuildingDefinition[]
  
  // Economy
  economy: EconomyState
  
  // Population
  population: PopulationState
  
  // Zone Demand
  zoneDemand: ZoneDemand
  
  // Actions - Tiles
  getTile: (position: GridPosition) => TileData | undefined
  setTile: (position: GridPosition, data: Partial<TileData>) => void
  initializeGrid: () => void
  
  // Actions - Buildings
  placeBuilding: (definitionId: string, position: GridPosition, rotation: number) => Building | null
  removeBuilding: (buildingId: string) => void
  getBuildingAt: (position: GridPosition) => Building | undefined
  getBuildingDefinition: (definitionId: string) => BuildingDefinition | undefined
  
  // Actions - Roads
  placeRoad: (position: GridPosition) => Road | null
  removeRoad: (roadId: string) => void
  getRoadAt: (position: GridPosition) => Road | undefined
  
  // Actions - Zones
  setZone: (position: GridPosition, zone: ZoneType | null) => void
  getZoneAt: (position: GridPosition) => ZoneType | null
  
  // Actions - Economy
  updateBalance: (amount: number) => void
  setTaxRate: (zone: ZoneType, rate: number) => void
  
  // Actions - Population
  updatePopulation: (delta: number) => void
  
  // Actions - Save/Load
  save: () => SaveData
  load: (data: SaveData) => void
  reset: () => void
  
  // Getters
  getTotalBuildings: () => number
  getTotalRoads: () => number
  getTotalPopulation: () => number
}

const createInitialTile = (x: number, z: number): TileData => ({
  id: gridPositionToKey({ x, z }),
  position: { x, z },
  type: 'empty',
  buildingId: null,
  roadId: null,
  zone: null,
  elevation: 0,
  landValue: 50,
  pollution: 0,
  crime: 0,
  traffic: 0,
})

const initialEconomy: EconomyState = {
  balance: STARTING_BALANCE,
  income: 0,
  expenses: 0,
  taxRates: {
    residential: DEFAULT_TAX_RATE,
    commercial: DEFAULT_TAX_RATE,
    industrial: DEFAULT_TAX_RATE,
  },
  taxIncome: {
    residential: 0,
    commercial: 0,
    industrial: 0,
    total: 0,
  },
  serviceExpenses: {
    police: 0,
    fire: 0,
    health: 0,
    education: 0,
    power: 0,
    water: 0,
    waste: 0,
    total: 0,
  },
  maintenanceExpenses: 0,
  history: [],
}

const initialPopulation: PopulationState = {
  total: 0,
  residential: 0,
  workers: 0,
  employed: 0,
  unemployed: 0,
  employmentRate: 0,
  happiness: 50,
  health: 70,
  education: 50,
  growth: 0,
  births: 0,
  deaths: 0,
  migration: 0,
  demographics: {
    children: 0,
    adults: 0,
    elderly: 0,
  },
}

const initialZoneDemand: ZoneDemand = {
  residential: 50,
  commercial: 30,
  industrial: 20,
}

// Clear old localStorage on load to prevent hydration errors
if (typeof window !== 'undefined') {
  const storageVersion = localStorage.getItem('mycity_version')
  if (storageVersion !== '2') {
    localStorage.removeItem('mycity_save')
    localStorage.removeItem('mycity_settings')
    localStorage.setItem('mycity_version', '2')
  }
}

export const useCityStore = create<CityStore>()(
  persist(
    (set, get) => ({
      // Initial State
      cityName: 'Yeni Şehir',
      tiles: new Map(),
      buildings: new Map(),
      roads: new Map(),
      buildingCatalog: DEFAULT_BUILDINGS,
      economy: initialEconomy,
      population: initialPopulation,
      zoneDemand: initialZoneDemand,
      
      // Tile Actions
      getTile: (position) => {
        const key = gridPositionToKey(position)
        return get().tiles.get(key)
      },
      
      setTile: (position, data) => {
        const key = gridPositionToKey(position)
        const tiles = new Map(get().tiles)
        const existing = tiles.get(key) || createInitialTile(position.x, position.z)
        tiles.set(key, { ...existing, ...data })
        set({ tiles })
      },
      
      initializeGrid: () => {
        const tiles = new Map<string, TileData>()
        for (let x = 0; x < GRID_SIZE; x++) {
          for (let z = 0; z < GRID_SIZE; z++) {
            const key = gridPositionToKey({ x, z })
            tiles.set(key, createInitialTile(x, z))
          }
        }
        set({ tiles })
      },
      
      // Building Actions
      placeBuilding: (definitionId, position, rotation) => {
        const state = get()
        const definition = state.buildingCatalog.find(b => b.id === definitionId)
        if (!definition) return null
        
        // Check if we can afford it
        if (state.economy.balance < definition.cost) return null
        
        // Check if tiles are available
        for (let dx = 0; dx < definition.size.width; dx++) {
          for (let dz = 0; dz < definition.size.depth; dz++) {
            const checkPos = { x: position.x + dx, z: position.z + dz }
            const tile = state.getTile(checkPos)
            if (!tile || tile.buildingId || tile.roadId) return null
          }
        }
        
        // Create building
        const building: Building = {
          id: generateId(),
          definitionId,
          position,
          rotation,
          level: 1,
          occupancy: 0,
          condition: 100,
          isActive: true,
          isPowered: false,
          hasWater: false,
          createdAt: Date.now(),
          lastUpdate: Date.now(),
        }
        
        // Update state
        const buildings = new Map(state.buildings)
        buildings.set(building.id, building)
        
        const tiles = new Map(state.tiles)
        for (let dx = 0; dx < definition.size.width; dx++) {
          for (let dz = 0; dz < definition.size.depth; dz++) {
            const tilePos = { x: position.x + dx, z: position.z + dz }
            const key = gridPositionToKey(tilePos)
            const tile = tiles.get(key)
            if (tile) {
              tiles.set(key, { ...tile, type: 'building', buildingId: building.id })
            }
          }
        }
        
        set({
          buildings,
          tiles,
          economy: {
            ...state.economy,
            balance: state.economy.balance - definition.cost,
          },
        })
        
        return building
      },
      
      removeBuilding: (buildingId) => {
        const state = get()
        const building = state.buildings.get(buildingId)
        if (!building) return
        
        const definition = state.buildingCatalog.find(b => b.id === building.definitionId)
        if (!definition) return
        
        // Update buildings map
        const buildings = new Map(state.buildings)
        buildings.delete(buildingId)
        
        // Update tiles
        const tiles = new Map(state.tiles)
        for (let dx = 0; dx < definition.size.width; dx++) {
          for (let dz = 0; dz < definition.size.depth; dz++) {
            const tilePos = { x: building.position.x + dx, z: building.position.z + dz }
            const key = gridPositionToKey(tilePos)
            const tile = tiles.get(key)
            if (tile) {
              tiles.set(key, { ...tile, type: 'empty', buildingId: null })
            }
          }
        }
        
        set({ buildings, tiles })
      },
      
      getBuildingAt: (position) => {
        const tile = get().getTile(position)
        if (!tile?.buildingId) return undefined
        return get().buildings.get(tile.buildingId)
      },
      
      getBuildingDefinition: (definitionId) => {
        return get().buildingCatalog.find(b => b.id === definitionId)
      },
      
      // Road Actions
      placeRoad: (position) => {
        const state = get()
        const tile = state.getTile(position)
        if (!tile || tile.buildingId || tile.roadId) return null
        
        const roadCost = 10
        if (state.economy.balance < roadCost) return null
        
        const road: Road = {
          id: generateId(),
          position,
          type: 'road',
          connections: [],
          trafficLoad: 0,
        }
        
        // Update state
        const roads = new Map(state.roads)
        roads.set(road.id, road)
        
        const tiles = new Map(state.tiles)
        const key = gridPositionToKey(position)
        tiles.set(key, { ...tile, type: 'road', roadId: road.id })
        
        set({
          roads,
          tiles,
          economy: {
            ...state.economy,
            balance: state.economy.balance - roadCost,
          },
        })
        
        return road
      },
      
      removeRoad: (roadId) => {
        const state = get()
        const road = state.roads.get(roadId)
        if (!road) return
        
        const roads = new Map(state.roads)
        roads.delete(roadId)
        
        const tiles = new Map(state.tiles)
        const key = gridPositionToKey(road.position)
        const tile = tiles.get(key)
        if (tile) {
          tiles.set(key, { ...tile, type: 'empty', roadId: null })
        }
        
        set({ roads, tiles })
      },
      
      getRoadAt: (position) => {
        const tile = get().getTile(position)
        if (!tile?.roadId) return undefined
        return get().roads.get(tile.roadId)
      },
      
      // Zone Actions
      setZone: (position, zone) => {
        const state = get()
        const tile = state.getTile(position)
        if (!tile || tile.buildingId || tile.roadId) return
        
        const tiles = new Map(state.tiles)
        const key = gridPositionToKey(position)
        tiles.set(key, { ...tile, zone })
        
        set({ tiles })
      },
      
      getZoneAt: (position) => {
        const tile = get().getTile(position)
        return tile?.zone || null
      },
      
      // Economy Actions
      updateBalance: (amount) => {
        set((state) => ({
          economy: {
            ...state.economy,
            balance: state.economy.balance + amount,
          },
        }))
      },
      
      setTaxRate: (zone, rate) => {
        set((state) => ({
          economy: {
            ...state.economy,
            taxRates: {
              ...state.economy.taxRates,
              [zone]: rate,
            },
          },
        }))
      },
      
      // Population Actions
      updatePopulation: (delta) => {
        set((state) => ({
          population: {
            ...state.population,
            total: Math.max(0, state.population.total + delta),
          },
        }))
      },
      
      // Save/Load
      save: () => {
        const state = get()
        
        const saveData: SaveData = {
          version: SAVE_VERSION,
          timestamp: Date.now(),
          cityName: state.cityName,
          gameTime: { day: 1, hour: 8, minute: 0, totalMinutes: 0, speed: 'normal', isDaytime: true },
          tiles: Array.from(state.tiles.values()),
          buildings: Array.from(state.buildings.values()).map(b => ({
            id: b.id,
            type: b.definitionId,
            position: b.position,
            rotation: b.rotation,
            level: b.level,
            occupancy: b.occupancy,
          })),
          roads: Array.from(state.roads.values()).map(r => ({
            id: r.id,
            position: r.position,
            connections: r.connections.map(c => c.connectedTo ? keyToGridPosition(c.connectedTo) : r.position),
            type: r.type,
          })),
          economy: {
            balance: state.economy.balance,
            income: state.economy.income,
            expenses: state.economy.expenses,
            taxRates: state.economy.taxRates,
          },
          population: {
            total: state.population.total,
            employed: state.population.employed,
            unemployed: state.population.unemployed,
            happiness: state.population.happiness,
          },
        }
        
        localStorage.setItem(STORAGE_KEYS.SAVE_DATA, JSON.stringify(saveData))
        return saveData
      },
      
      load: (data) => {
        const tiles = new Map<string, TileData>()
        data.tiles.forEach(tile => {
          tiles.set(gridPositionToKey(tile.position), tile)
        })
        
        const buildings = new Map<string, Building>()
        data.buildings.forEach(b => {
          buildings.set(b.id, {
            id: b.id,
            definitionId: b.type,
            position: b.position,
            rotation: b.rotation,
            level: b.level,
            occupancy: b.occupancy,
            condition: 100,
            isActive: true,
            isPowered: false,
            hasWater: false,
            createdAt: Date.now(),
            lastUpdate: Date.now(),
          })
        })
        
        const roads = new Map<string, Road>()
        data.roads.forEach(r => {
          roads.set(r.id, {
            id: r.id,
            position: r.position,
            type: r.type as 'road',
            connections: [],
            trafficLoad: 0,
          })
        })
        
        set({
          cityName: data.cityName,
          tiles,
          buildings,
          roads,
          economy: {
            ...initialEconomy,
            balance: data.economy.balance,
            income: data.economy.income,
            expenses: data.economy.expenses,
            taxRates: data.economy.taxRates,
          },
          population: {
            ...initialPopulation,
            total: data.population.total,
            employed: data.population.employed,
            unemployed: data.population.unemployed,
            happiness: data.population.happiness,
          },
        })
      },
      
      reset: () => {
        const tiles = new Map<string, TileData>()
        for (let x = 0; x < GRID_SIZE; x++) {
          for (let z = 0; z < GRID_SIZE; z++) {
            const key = gridPositionToKey({ x, z })
            tiles.set(key, createInitialTile(x, z))
          }
        }
        
        set({
          cityName: 'Yeni Şehir',
          tiles,
          buildings: new Map(),
          roads: new Map(),
          economy: initialEconomy,
          population: initialPopulation,
          zoneDemand: initialZoneDemand,
        })
      },
      
      // Getters
      getTotalBuildings: () => get().buildings.size,
      getTotalRoads: () => get().roads.size,
      getTotalPopulation: () => get().population.total,
    }),
    {
      name: STORAGE_KEYS.SAVE_DATA,
      partialize: (state) => ({
        cityName: state.cityName,
        economy: state.economy,
        population: state.population,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          try {
            const parsed = JSON.parse(str)
            
            // Force reset building catalog from defaults
            if (parsed.state) {
              parsed.state.buildingCatalog = DEFAULT_BUILDINGS
            }
            
            return {
              state: {
                ...parsed.state,
                tiles: new Map(),
                buildings: new Map(),
                roads: new Map(),
                // Always overwrite catalog
                buildingCatalog: DEFAULT_BUILDINGS,
              },
            }
          } catch {
            return null
          }
        },
        setItem: (name, value) => {
          // Never save buildingCatalog
          const { buildingCatalog, ...rest } = value.state || {}
          localStorage.setItem(name, JSON.stringify({ ...value, state: rest }))
        },
        removeItem: (name) => {
          localStorage.removeItem(name)
        },
      },
    }
  )
)
