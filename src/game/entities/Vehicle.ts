import * as THREE from 'three'
import { Vehicle as VehicleData, VehicleType, VehicleState } from '@/types/simulation.types'
import { GridPosition } from '@/types/game.types'
import { lerp } from '@/lib/utils'

/**
 * Vehicle colors by type
 */
const VEHICLE_COLORS: Record<VehicleType, number> = {
  car: 0x4299e1,
  truck: 0xecc94b,
  bus: 0x48bb78,
  emergency: 0xf56565,
}

/**
 * Vehicle entity class
 * Manages 3D representation and movement of vehicles
 */
export class VehicleEntity {
  public readonly id: string
  public readonly type: VehicleType
  public data: VehicleData

  private mesh: THREE.Group | null = null
  private targetRotation = 0
  private currentRotation = 0

  constructor(data: VehicleData) {
    this.id = data.id
    this.type = data.type
    this.data = data
    this.createMesh()
  }

  /**
   * Create vehicle mesh
   */
  private createMesh(): void {
    this.mesh = new THREE.Group()

    // Body
    const bodyGeometry = this.type === 'truck' 
      ? new THREE.BoxGeometry(0.25, 0.12, 0.5)
      : new THREE.BoxGeometry(0.2, 0.1, 0.35)

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: VEHICLE_COLORS[this.type],
      roughness: 0.5,
      metalness: 0.3,
    })

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.08
    body.castShadow = true
    this.mesh.add(body)

    // Roof/cabin
    const roofGeometry = new THREE.BoxGeometry(0.15, 0.06, 0.15)
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      roughness: 0.3,
      metalness: 0.5,
    })
    const roof = new THREE.Mesh(roofGeometry, roofMaterial)
    roof.position.set(0, 0.15, -0.05)
    roof.castShadow = true
    this.mesh.add(roof)

    // Headlights
    const headlightGeometry = new THREE.SphereGeometry(0.02, 8, 8)
    const headlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
    })

    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial)
    leftHeadlight.position.set(-0.07, 0.07, 0.18)
    this.mesh.add(leftHeadlight)

    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial)
    rightHeadlight.position.set(0.07, 0.07, 0.18)
    this.mesh.add(rightHeadlight)

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8)
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      roughness: 0.9,
    })

    const wheelPositions = [
      { x: -0.08, z: 0.1 },
      { x: 0.08, z: 0.1 },
      { x: -0.08, z: -0.1 },
      { x: 0.08, z: -0.1 },
    ]

    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
      wheel.rotation.z = Math.PI / 2
      wheel.position.set(pos.x, 0.03, pos.z)
      this.mesh!.add(wheel)
    })

    // Set initial position
    this.updatePosition()
  }

  /**
   * Update vehicle position and rotation
   */
  update(delta: number): void {
    if (!this.mesh) return

    // Interpolate rotation for smooth turning
    this.currentRotation = lerp(this.currentRotation, this.targetRotation, delta * 10)
    
    // Update mesh position
    this.mesh.position.set(
      this.data.position.x,
      0,
      this.data.position.z
    )

    // Update rotation based on movement direction
    this.mesh.rotation.y = this.currentRotation
  }

  /**
   * Update position from data
   */
  updatePosition(): void {
    if (!this.mesh) return

    this.mesh.position.set(
      this.data.position.x,
      0,
      this.data.position.z
    )
  }

  /**
   * Set target position and calculate rotation
   */
  setTarget(target: { x: number; y: number; z: number }): void {
    const dx = target.x - this.data.position.x
    const dz = target.z - this.data.position.z

    if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
      this.targetRotation = Math.atan2(dx, dz)
    }

    this.data.targetPosition = target
  }

  /**
   * Set vehicle state
   */
  setState(state: VehicleState): void {
    this.data.state = state

    if (!this.mesh) return

    // Visual feedback for state
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        if (state === 'waiting') {
          child.material.emissive.setHex(0xff0000)
          child.material.emissiveIntensity = 0.2
        } else {
          child.material.emissive.setHex(0x000000)
          child.material.emissiveIntensity = 0
        }
      }
    })
  }

  /**
   * Get mesh
   */
  getMesh(): THREE.Group | null {
    return this.mesh
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
