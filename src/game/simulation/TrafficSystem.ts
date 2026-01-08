import { BaseSimulationSystem } from './SimulationManager'
import { GameTime, GridPosition } from '@/types/game.types'
import { TrafficState, Vehicle, VehicleType, PathfindingResult } from '@/types/simulation.types'
import { useCityStore } from '@/stores/cityStore'
import {
  MAX_VEHICLES,
  VEHICLE_SPEED,
  VEHICLE_SPAWN_RATE,
  CONGESTION_THRESHOLD,
} from '@/lib/constants'
import { 
  generateId, 
  gridToWorld, 
  gridPositionToKey, 
  getAdjacentTiles,
  manhattanDistance,
  randomElement,
} from '@/lib/utils'

/**
 * Traffic simulation system
 * Handles vehicle spawning, movement, and pathfinding
 */
export class TrafficSystem extends BaseSimulationSystem {
  name = 'traffic'
  priority = 50

  private vehicles: Map<string, Vehicle> = new Map()
  private congestionMap: Map<string, number> = new Map()
  private lastSpawnTime = 0

  update(delta: number, gameTime: GameTime): void {
    this.spawnVehicles(delta)
    this.updateVehicles(delta)
    this.updateCongestion()
  }

  /**
   * Spawn new vehicles from buildings
   */
  private spawnVehicles(delta: number): void {
    if (this.vehicles.size >= MAX_VEHICLES) return

    this.lastSpawnTime += delta

    if (this.lastSpawnTime < 1) return // Spawn check every second
    this.lastSpawnTime = 0

    const cityStore = useCityStore.getState()
    const { buildings, roads, buildingCatalog } = cityStore

    // Find buildings that can spawn vehicles
    const residentialBuildings: GridPosition[] = []
    const commercialBuildings: GridPosition[] = []
    const industrialBuildings: GridPosition[] = []

    buildings.forEach((building) => {
      const def = buildingCatalog.find(d => d.id === building.definitionId)
      if (!def || building.occupancy < 20) return

      switch (def.zone) {
        case 'residential':
          residentialBuildings.push(building.position)
          break
        case 'commercial':
          commercialBuildings.push(building.position)
          break
        case 'industrial':
          industrialBuildings.push(building.position)
          break
      }
    })

    // Spawn vehicles from residential to commercial/industrial
    if (residentialBuildings.length > 0 && 
        (commercialBuildings.length > 0 || industrialBuildings.length > 0)) {
      
      const spawnChance = VEHICLE_SPAWN_RATE * residentialBuildings.length
      
      if (Math.random() < spawnChance) {
        const start = randomElement(residentialBuildings)
        const destinations = [...commercialBuildings, ...industrialBuildings]
        const end = randomElement(destinations)

        this.createVehicle(start, end)
      }
    }
  }

  /**
   * Create a new vehicle
   */
  private createVehicle(start: GridPosition, end: GridPosition): void {
    // Find path
    const path = this.findPath(start, end)
    if (!path.found || path.path.length < 2) return

    const startWorld = gridToWorld(start)
    const vehicle: Vehicle = {
      id: generateId(),
      type: Math.random() < 0.9 ? 'car' : 'truck',
      position: { x: startWorld.x, y: 0, z: startWorld.z },
      targetPosition: { x: startWorld.x, y: 0, z: startWorld.z },
      path: path.path,
      currentPathIndex: 0,
      speed: VEHICLE_SPEED * (0.8 + Math.random() * 0.4), // Slight speed variation
      state: 'moving',
    }

    this.vehicles.set(vehicle.id, vehicle)
  }

  /**
   * Update vehicle positions
   */
  private updateVehicles(delta: number): void {
    const toRemove: string[] = []

    this.vehicles.forEach((vehicle, id) => {
      if (vehicle.state === 'parked') {
        toRemove.push(id)
        return
      }

      // Get current target
      const targetIndex = vehicle.currentPathIndex + 1
      if (targetIndex >= vehicle.path.length) {
        vehicle.state = 'parked'
        return
      }

      const target = vehicle.path[targetIndex]
      const targetWorld = gridToWorld(target)
      targetWorld.x += 0.5 // Center of tile
      targetWorld.z += 0.5

      // Move towards target
      const dx = targetWorld.x - vehicle.position.x
      const dz = targetWorld.z - vehicle.position.z
      const distance = Math.sqrt(dx * dx + dz * dz)

      if (distance < 0.1) {
        // Reached target, move to next
        vehicle.currentPathIndex++
        vehicle.position.x = targetWorld.x
        vehicle.position.z = targetWorld.z
      } else {
        // Check congestion
        const congestionKey = gridPositionToKey(target)
        const congestion = this.congestionMap.get(congestionKey) || 0
        const speedMultiplier = congestion > CONGESTION_THRESHOLD ? 0.5 : 1

        // Move
        const moveSpeed = vehicle.speed * speedMultiplier * delta
        const factor = Math.min(moveSpeed / distance, 1)
        
        vehicle.position.x += dx * factor
        vehicle.position.z += dz * factor
        vehicle.state = congestion > CONGESTION_THRESHOLD ? 'waiting' : 'moving'
      }
    })

    // Remove finished vehicles
    toRemove.forEach(id => this.vehicles.delete(id))
  }

  /**
   * Update congestion map
   */
  private updateCongestion(): void {
    this.congestionMap.clear()

    const cityStore = useCityStore.getState()
    const { roads } = cityStore

    // Count vehicles on each road tile
    this.vehicles.forEach((vehicle) => {
      const gridPos = {
        x: Math.floor(vehicle.position.x + 32), // Offset to grid coords
        z: Math.floor(vehicle.position.z + 32),
      }
      const key = gridPositionToKey(gridPos)
      this.congestionMap.set(key, (this.congestionMap.get(key) || 0) + 1)
    })

    // Update tile traffic values
    roads.forEach((road) => {
      const key = gridPositionToKey(road.position)
      const vehicleCount = this.congestionMap.get(key) || 0
      road.trafficLoad = Math.min(vehicleCount / 3, 1) // Normalize to 0-1
    })
  }

  /**
   * Simple A* pathfinding
   */
  private findPath(start: GridPosition, end: GridPosition): PathfindingResult {
    const cityStore = useCityStore.getState()
    const { tiles, roads } = cityStore

    // Check if there are roads
    if (roads.size === 0) {
      return { path: [], cost: 0, found: false }
    }

    // Build road position set for quick lookup
    const roadPositions = new Set<string>()
    roads.forEach((road) => {
      roadPositions.add(gridPositionToKey(road.position))
    })

    // Find nearest road to start and end
    const startRoad = this.findNearestRoad(start, roadPositions)
    const endRoad = this.findNearestRoad(end, roadPositions)

    if (!startRoad || !endRoad) {
      return { path: [], cost: 0, found: false }
    }

    // A* implementation
    const openSet = new Map<string, {
      pos: GridPosition
      g: number
      h: number
      f: number
      parent: string | null
    }>()

    const closedSet = new Set<string>()

    const startKey = gridPositionToKey(startRoad)
    openSet.set(startKey, {
      pos: startRoad,
      g: 0,
      h: manhattanDistance(startRoad, endRoad),
      f: manhattanDistance(startRoad, endRoad),
      parent: null,
    })

    while (openSet.size > 0) {
      // Find node with lowest f
      let currentKey = ''
      let lowestF = Infinity

      openSet.forEach((node, key) => {
        if (node.f < lowestF) {
          lowestF = node.f
          currentKey = key
        }
      })

      const current = openSet.get(currentKey)!
      
      // Check if reached end
      if (currentKey === gridPositionToKey(endRoad)) {
        // Reconstruct path
        const path: GridPosition[] = []
        let pathKey: string | null = currentKey

        while (pathKey) {
          const node = openSet.get(pathKey) || 
                       Array.from(closedSet).find(k => k === pathKey) ? 
                       { pos: keyToPos(pathKey), parent: null } : null
          
          if (node) {
            path.unshift(current.pos)
          }
          
          // Find parent
          const parentNode = openSet.get(pathKey)
          pathKey = parentNode?.parent || null
        }

        return { path, cost: current.g, found: true }
      }

      // Move to closed set
      openSet.delete(currentKey)
      closedSet.add(currentKey)

      // Check neighbors
      const neighbors = getAdjacentTiles(current.pos)

      for (const neighbor of neighbors) {
        const neighborKey = gridPositionToKey(neighbor)

        // Skip if not a road or already closed
        if (!roadPositions.has(neighborKey) || closedSet.has(neighborKey)) {
          continue
        }

        const tentativeG = current.g + 1

        const existing = openSet.get(neighborKey)
        if (!existing || tentativeG < existing.g) {
          openSet.set(neighborKey, {
            pos: neighbor,
            g: tentativeG,
            h: manhattanDistance(neighbor, endRoad),
            f: tentativeG + manhattanDistance(neighbor, endRoad),
            parent: currentKey,
          })
        }
      }

      // Prevent infinite loop
      if (closedSet.size > 1000) break
    }

    return { path: [], cost: 0, found: false }
  }

  /**
   * Find nearest road tile to a position
   */
  private findNearestRoad(pos: GridPosition, roadPositions: Set<string>): GridPosition | null {
    let nearest: GridPosition | null = null
    let nearestDist = Infinity

    roadPositions.forEach((key) => {
      const roadPos = keyToPos(key)
      const dist = manhattanDistance(pos, roadPos)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = roadPos
      }
    })

    return nearest
  }

  /**
   * Get all vehicles
   */
  getVehicles(): Vehicle[] {
    return Array.from(this.vehicles.values())
  }

  getState(): TrafficState {
    let totalCongestion = 0
    this.congestionMap.forEach((value) => {
      totalCongestion += value
    })

    return {
      vehicles: this.getVehicles(),
      congestionMap: this.congestionMap,
      averageCongestion: this.congestionMap.size > 0 
        ? totalCongestion / this.congestionMap.size 
        : 0,
      totalTrips: this.vehicles.size,
    }
  }

  reset(): void {
    this.vehicles.clear()
    this.congestionMap.clear()
    this.lastSpawnTime = 0
  }

  serialize(): unknown {
    return {
      vehicles: Array.from(this.vehicles.values()),
    }
  }

  deserialize(data: unknown): void {
    // Traffic state can be regenerated
    this.reset()
  }
}

// Helper to convert key back to position
function keyToPos(key: string): GridPosition {
  const [x, z] = key.split(',').map(Number)
  return { x, z }
}
