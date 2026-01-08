import * as THREE from 'three'
import { Building as BuildingData, BuildingDefinition } from '@/types/building.types'
import { GridPosition } from '@/types/game.types'
import { gridToWorld } from '@/lib/utils'
import { TILE_SIZE } from '@/lib/constants'
import { getModelLoader, ProceduralBuildingGenerator } from '../rendering/ModelLoader'

/**
 * Building entity class
 * Manages 3D representation and state of a building
 */
export class BuildingEntity {
  public readonly id: string
  public readonly definition: BuildingDefinition
  public readonly data: BuildingData

  private mesh: THREE.Group | null = null
  private isLoaded = false

  constructor(data: BuildingData, definition: BuildingDefinition) {
    this.id = data.id
    this.data = data
    this.definition = definition
  }

  /**
   * Load 3D model
   */
  async loadModel(): Promise<THREE.Group> {
    if (this.mesh) return this.mesh

    try {
      // Try to load GLTF model
      const loader = getModelLoader()
      this.mesh = await loader.load(this.definition.modelPath)
    } catch (error) {
      // Fallback to procedural generation
      console.warn(`[BuildingEntity] Model not found, generating procedural: ${this.definition.modelPath}`)
      
      const height = this.getProceduralHeight()
      const color = this.getProceduralColor()
      
      this.mesh = ProceduralBuildingGenerator.generate(
        this.definition.size.width * TILE_SIZE,
        this.definition.size.depth * TILE_SIZE,
        height,
        color,
        this.definition.category
      )
    }

    // Apply position and rotation
    this.updateTransform()
    
    this.isLoaded = true
    return this.mesh
  }

  /**
   * Get procedural building height based on category
   */
  private getProceduralHeight(): number {
    const baseHeight = 0.5

    switch (this.definition.category) {
      case 'residential':
        return baseHeight + (this.definition.capacity / 50) * 1.5
      case 'commercial':
        return baseHeight + (this.definition.jobs / 100) * 2
      case 'industrial':
        return baseHeight * 0.8
      case 'service':
        return baseHeight * 1.2
      case 'park':
        return 0.1
      default:
        return baseHeight
    }
  }

  /**
   * Get procedural building color based on category
   */
  private getProceduralColor(): string {
    switch (this.definition.category) {
      case 'residential':
        return '#68d391'
      case 'commercial':
        return '#4299e1'
      case 'industrial':
        return '#ecc94b'
      case 'service':
        return '#9f7aea'
      case 'utility':
        return '#f6ad55'
      case 'park':
        return '#48bb78'
      default:
        return '#a0aec0'
    }
  }

  /**
   * Update mesh transform
   */
  updateTransform(): void {
    if (!this.mesh) return

    const worldPos = gridToWorld(this.data.position)
    const { width, depth } = this.definition.size

    // Position at center of building footprint
    this.mesh.position.set(
      worldPos.x + (width * TILE_SIZE) / 2,
      0,
      worldPos.z + (depth * TILE_SIZE) / 2
    )

    // Apply rotation
    this.mesh.rotation.y = (this.data.rotation * Math.PI) / 180
  }

  /**
   * Update building state
   */
  update(delta: number): void {
    // Update animations, effects, etc.
    if (!this.mesh) return

    // Add subtle hover animation when selected
    // Add occupancy visual indicator
    // Add powered/water status effects
  }

  /**
   * Get 3D mesh
   */
  getMesh(): THREE.Group | null {
    return this.mesh
  }

  /**
   * Check if model is loaded
   */
  isModelLoaded(): boolean {
    return this.isLoaded
  }

  /**
   * Set visibility
   */
  setVisible(visible: boolean): void {
    if (this.mesh) {
      this.mesh.visible = visible
    }
  }

  /**
   * Highlight building
   */
  setHighlighted(highlighted: boolean): void {
    if (!this.mesh) return

    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        if (highlighted) {
          child.material.emissive = new THREE.Color('#38b2ac')
          child.material.emissiveIntensity = 0.3
        } else {
          child.material.emissive = new THREE.Color('#000000')
          child.material.emissiveIntensity = 0
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
    this.isLoaded = false
  }
}
