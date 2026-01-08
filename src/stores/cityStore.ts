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
  
  // Actions - Simulation
  calculateUtilities: () => void
  growZones: () => void
  simulateCity: () => void
  placeBuildingFree: (definitionId: string, position: GridPosition) => void

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
        
        // Calculate rotation to face nearest road (for residential/commercial/industrial)
        let finalRotation = rotation
        const shouldFaceRoad = ['residential', 'commercial', 'industrial'].includes(definition.category)
        
        if (shouldFaceRoad && state.roads.size > 0) {
          const buildingCenterX = position.x + definition.size.width / 2
          const buildingCenterZ = position.z + definition.size.depth / 2
          
          // Find nearest road
          let nearestRoad: { x: number; z: number } | null = null
          let minDistance = Infinity
          
          for (const road of state.roads.values()) {
            const dx = road.position.x - buildingCenterX
            const dz = road.position.z - buildingCenterZ
            const distance = Math.sqrt(dx * dx + dz * dz)
            
            if (distance < minDistance) {
              minDistance = distance
              nearestRoad = road.position
            }
          }
          
          // Calculate rotation to face road
          if (nearestRoad && minDistance < 10) {
            const dx = nearestRoad.x - buildingCenterX
            const dz = nearestRoad.z - buildingCenterZ
            
            // Determine which direction the road is (N, S, E, W)
            if (Math.abs(dx) > Math.abs(dz)) {
              // Road is to the East or West
              finalRotation = dx > 0 ? 90 : 270
            } else {
              // Road is to the North or South
              finalRotation = dz > 0 ? 180 : 0
            }
          }
        }
        
        // Create building
        const building: Building = {
          id: generateId(),
          definitionId,
          position,
          rotation: finalRotation,
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
        
        // Immediately recalculate utilities when a building is placed
        setTimeout(() => get().calculateUtilities(), 0)
        
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
        
        // Recalculate utilities when a building is removed
        setTimeout(() => get().calculateUtilities(), 0)
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
        
        const roadId = generateId()
        
        // Helper to get neighbor road
        const getNeighborRoadId = (x: number, z: number) => {
          const t = state.getTile({ x, z })
          return t?.roadId
        }

        // Check neighbors
        const neighbors = {
          north: getNeighborRoadId(position.x, position.z - 1),
          south: getNeighborRoadId(position.x, position.z + 1),
          east: getNeighborRoadId(position.x + 1, position.z),
          west: getNeighborRoadId(position.x - 1, position.z),
        }
        
        const newConnections: { connectedTo: string }[] = []
        const roadsToUpdate = new Map<string, Road>()
        const roads = new Map(state.roads)

        // Process neighbors
        Object.entries(neighbors).forEach(([dir, neighborId]) => {
          if (neighborId) {
            const neighborRoad = roads.get(neighborId)
            if (neighborRoad) {
              // Add neighbor to new road's connections
              const neighborKey = gridPositionToKey(neighborRoad.position)
              newConnections.push({ connectedTo: neighborKey })

              // Add new road to neighbor's connections
              const newRoadKey = gridPositionToKey(position)
              if (!neighborRoad.connections.some(c => c.connectedTo === newRoadKey)) {
                 // Clone neighbor to update
                 const updatedNeighbor = {
                   ...neighborRoad,
                   connections: [...neighborRoad.connections, { connectedTo: newRoadKey }]
                 }
                 roads.set(neighborId, updatedNeighbor)
                 roadsToUpdate.set(neighborId, updatedNeighbor)
              }
            }
          }
        })

        const road: Road = {
          id: roadId,
          position,
          type: 'road',
          connections: newConnections,
          trafficLoad: 0,
        }
        
        // Update state
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
        
        // Remove connections from neighbors
        road.connections.forEach(conn => {
          if (conn.connectedTo) {
             const neighborPos = keyToGridPosition(conn.connectedTo)
             const neighborTile = state.getTile(neighborPos)
             if (neighborTile?.roadId) {
               const neighborRoad = roads.get(neighborTile.roadId)
               if (neighborRoad) {
                 const roadKey = gridPositionToKey(road.position)
                 const updatedNeighbor = {
                   ...neighborRoad,
                   connections: neighborRoad.connections.filter(c => c.connectedTo !== roadKey)
                 }
                 roads.set(neighborTile.roadId, updatedNeighbor)
               }
             }
          }
        })

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
      
      // Actions - Simulation
      calculateUtilities: () => {
        const state = get()
        const buildings = new Map(state.buildings)
        const powerSources: Building[] = []
        const waterSources: Building[] = []
        
        // Find sources
        buildings.forEach(b => {
           const def = state.getBuildingDefinition(b.definitionId)
           if (def?.serviceType === 'power') powerSources.push(b)
           if (def?.serviceType === 'water') waterSources.push(b)
        })
        
        // Helper to check radius
        const isInRadius = (pos1: GridPosition, pos2: GridPosition, radius: number) => {
          const dx = pos1.x - pos2.x
          const dz = pos1.z - pos2.z
          return Math.sqrt(dx*dx + dz*dz) <= radius
        }
        
        // Reset all statuses
        buildings.forEach(b => {
          b.isPowered = false
          b.hasWater = false
        })
        
        // Update Power
        powerSources.forEach(source => {
           const def = state.getBuildingDefinition(source.definitionId)
           const radius = def?.serviceRadius || 0
           if (source.isActive) {
             source.isPowered = true // Source powers itself
             buildings.forEach(target => {
               if (isInRadius(source.position, target.position, radius)) {
                 target.isPowered = true
               }
             })
           }
        })
        
        // Update Water
        waterSources.forEach(source => {
           const def = state.getBuildingDefinition(source.definitionId)
           const radius = def?.serviceRadius || 0
           if (source.isActive && source.isPowered) { // Water pump needs power!
             source.hasWater = true // Source has water
             buildings.forEach(target => {
               if (isInRadius(source.position, target.position, radius)) {
                 target.hasWater = true
               }
             })
           }
        })
        
        // Update tiles power/water status for zoning logic
        // We need to know if a TILE is powered to allow construction
        // Let's iterate all tiles with zones
        const tiles = new Map(state.tiles)
        let tilesChanged = false
        
        tiles.forEach(tile => {
          let isTilePowered = false
          let isTileWatered = false
          
          // Check power
          for (const source of powerSources) {
             const def = state.getBuildingDefinition(source.definitionId)
             if (source.isActive && isInRadius(source.position, tile.position, def?.serviceRadius || 0)) {
               isTilePowered = true
               break
             }
          }
          
          // Check water
          for (const source of waterSources) {
             const def = state.getBuildingDefinition(source.definitionId)
             if (source.isActive && source.isPowered && isInRadius(source.position, tile.position, def?.serviceRadius || 0)) {
               isTileWatered = true
               break
             }
          }
          
          // We don't have isPowered on TileData interface yet, but we can infer it during construction check
          // Or we can add it to TileData. For now, let's just save it in the building check logic.
          // Actually, let's just update buildings map since that's what we save.
          // For Zoning, we will do the check dynamically in growZones.
        })
        
        set({ buildings })
      },

      growZones: () => {
        const state = get()
        const { tiles, buildingCatalog, economy } = state
        
        // 1. Find valid empty zoned tiles
        const validTiles: TileData[] = []
        tiles.forEach(tile => {
          if (tile.zone && !tile.buildingId && !tile.roadId) {
            validTiles.push(tile)
          }
        })
        
        if (validTiles.length === 0) return
        
        // 2. Shuffle to randomize growth
        const shuffled = validTiles.sort(() => 0.5 - Math.random())
        
        // 3. Try to build on a few tiles (limit growth rate)
        let builtCount = 0
        const limit = 3 // Max 3 buildings per tick
        
        // Recalculate utilities locally to check for new constructions
        // Actually we should rely on the last calculateUtilities call, 
        // but we need to check if the EMPTY TILE is in range.
        const buildings = state.buildings
        const powerSources: Building[] = []
        const waterSources: Building[] = []
        buildings.forEach(b => {
           const def = state.getBuildingDefinition(b.definitionId)
           if (def?.serviceType === 'power' && b.isActive) powerSources.push(b)
           if (def?.serviceType === 'water' && b.isActive && b.isPowered) waterSources.push(b)
        })
        
        const isInRange = (pos: GridPosition, sources: Building[]) => {
          return sources.some(source => {
            const def = state.getBuildingDefinition(source.definitionId)
            const dx = pos.x - source.position.x
            const dz = pos.z - source.position.z
            return Math.sqrt(dx*dx + dz*dz) <= (def?.serviceRadius || 0)
          })
        }

        for (const tile of shuffled) {
          if (builtCount >= limit) break
          
          // CHECK REQUIREMENTS: Power & Water
          const hasPower = isInRange(tile.position, powerSources)
          const hasWater = isInRange(tile.position, waterSources)
          
          if (!hasPower || !hasWater) continue // Skip if no utilities
          
          // Find suitable building
          const candidates = buildingCatalog.filter(b => 
            b.zone === tile.zone && 
            b.cost <= economy.balance // Should zones cost money? usually private capital.
            // Let's assume zones build for free for the city, but generate tax
          )
          
          if (candidates.length > 0) {
             // Pick random candidate (weighted by level/requirements could be better)
             const buildingDef = candidates[Math.floor(Math.random() * candidates.length)]
             
             // Place it (bypass cost check for auto-growth? No, let's use placeBuilding but mock free cost?
             // Actually placeBuilding deducts money. We should probably have a separate spawnBuilding function
             // or just let it be free. Let's manually spawn to avoid cost deduction for private buildings.
             
             // ... Or better, standard city builders: Zoning is "private investment", doesn't cost City money.
             // We need a spawn function that doesn't deduct balance.
             
             const building: Building = {
                id: generateId(),
                definitionId: buildingDef.id,
                position: tile.position,
                rotation: 0,
                level: 1,
                occupancy: 0,
                condition: 100,
                isActive: true,
                isPowered: true,
                hasWater: true,
                createdAt: Date.now(),
                lastUpdate: Date.now(),
             }
             
             // Update state directly (dirty but fast)
             // We need to use store set method properly
             // Let's define a "spawnBuilding" action to handle this clean up later.
             // For now, call placeBuilding but refund the cost? Hacky.
             // Let's just create the building object here and batch update at end.
             
             state.placeBuildingFree(buildingDef.id, tile.position)
             builtCount++
          }
        }
      },

      placeBuildingFree: (definitionId, position) => {
        const state = get()
        const definition = state.buildingCatalog.find(b => b.id === definitionId)
        if (!definition) return
        
        const building: Building = {
          id: generateId(),
          definitionId,
          position,
          rotation: 0,
          level: 1,
          occupancy: 0,
          condition: 100,
          isActive: true,
          isPowered: false, // Will be updated next utility tick
          hasWater: false,
          createdAt: Date.now(),
          lastUpdate: Date.now(),
        }
        
        const buildings = new Map(state.buildings)
        buildings.set(building.id, building)
        
        const tiles = new Map(state.tiles)
        const key = gridPositionToKey(position)
        const tile = tiles.get(key)
        if (tile) {
           tiles.set(key, { ...tile, type: 'building', buildingId: building.id })
        }
        
        set({ buildings, tiles })
      },

      simulateCity: () => {
         get().calculateUtilities()
         get().growZones()
         // Future: calculate income, expenses, population growth here
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
        zoneDemand: state.zoneDemand,
        // Convert Maps to arrays for JSON serialization
        tilesArray: Array.from(state.tiles.entries()),
        buildingsArray: Array.from(state.buildings.entries()),
        roadsArray: Array.from(state.roads.entries()),
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          try {
            const parsed = JSON.parse(str)
            
            // Restore Maps from arrays
            const tilesArray = parsed.state?.tilesArray || []
            const buildingsArray = parsed.state?.buildingsArray || []
            const roadsArray = parsed.state?.roadsArray || []
            
            const tiles = new Map(tilesArray)
            const buildings = new Map(buildingsArray)
            const roads = new Map(roadsArray)
            
            // Remove the array versions from state
            const { tilesArray: _, buildingsArray: __, roadsArray: ___, ...restState } = parsed.state || {}
            
            return {
              state: {
                ...restState,
                tiles,
                buildings,
                roads,
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
