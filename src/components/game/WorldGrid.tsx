'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

import { useCityStore } from '@/stores/cityStore'
import { GRID_SIZE, TILE_SIZE, ZONE_COLORS } from '@/lib/constants'
import { gridToWorld, gridPositionToKey } from '@/lib/utils'

// Zone tile component
function ZoneTile({ 
  position, 
  zone 
}: { 
  position: { x: number; z: number }
  zone: 'residential' | 'commercial' | 'industrial'
}) {
  const worldPos = gridToWorld(position)
  const color = ZONE_COLORS[zone]
  
  return (
    <mesh
      position={[worldPos.x + TILE_SIZE / 2, 0.02, worldPos.z + TILE_SIZE / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[TILE_SIZE * 0.95, TILE_SIZE * 0.95]} />
      <meshStandardMaterial 
        color={color} 
        transparent 
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export function WorldGrid() {
  const tiles = useCityStore((state) => state.tiles)
  
  // Get all zoned tiles
  const zonedTiles = useMemo(() => {
    const result: { position: { x: number; z: number }; zone: 'residential' | 'commercial' | 'industrial' }[] = []
    
    tiles.forEach((tile) => {
      if (tile.zone && !tile.buildingId) {
        result.push({
          position: tile.position,
          zone: tile.zone,
        })
      }
    })
    
    return result
  }, [tiles])
  
  return (
    <group name="world-grid">
      {zonedTiles.map((item) => (
        <ZoneTile
          key={gridPositionToKey(item.position)}
          position={item.position}
          zone={item.zone}
        />
      ))}
    </group>
  )
}
