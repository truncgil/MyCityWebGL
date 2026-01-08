import * as THREE from 'three'
import { Road as RoadData, Direction } from '@/types/simulation.types'
import { GridPosition } from '@/types/game.types'
import { gridToWorld, gridPositionToKey, getAdjacentTiles } from '@/lib/utils'
import { TILE_SIZE } from '@/lib/constants'

/**
 * Road segment types based on connections
 */
type RoadSegmentType = 
  | 'straight_ns'
  | 'straight_ew'
  | 'corner_ne'
  | 'corner_nw'
  | 'corner_se'
  | 'corner_sw'
  | 't_junction_n'
  | 't_junction_s'
  | 't_junction_e'
  | 't_junction_w'
  | 'crossroad'
  | 'dead_end_n'
  | 'dead_end_s'
  | 'dead_end_e'
  | 'dead_end_w'
  | 'isolated'

/**
 * Road entity class
 * Manages 3D representation of road segments
 */
export class RoadEntity {
  public readonly id: string
  public readonly data: RoadData

  private mesh: THREE.Group | null = null
  private segmentType: RoadSegmentType = 'isolated'

  constructor(data: RoadData) {
    this.id = data.id
    this.data = data
  }

  /**
   * Create road mesh based on connections
   */
  createMesh(connections: { north: boolean; south: boolean; east: boolean; west: boolean }): THREE.Group {
    this.segmentType = this.determineSegmentType(connections)
    this.mesh = this.generateMesh()
    this.updateTransform()
    return this.mesh
  }

  /**
   * Determine road segment type
   */
  private determineSegmentType(conn: { north: boolean; south: boolean; east: boolean; west: boolean }): RoadSegmentType {
    const count = [conn.north, conn.south, conn.east, conn.west].filter(Boolean).length

    if (count === 0) return 'isolated'
    
    if (count === 1) {
      if (conn.north) return 'dead_end_n'
      if (conn.south) return 'dead_end_s'
      if (conn.east) return 'dead_end_e'
      return 'dead_end_w'
    }

    if (count === 2) {
      if (conn.north && conn.south) return 'straight_ns'
      if (conn.east && conn.west) return 'straight_ew'
      if (conn.north && conn.east) return 'corner_ne'
      if (conn.north && conn.west) return 'corner_nw'
      if (conn.south && conn.east) return 'corner_se'
      return 'corner_sw'
    }

    if (count === 3) {
      if (!conn.south) return 't_junction_n'
      if (!conn.north) return 't_junction_s'
      if (!conn.west) return 't_junction_e'
      return 't_junction_w'
    }

    return 'crossroad'
  }

  /**
   * Generate road mesh geometry
   */
  private generateMesh(): THREE.Group {
    const group = new THREE.Group()
    const size = TILE_SIZE

    // Road surface
    const roadGeometry = new THREE.PlaneGeometry(size * 0.9, size * 0.9)
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: '#4a5568',
      roughness: 0.9,
      metalness: 0,
    })
    const road = new THREE.Mesh(roadGeometry, roadMaterial)
    road.rotation.x = -Math.PI / 2
    road.position.y = 0.02
    road.receiveShadow = true
    group.add(road)

    // Road markings
    this.addRoadMarkings(group)

    // Sidewalks
    this.addSidewalks(group)

    return group
  }

  /**
   * Add road markings based on segment type
   */
  private addRoadMarkings(group: THREE.Group): void {
    const markingMaterial = new THREE.MeshBasicMaterial({ color: '#ecc94b' })
    const size = TILE_SIZE

    const addCenterLine = (vertical: boolean) => {
      const lineGeometry = new THREE.PlaneGeometry(
        vertical ? 0.03 : size * 0.7,
        vertical ? size * 0.7 : 0.03
      )
      const line = new THREE.Mesh(lineGeometry, markingMaterial)
      line.rotation.x = -Math.PI / 2
      line.position.y = 0.025
      group.add(line)
    }

    switch (this.segmentType) {
      case 'straight_ns':
      case 'dead_end_n':
      case 'dead_end_s':
        addCenterLine(true)
        break
      case 'straight_ew':
      case 'dead_end_e':
      case 'dead_end_w':
        addCenterLine(false)
        break
      case 'crossroad':
      case 't_junction_n':
      case 't_junction_s':
      case 't_junction_e':
      case 't_junction_w':
        addCenterLine(true)
        addCenterLine(false)
        break
    }
  }

  /**
   * Add sidewalks to road
   */
  private addSidewalks(group: THREE.Group): void {
    const sidewalkMaterial = new THREE.MeshStandardMaterial({
      color: '#718096',
      roughness: 0.8,
    })
    const size = TILE_SIZE

    const addSidewalk = (position: THREE.Vector3, width: number, depth: number) => {
      const geometry = new THREE.BoxGeometry(width, 0.06, depth)
      const sidewalk = new THREE.Mesh(geometry, sidewalkMaterial)
      sidewalk.position.copy(position)
      sidewalk.receiveShadow = true
      group.add(sidewalk)
    }

    // Add sidewalks on edges
    const offset = size * 0.45
    const thickness = 0.08
    const length = size * 0.95

    // Based on segment type, add appropriate sidewalks
    addSidewalk(new THREE.Vector3(0, 0.03, offset), length, thickness)
    addSidewalk(new THREE.Vector3(0, 0.03, -offset), length, thickness)
    addSidewalk(new THREE.Vector3(offset, 0.03, 0), thickness, length)
    addSidewalk(new THREE.Vector3(-offset, 0.03, 0), thickness, length)
  }

  /**
   * Update mesh transform
   */
  private updateTransform(): void {
    if (!this.mesh) return

    const worldPos = gridToWorld(this.data.position)
    this.mesh.position.set(
      worldPos.x + TILE_SIZE / 2,
      0,
      worldPos.z + TILE_SIZE / 2
    )
  }

  /**
   * Update road connections
   */
  updateConnections(roadPositions: Set<string>): void {
    const north = roadPositions.has(gridPositionToKey({
      x: this.data.position.x,
      z: this.data.position.z - 1,
    }))
    const south = roadPositions.has(gridPositionToKey({
      x: this.data.position.x,
      z: this.data.position.z + 1,
    }))
    const east = roadPositions.has(gridPositionToKey({
      x: this.data.position.x + 1,
      z: this.data.position.z,
    }))
    const west = roadPositions.has(gridPositionToKey({
      x: this.data.position.x - 1,
      z: this.data.position.z,
    }))

    const newType = this.determineSegmentType({ north, south, east, west })
    
    if (newType !== this.segmentType) {
      // Regenerate mesh if type changed
      if (this.mesh) {
        this.dispose()
      }
      this.createMesh({ north, south, east, west })
    }
  }

  /**
   * Get mesh
   */
  getMesh(): THREE.Group | null {
    return this.mesh
  }

  /**
   * Set traffic load visualization
   */
  setTrafficLoad(load: number): void {
    if (!this.mesh) return

    // Change road color based on traffic
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.PlaneGeometry) {
        const material = child.material as THREE.MeshStandardMaterial
        if (load > 0.7) {
          material.color.setHex(0xf56565) // Red for heavy traffic
        } else if (load > 0.4) {
          material.color.setHex(0xed8936) // Orange for moderate
        } else {
          material.color.setHex(0x4a5568) // Normal
        }
      }
    })
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.mesh) {
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
      this.mesh = null
    }
  }
}
