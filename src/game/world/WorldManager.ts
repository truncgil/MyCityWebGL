import { Grid } from './Grid'
import { Tile } from './Tile'
import { GridPosition, TileData, ZoneType } from '@/types/game.types'
import { Building, BuildingDefinition } from '@/types/building.types'
import { Road } from '@/types/simulation.types'
import { generateId, gridPositionToKey, getTilesInRadius } from '@/lib/utils'
import { GRID_SIZE } from '@/lib/constants'

/**
 * World manager class
 * Coordinates grid, buildings, roads, and zones
 */
export class WorldManager {
  private grid: Grid
  private buildings: Map<string, Building> = new Map()
  private roads: Map<string, Road> = new Map()

  constructor() {
    this.grid = new Grid(GRID_SIZE, GRID_SIZE)
  }

  /**
   * Initialize world
   */
  initialize(): void {
    this.grid.initialize()
    this.buildings.clear()
    this.roads.clear()
  }

  /**
   * Get grid
   */
  getGrid(): Grid {
    return this.grid
  }

  /**
   * Get tile
   */
  getTile(position: GridPosition): TileData | undefined {
    return this.grid.getTile(position)
  }

  /**
   * Place building
   */
  placeBuilding(
    definition: BuildingDefinition,
    position: GridPosition,
    rotation: number
  ): Building | null {
    const { width, depth } = definition.size

    // Check area availability
    if (!this.grid.isAreaEmpty(position, width, depth)) {
      return null
    }

    // Create building
    const building: Building = {
      id: generateId(),
      definitionId: definition.id,
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

    // Place on grid
    this.grid.placeBuilding(building.id, position, width, depth)
    this.buildings.set(building.id, building)

    // Update land values in surrounding area
    this.updateLandValues(position, definition.effects.landValue)

    return building
  }

  /**
   * Remove building
   */
  removeBuilding(buildingId: string): boolean {
    const building = this.buildings.get(buildingId)
    if (!building) return false

    this.grid.removeBuilding(buildingId)
    this.buildings.delete(buildingId)

    return true
  }

  /**
   * Get building
   */
  getBuilding(buildingId: string): Building | undefined {
    return this.buildings.get(buildingId)
  }

  /**
   * Get building at position
   */
  getBuildingAt(position: GridPosition): Building | undefined {
    const tile = this.grid.getTile(position)
    if (!tile?.buildingId) return undefined
    return this.buildings.get(tile.buildingId)
  }

  /**
   * Get all buildings
   */
  getAllBuildings(): Building[] {
    return Array.from(this.buildings.values())
  }

  /**
   * Place road
   */
  placeRoad(position: GridPosition): Road | null {
    const tile = this.grid.getTile(position)
    if (!tile || !this.grid.isEmpty(position)) return null

    const road: Road = {
      id: generateId(),
      position,
      type: 'road',
      connections: [],
      trafficLoad: 0,
    }

    this.grid.placeRoad(road.id, position)
    this.roads.set(road.id, road)

    // Update road connections
    this.updateRoadConnections()

    return road
  }

  /**
   * Remove road
   */
  removeRoad(roadId: string): boolean {
    const road = this.roads.get(roadId)
    if (!road) return false

    this.grid.removeRoad(roadId)
    this.roads.delete(roadId)

    // Update road connections
    this.updateRoadConnections()

    return true
  }

  /**
   * Get road
   */
  getRoad(roadId: string): Road | undefined {
    return this.roads.get(roadId)
  }

  /**
   * Get road at position
   */
  getRoadAt(position: GridPosition): Road | undefined {
    const tile = this.grid.getTile(position)
    if (!tile?.roadId) return undefined
    return this.roads.get(tile.roadId)
  }

  /**
   * Get all roads
   */
  getAllRoads(): Road[] {
    return Array.from(this.roads.values())
  }

  /**
   * Update road connections
   */
  private updateRoadConnections(): void {
    const roadPositions = new Set<string>()
    this.roads.forEach(road => {
      roadPositions.add(gridPositionToKey(road.position))
    })

    this.roads.forEach(road => {
      road.connections = []
      
      const directions: { direction: 'north' | 'south' | 'east' | 'west'; dx: number; dz: number }[] = [
        { direction: 'north', dx: 0, dz: -1 },
        { direction: 'south', dx: 0, dz: 1 },
        { direction: 'east', dx: 1, dz: 0 },
        { direction: 'west', dx: -1, dz: 0 },
      ]

      directions.forEach(({ direction, dx, dz }) => {
        const neighborKey = gridPositionToKey({
          x: road.position.x + dx,
          z: road.position.z + dz,
        })

        if (roadPositions.has(neighborKey)) {
          road.connections.push({
            direction,
            connectedTo: neighborKey,
          })
        }
      })
    })
  }

  /**
   * Set zone
   */
  setZone(position: GridPosition, zone: ZoneType | null): boolean {
    return this.grid.setZone(position, zone)
  }

  /**
   * Get zone at position
   */
  getZoneAt(position: GridPosition): ZoneType | null {
    const tile = this.grid.getTile(position)
    return tile?.zone ?? null
  }

  /**
   * Update land values around a position
   */
  private updateLandValues(center: GridPosition, effect: number): void {
    const radius = 5
    const tiles = getTilesInRadius(center, radius)

    tiles.forEach(pos => {
      const distance = Math.sqrt(
        Math.pow(pos.x - center.x, 2) + Math.pow(pos.z - center.z, 2)
      )
      const falloff = 1 - distance / radius
      const change = Math.floor(effect * falloff)

      const tile = this.grid.getTile(pos)
      if (tile) {
        this.grid.setTile(pos, {
          landValue: Math.max(0, Math.min(100, tile.landValue + change)),
        })
      }
    })
  }

  /**
   * Serialize world
   */
  serialize(): {
    tiles: TileData[]
    buildings: Building[]
    roads: Road[]
  } {
    return {
      tiles: this.grid.serialize(),
      buildings: this.getAllBuildings(),
      roads: this.getAllRoads(),
    }
  }

  /**
   * Deserialize world
   */
  deserialize(data: {
    tiles: TileData[]
    buildings: Building[]
    roads: Road[]
  }): void {
    this.grid.deserialize(data.tiles)

    this.buildings.clear()
    data.buildings.forEach(building => {
      this.buildings.set(building.id, building)
    })

    this.roads.clear()
    data.roads.forEach(road => {
      this.roads.set(road.id, road)
    })
  }
}
