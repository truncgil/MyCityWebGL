'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

import { useGameStore } from '@/stores/gameStore'
import { useCityStore } from '@/stores/cityStore'
import { TILE_SIZE } from '@/lib/constants'
import { gridToWorld } from '@/lib/utils'

export function TileHighlight() {
  const hoveredTile = useGameStore((state) => state.hoveredTile)
  const mode = useGameStore((state) => state.mode)
  const selectedBuilding = useGameStore((state) => state.selectedBuilding)
  const rotation = useGameStore((state) => state.rotation)
  
  const getBuildingDefinition = useCityStore((state) => state.getBuildingDefinition)
  const getTile = useCityStore((state) => state.getTile)
  
  // Calculate highlight size and color based on mode
  const { width, depth, color, canPlace } = useMemo(() => {
    if (!hoveredTile) {
      return { width: 1, depth: 1, color: '#38b2ac', canPlace: true }
    }
    
    let w = 1
    let d = 1
    let c = '#38b2ac'
    let canPlace = true
    
    if (mode === 'build' && selectedBuilding) {
      const definition = getBuildingDefinition(selectedBuilding)
      if (definition) {
        // Handle rotation
        if (rotation === 90 || rotation === 270) {
          w = definition.size.depth
          d = definition.size.width
        } else {
          w = definition.size.width
          d = definition.size.depth
        }
        
        // Check if all tiles are available
        for (let dx = 0; dx < w; dx++) {
          for (let dz = 0; dz < d; dz++) {
            const checkPos = { x: hoveredTile.x + dx, z: hoveredTile.z + dz }
            const tile = getTile(checkPos)
            if (!tile || tile.buildingId || tile.roadId) {
              canPlace = false
              break
            }
          }
          if (!canPlace) break
        }
      }
    } else if (mode === 'demolish') {
      const tile = getTile(hoveredTile)
      if (tile?.buildingId || tile?.roadId) {
        c = '#f56565' // Red for demolish
      } else {
        canPlace = false
        c = '#718096' // Gray for nothing to demolish
      }
    } else if (mode === 'road') {
      const tile = getTile(hoveredTile)
      if (tile?.buildingId || tile?.roadId) {
        canPlace = false
        c = '#f56565'
      }
    } else if (mode === 'zone') {
      const tile = getTile(hoveredTile)
      if (tile?.buildingId || tile?.roadId) {
        canPlace = false
        c = '#f56565'
      }
    }
    
    return { 
      width: w, 
      depth: d, 
      color: canPlace ? c : '#f56565',
      canPlace,
    }
  }, [hoveredTile, mode, selectedBuilding, rotation, getBuildingDefinition, getTile])
  
  if (!hoveredTile) return null
  
  const worldPos = gridToWorld(hoveredTile)
  
  return (
    <group position={[
      worldPos.x + (width * TILE_SIZE) / 2,
      0.03,
      worldPos.z + (depth * TILE_SIZE) / 2,
    ]}>
      {/* Highlight plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * TILE_SIZE * 0.98, depth * TILE_SIZE * 0.98]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Border */}
      <lineSegments>
        <edgesGeometry 
          args={[new THREE.PlaneGeometry(width * TILE_SIZE, depth * TILE_SIZE)]} 
        />
        <lineBasicMaterial color={color} linewidth={2} />
      </lineSegments>
      
      {/* Pulse animation indicator */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.3, 0.35, 32]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.8}
        />
      </mesh>
    </group>
  )
}
