'use client'

import { useMemo, Suspense } from 'react'
import { Box, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

import { useCityStore } from '@/stores/cityStore'
import { Road } from '@/types/simulation.types'
import { ROAD_MODELS } from '@/types/building.types'
import { TILE_SIZE } from '@/lib/constants'
import { gridToWorld, gridPositionToKey, getAdjacentTiles } from '@/lib/utils'

// Preload road models
Object.values(ROAD_MODELS).forEach((path) => {
  useGLTF.preload(path)
})

// Road model component
function RoadModel({ 
  modelPath, 
  position, 
  rotation = 0 
}: { 
  modelPath: string
  position: [number, number, number]
  rotation?: number 
}) {
  try {
    const { scene } = useGLTF(modelPath)
    const clonedScene = useMemo(() => scene.clone(), [scene])
    
    return (
      <primitive 
        object={clonedScene} 
        position={position}
        rotation={[0, rotation * Math.PI / 180, 0]}
        scale={[1, 1, 1]}
      />
    )
  } catch (error) {
    console.error('Failed to load road model:', modelPath, error)
    // Fallback to box if model not found
    return (
      <Box args={[TILE_SIZE * 0.9, 0.04, TILE_SIZE * 0.9]} position={position}>
        <meshStandardMaterial color="#4a5568" roughness={0.8} />
      </Box>
    )
  }
}

// Road segment component
function RoadSegment({ road, connections }: { road: Road; connections: Set<string> }) {
  const worldPos = gridToWorld(road.position)
  
  // Determine road type based on connections
  const { north, south, east, west, connCount, modelPath, rotation } = useMemo(() => {
    const n = connections.has(gridPositionToKey({ x: road.position.x, z: road.position.z - 1 }))
    const s = connections.has(gridPositionToKey({ x: road.position.x, z: road.position.z + 1 }))
    const e = connections.has(gridPositionToKey({ x: road.position.x + 1, z: road.position.z }))
    const w = connections.has(gridPositionToKey({ x: road.position.x - 1, z: road.position.z }))
    
    const count = [n, s, e, w].filter(Boolean).length
    
    // Determine model and rotation based on connections
    let path = ROAD_MODELS.straight
    let rot = 0
    
    if (count === 4) {
      // Intersection (4-way)
      path = ROAD_MODELS.intersection
      rot = 0
    } else if (count === 3) {
      // T-junction (split)
      path = ROAD_MODELS.split
      // Model varsayımı: 0 derecede T'nin üstü Kuzey'e bakar (West-North-East) yani Güney boştur.
      // VEYA: Modelin düz kısmı N-S, çıkıntısı E (N-S-E, Batı boş).
      // Genelde "split" modellerinde düz yol Z ekseninde, çıkıntı X eksenindedir.
      
      // Deneme 1: 0 derece = N-S-E (Batı Boş)
      if (!west) rot = 0       // Batı boş (N-S-E)
      else if (!north) rot = 90 // Kuzey boş (E-S-W)
      else if (!east) rot = 180 // Doğu boş (S-N-W)
      else if (!south) rot = 270 // Güney boş (W-N-E)
      
    } else if (count === 2) {
      if ((n && s) || (e && w)) {
        // Straight road
        path = ROAD_MODELS.straight_lightposts
        rot = (e && w) ? 90 : 0
      } else {
        // Corner
        path = ROAD_MODELS.corner
        // Deneme 1: 0 derece = N-E (Kuzey-Doğu)
        // Eğer olmadıysa 90 derece kaydıracağız
        if (n && e) rot = 0        // Kuzey-Doğu
        else if (e && s) rot = 90  // Doğu-Güney
        else if (s && w) rot = 180 // Güney-Batı
        else if (w && n) rot = 270 // Batı-Kuzey
      }
    } else if (count === 1) {
      // Dead end - use straight
      path = ROAD_MODELS.straight
      rot = (e || w) ? 90 : 0
    } else {
      // Isolated
      path = ROAD_MODELS.straight
    }
    
    return {
      north: n,
      south: s,
      east: e,
      west: w,
      connCount: count,
      modelPath: path,
      rotation: rot,
    }
  }, [road.position, connections])
  
  return (
    <Suspense fallback={
      <Box 
        args={[TILE_SIZE * 0.9, 0.04, TILE_SIZE * 0.9]} 
        position={[worldPos.x + TILE_SIZE / 2, 0, worldPos.z + TILE_SIZE / 2]}
      >
        <meshStandardMaterial color="#4a5568" />
      </Box>
    }>
      <RoadModel 
        modelPath={modelPath}
        position={[worldPos.x + TILE_SIZE / 2, 0, worldPos.z + TILE_SIZE / 2]}
        rotation={rotation}
      />
    </Suspense>
  )
}

export function RoadRenderer() {
  const roads = useCityStore((state) => state.roads)
  
  // Convert roads map to array and build connection set
  const { roadArray, connectionSet } = useMemo(() => {
    const roadArray = Array.from(roads.values())
    const connectionSet = new Set(roadArray.map(r => gridPositionToKey(r.position)))
    return { roadArray, connectionSet }
  }, [roads])
  
  return (
    <group name="roads">
      {roadArray.map((road) => (
        <RoadSegment
          key={road.id}
          road={road}
          connections={connectionSet}
        />
      ))}
    </group>
  )
}
