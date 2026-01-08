import { TileData, GridPosition, TileType, ZoneType } from '@/types/game.types'
import { gridPositionToKey } from '@/lib/utils'

/**
 * Tile class for individual grid tiles
 */
export class Tile implements TileData {
  public readonly id: string
  public readonly position: GridPosition
  
  public type: TileType
  public buildingId: string | null
  public roadId: string | null
  public zone: ZoneType | null
  public elevation: number
  public landValue: number
  public pollution: number
  public crime: number
  public traffic: number

  constructor(position: GridPosition, data?: Partial<TileData>) {
    this.id = gridPositionToKey(position)
    this.position = position
    
    this.type = data?.type ?? 'empty'
    this.buildingId = data?.buildingId ?? null
    this.roadId = data?.roadId ?? null
    this.zone = data?.zone ?? null
    this.elevation = data?.elevation ?? 0
    this.landValue = data?.landValue ?? 50
    this.pollution = data?.pollution ?? 0
    this.crime = data?.crime ?? 0
    this.traffic = data?.traffic ?? 0
  }

  /**
   * Check if tile is empty
   */
  isEmpty(): boolean {
    return this.type === 'empty' && 
           this.buildingId === null && 
           this.roadId === null
  }

  /**
   * Check if tile has a building
   */
  hasBuilding(): boolean {
    return this.buildingId !== null
  }

  /**
   * Check if tile has a road
   */
  hasRoad(): boolean {
    return this.roadId !== null
  }

  /**
   * Check if tile is zoned
   */
  isZoned(): boolean {
    return this.zone !== null
  }

  /**
   * Check if tile can be developed (has zone, no building)
   */
  canDevelop(): boolean {
    return this.isZoned() && !this.hasBuilding() && !this.hasRoad()
  }

  /**
   * Update tile properties
   */
  update(data: Partial<TileData>): void {
    if (data.type !== undefined) this.type = data.type
    if (data.buildingId !== undefined) this.buildingId = data.buildingId
    if (data.roadId !== undefined) this.roadId = data.roadId
    if (data.zone !== undefined) this.zone = data.zone
    if (data.elevation !== undefined) this.elevation = data.elevation
    if (data.landValue !== undefined) this.landValue = data.landValue
    if (data.pollution !== undefined) this.pollution = data.pollution
    if (data.crime !== undefined) this.crime = data.crime
    if (data.traffic !== undefined) this.traffic = data.traffic
  }

  /**
   * Get desirability score
   * Higher is better for residential/commercial
   */
  getDesirability(): number {
    let score = this.landValue

    // Pollution decreases desirability
    score -= this.pollution * 2

    // Crime decreases desirability
    score -= this.crime * 3

    // Traffic slightly decreases (for residential)
    score -= this.traffic * 0.5

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Serialize tile data
   */
  serialize(): TileData {
    return {
      id: this.id,
      position: this.position,
      type: this.type,
      buildingId: this.buildingId,
      roadId: this.roadId,
      zone: this.zone,
      elevation: this.elevation,
      landValue: this.landValue,
      pollution: this.pollution,
      crime: this.crime,
      traffic: this.traffic,
    }
  }

  /**
   * Create tile from data
   */
  static fromData(data: TileData): Tile {
    return new Tile(data.position, data)
  }
}
