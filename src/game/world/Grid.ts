import { GridPosition, TileData, TileType, ZoneType } from '@/types/game.types'
import { GRID_SIZE } from '@/lib/constants'
import { gridPositionToKey, isValidGridPosition, getAdjacentTiles } from '@/lib/utils'

/**
 * Grid class for managing the game world grid
 */
export class Grid {
  private tiles: Map<string, TileData> = new Map()
  private width: number
  private height: number

  constructor(width: number = GRID_SIZE, height: number = GRID_SIZE) {
    this.width = width
    this.height = height
    this.initialize()
  }

  /**
   * Initialize grid with empty tiles
   */
  initialize(): void {
    this.tiles.clear()

    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.height; z++) {
        const position = { x, z }
        const key = gridPositionToKey(position)
        
        this.tiles.set(key, {
          id: key,
          position,
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
      }
    }
  }

  /**
   * Get tile at position
   */
  getTile(position: GridPosition): TileData | undefined {
    if (!isValidGridPosition(position)) return undefined
    return this.tiles.get(gridPositionToKey(position))
  }

  /**
   * Set tile data
   */
  setTile(position: GridPosition, data: Partial<TileData>): void {
    const key = gridPositionToKey(position)
    const existing = this.tiles.get(key)
    
    if (existing) {
      this.tiles.set(key, { ...existing, ...data })
    }
  }

  /**
   * Check if tile is empty
   */
  isEmpty(position: GridPosition): boolean {
    const tile = this.getTile(position)
    return tile !== undefined && 
           tile.type === 'empty' && 
           tile.buildingId === null && 
           tile.roadId === null
  }

  /**
   * Check if area is empty
   */
  isAreaEmpty(start: GridPosition, width: number, depth: number): boolean {
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        const pos = { x: start.x + x, z: start.z + z }
        if (!this.isEmpty(pos)) return false
      }
    }
    return true
  }

  /**
   * Place building on tiles
   */
  placeBuilding(buildingId: string, start: GridPosition, width: number, depth: number): boolean {
    if (!this.isAreaEmpty(start, width, depth)) return false

    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        const pos = { x: start.x + x, z: start.z + z }
        this.setTile(pos, {
          type: 'building',
          buildingId,
        })
      }
    }

    return true
  }

  /**
   * Remove building from tiles
   */
  removeBuilding(buildingId: string): void {
    this.tiles.forEach((tile, key) => {
      if (tile.buildingId === buildingId) {
        this.tiles.set(key, {
          ...tile,
          type: 'empty',
          buildingId: null,
        })
      }
    })
  }

  /**
   * Place road on tile
   */
  placeRoad(roadId: string, position: GridPosition): boolean {
    if (!this.isEmpty(position)) return false

    this.setTile(position, {
      type: 'road',
      roadId,
    })

    return true
  }

  /**
   * Remove road from tile
   */
  removeRoad(roadId: string): void {
    this.tiles.forEach((tile, key) => {
      if (tile.roadId === roadId) {
        this.tiles.set(key, {
          ...tile,
          type: 'empty',
          roadId: null,
        })
      }
    })
  }

  /**
   * Set zone on tile
   */
  setZone(position: GridPosition, zone: ZoneType | null): boolean {
    const tile = this.getTile(position)
    if (!tile || tile.buildingId || tile.roadId) return false

    this.setTile(position, { zone })
    return true
  }

  /**
   * Get all tiles
   */
  getAllTiles(): TileData[] {
    return Array.from(this.tiles.values())
  }

  /**
   * Get tiles by type
   */
  getTilesByType(type: TileType): TileData[] {
    return this.getAllTiles().filter(tile => tile.type === type)
  }

  /**
   * Get tiles by zone
   */
  getTilesByZone(zone: ZoneType): TileData[] {
    return this.getAllTiles().filter(tile => tile.zone === zone)
  }

  /**
   * Get adjacent tiles
   */
  getAdjacent(position: GridPosition): TileData[] {
    return getAdjacentTiles(position)
      .map(pos => this.getTile(pos))
      .filter((tile): tile is TileData => tile !== undefined)
  }

  /**
   * Get grid dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height }
  }

  /**
   * Serialize grid
   */
  serialize(): TileData[] {
    return this.getAllTiles()
  }

  /**
   * Deserialize grid
   */
  deserialize(tiles: TileData[]): void {
    this.tiles.clear()
    tiles.forEach(tile => {
      this.tiles.set(gridPositionToKey(tile.position), tile)
    })
  }
}
