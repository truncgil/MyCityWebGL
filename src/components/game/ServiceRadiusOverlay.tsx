'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { useGameStore } from '@/stores/gameStore'
import { useCityStore } from '@/stores/cityStore'
import { gridToWorld } from '@/lib/utils'
import { TILE_SIZE } from '@/lib/constants'
import { DEFAULT_BUILDINGS } from '@/types/building.types'

export function ServiceRadiusOverlay() {
  const clickedBuildingId = useGameStore((state) => state.clickedBuildingId)
  const buildings = useCityStore((state) => state.buildings)
  
  const radiusData = useMemo(() => {
    if (!clickedBuildingId) return null
    
    const building = buildings.get(clickedBuildingId)
    if (!building) return null
    
    const definition = DEFAULT_BUILDINGS.find(b => b.id === building.definitionId)
    if (!definition?.serviceRadius || !definition?.serviceType) return null
    
    const worldPos = gridToWorld(building.position)
    const centerX = worldPos.x + (definition.size.width * TILE_SIZE) / 2
    const centerZ = worldPos.z + (definition.size.depth * TILE_SIZE) / 2
    
    return {
      position: [centerX, 0.05, centerZ] as [number, number, number],
      radius: definition.serviceRadius * TILE_SIZE,
      serviceType: definition.serviceType,
    }
  }, [clickedBuildingId, buildings])
  
  if (!radiusData) return null
  
  const color = radiusData.serviceType === 'power' ? '#fbbf24' : '#3b82f6'
  
  return (
    <group>
      {/* Circle outline */}
      <mesh 
        position={radiusData.position} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[radiusData.radius - 0.1, radiusData.radius, 64]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Filled circle (semi-transparent) */}
      <mesh 
        position={[radiusData.position[0], 0.02, radiusData.position[2]]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[radiusData.radius, 64]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
