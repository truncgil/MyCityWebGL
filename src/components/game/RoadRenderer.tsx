'use client'

import { useMemo, Suspense } from 'react'
import { Box, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

import { useCityStore } from '@/stores/cityStore'
import { useGameStore } from '@/stores/gameStore'
import { Road } from '@/types/simulation.types'
import { ROAD_MODELS } from '@/types/building.types'
import { TILE_SIZE } from '@/lib/constants'
import { gridToWorld, gridPositionToKey } from '@/lib/utils'

// Preload road models
Object.values(ROAD_MODELS).forEach((path) => {
  useGLTF.preload(path)
})

// Road model component
function RoadModel({ 
  modelPath, 
  position, 
  rotation = 0,
}: { 
  modelPath: string
  position: [number, number, number]
  rotation?: number
}) {
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
}

// Road segment component
function RoadSegment({ road, connections }: { road: Road; connections: Set<string> }) {
  const worldPos = gridToWorld(road.position)
  
  // Determine road type based on connections
  const { modelPath, rotation } = useMemo(() => {
    const n = connections.has(gridPositionToKey({ x: road.position.x, z: road.position.z - 1 }))
    const s = connections.has(gridPositionToKey({ x: road.position.x, z: road.position.z + 1 }))
    const e = connections.has(gridPositionToKey({ x: road.position.x + 1, z: road.position.z }))
    const w = connections.has(gridPositionToKey({ x: road.position.x - 1, z: road.position.z }))
    
    const count = [n, s, e, w].filter(Boolean).length

    // Determine model and rotation based on connections
    let path = ROAD_MODELS.straight
    let rot = 0
    
    if (count === 4) {
      path = ROAD_MODELS.intersection
      rot = 0
    } else if (count === 3) {
      path = ROAD_MODELS.split
      if (!e) rot = 0
      else if (!n) rot = 90
      else if (!w) rot = 180
      else if (!s) rot = 270
    } else if (count === 2) {
      if ((n && s) || (e && w)) {
        // Use straight road without lightposts for cleaner look
        path = ROAD_MODELS.straight
        rot = (e && w) ? 90 : 0
      } else {
        path = ROAD_MODELS.corner
        if (n && e) rot = 180
        else if (e && s) rot = 90
        else if (s && w) rot = 0
        else if (w && n) rot = 270
      }
    } else if (count === 1) {
      path = ROAD_MODELS.straight
      rot = (e || w) ? 90 : 0
    } else {
      path = ROAD_MODELS.straight
    }
    
    return { modelPath: path, rotation: rot }
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

// Power station lights - roads near power plants are lit
function PoweredStreetLights({ roads, isNight }: { roads: Road[]; isNight: boolean }) {
  const buildings = useCityStore((state) => state.buildings)
  
  const lightPositions = useMemo(() => {
    if (!isNight || roads.length === 0) return []
    
    // Find power plants
    const powerPlants = Array.from(buildings.values()).filter(b => 
      b.definitionId === 'power_plant' && b.isActive
    )
    
    if (powerPlants.length === 0) return []
    
    // Find roads within power plant radius
    const litRoads: Road[] = []
    
    for (const road of roads) {
      for (const plant of powerPlants) {
        const dx = road.position.x - plant.position.x
        const dz = road.position.z - plant.position.z
        const distance = Math.sqrt(dx * dx + dz * dz)
        
        if (distance <= 15) { // Power plant service radius
          litRoads.push(road)
          break
        }
      }
    }
    
    // Pick every 5th road for a light (within powered area)
    const selectedRoads: Road[] = []
    for (let i = 0; i < litRoads.length; i += 5) {
      selectedRoads.push(litRoads[i])
    }
    
    // Limit to max 10 lights
    const finalRoads = selectedRoads.slice(0, 10)
    
    return finalRoads.map(road => {
      const worldPos = gridToWorld(road.position)
      return [worldPos.x + TILE_SIZE / 2, 1.0, worldPos.z + TILE_SIZE / 2] as [number, number, number]
    })
  }, [roads, isNight, buildings])
  
  if (!isNight || lightPositions.length === 0) return null
  
  return (
    <group name="powered-street-lights">
      {lightPositions.map((pos, i) => (
        <pointLight
          key={i}
          position={pos}
          color="#ffdd99"
          intensity={1.5}
          distance={6}
          decay={2}
        />
      ))}
    </group>
  )
}

export function RoadRenderer() {
  const roads = useCityStore((state) => state.roads)
  const gameTime = useGameStore((state) => state.gameTime)
  
  const isNight = !gameTime.isDaytime
  
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
      {/* Street lights only where power is available */}
      <PoweredStreetLights roads={roadArray} isNight={isNight} />
    </group>
  )
}
