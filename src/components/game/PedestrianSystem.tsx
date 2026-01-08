'use client'

import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCityStore } from '@/stores/cityStore'
import { gridToWorld } from '@/lib/utils'
import { TILE_SIZE } from '@/lib/constants'

// Simple Pedestrian component using InstancedMesh for performance
// Since we don't have character models, we use simple capsules/cylinders
function PedestrianInstances({ buildings }: { buildings: any[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  
  // Create pedestrians
  const [pedestrians] = useState(() => {
    // Limit to 30 pedestrians
    const count = Math.min(30, buildings.length * 2) 
    if (count === 0) return []

    return Array.from({ length: count }).map(() => ({
      speed: 0.5 + Math.random() * 0.5, // Walking speed
      position: new THREE.Vector3(),
      target: new THREE.Vector3(),
      currentBuildingId: '',
      targetBuildingId: '',
      progress: 0,
      color: new THREE.Color().setHSL(Math.random(), 0.6, 0.5), // Random clothing color
      state: 'idle' as 'walking' | 'idle',
      idleTime: 0,
    }))
  })

  useFrame((state, delta) => {
    if (!meshRef.current) return
    if (buildings.length < 2) return

    // Pre-calculate building positions map
    const buildingMap = new Map(buildings.map(b => [b.id, b]))

    pedestrians.forEach((ped, i) => {
      // Initialize if needed
      if (!ped.currentBuildingId || !buildingMap.has(ped.currentBuildingId)) {
        const startBuilding = buildings[Math.floor(Math.random() * buildings.length)]
        ped.currentBuildingId = startBuilding.id
        const worldPos = gridToWorld(startBuilding.position)
        // Start at random edge of the tile (sidewalk)
        ped.position.set(
          worldPos.x + (Math.random() - 0.5) * TILE_SIZE * 0.8,
          0.15, // Height (half of 0.3)
          worldPos.z + (Math.random() - 0.5) * TILE_SIZE * 0.8
        )
        ped.state = 'idle'
        ped.idleTime = Math.random() * 2
      }

      if (ped.state === 'idle') {
        ped.idleTime -= delta
        if (ped.idleTime <= 0) {
          // Pick new target
          let targetBuilding = buildings[Math.floor(Math.random() * buildings.length)]
          // Try to find a somewhat close building (within 5 tiles) to walk to
          // If too far, they just teleport (simulating entering building / transit)
          // For visual effect, let's make them walk to a random point on current or neighbor tile
          
          // Simplified logic: Just walk around the current building's perimeter
          const currentB = buildingMap.get(ped.currentBuildingId)
          if (currentB) {
             const worldPos = gridToWorld(currentB.position)
             // Pick a random point on the sidewalk (border of the tile)
             const angle = Math.random() * Math.PI * 2
             const radius = TILE_SIZE * 0.4 // Sidewalk radius
             ped.target.set(
               worldPos.x + TILE_SIZE/2 + Math.cos(angle) * radius,
               0.15,
               worldPos.z + TILE_SIZE/2 + Math.sin(angle) * radius
             )
             ped.state = 'walking'
             ped.progress = 0
          }
        }
      } else if (ped.state === 'walking') {
        // Simple linear movement
        const dist = ped.position.distanceTo(ped.target)
        if (dist < 0.1) {
          ped.state = 'idle'
          ped.idleTime = 1 + Math.random() * 3
        } else {
          const dir = new THREE.Vector3().subVectors(ped.target, ped.position).normalize()
          ped.position.add(dir.multiplyScalar(ped.speed * delta))
        }
      }

      // Update Instance Matrix
      const dummy = new THREE.Object3D()
      dummy.position.copy(ped.position)
      // Look at target if walking
      if (ped.state === 'walking') {
        dummy.lookAt(ped.target.x, ped.position.y, ped.target.z)
      }
      dummy.scale.set(0.15, 0.3, 0.15) // Small capsule/box size
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
      meshRef.current.setColorAt(i, ped.color)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 30]}>
      <capsuleGeometry args={[1, 1, 4, 8]} /> 
      <meshStandardMaterial />
    </instancedMesh>
  )
}

export function PedestrianSystem() {
  const buildings = useCityStore((state) => state.buildings)
  const buildingArray = useMemo(() => {
    // Only spawn pedestrians around Residential and Commercial zones
    return Array.from(buildings.values()).filter(b => {
       // We need to check building definition for category
       // But definitionId often contains category hint or we can fetch def
       // For performance, let's just use all buildings for now, or filter by ID string content
       return b.definitionId.includes('residential') || b.definitionId.includes('commercial') || b.definitionId.includes('shop') || b.definitionId.includes('market')
    })
  }, [buildings])

  if (buildingArray.length === 0) return null

  return (
    <group>
      <PedestrianInstances buildings={buildingArray} />
    </group>
  )
}
