'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useCityStore } from '@/stores/cityStore'
import { gridToWorld } from '@/lib/utils'
import { Road } from '@/types/simulation.types'
import { TILE_SIZE } from '@/lib/constants'

// ==========================================
// Car Models Configuration
// ==========================================

const CAR_MODELS = [
  '/models/car/ambulance.glb',
  '/models/car/delivery.glb',
  '/models/car/delivery-flat.glb',
  '/models/car/firetruck.glb',
  '/models/car/garbage-truck.glb',
  '/models/car/hatchback-sports.glb',
  '/models/car/police.glb',
  '/models/car/sedan.glb',
  '/models/car/sedan-sports.glb',
  '/models/car/suv.glb',
  '/models/car/suv-luxury.glb',
  '/models/car/taxi.glb',
  '/models/car/truck.glb',
  '/models/car/truck-flat.glb',
]

// Preload models
CAR_MODELS.forEach((path) => {
  useGLTF.preload(path)
})

// ==========================================
// Individual Car Component
// ==========================================

interface CarProps {
  initialRoad: Road
  roads: Road[]
  modelPath: string
}

function Car({ initialRoad, roads, modelPath }: CarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(modelPath)
  
  // Clone scene for each instance
  const clonedScene = useMemo(() => scene.clone(), [scene])
  
  // Car state ref
  const carState = useRef({
    currentRoadId: initialRoad.id,
    targetPosition: new THREE.Vector3(),
    currentPosition: new THREE.Vector3(),
    progress: 0,
    speed: 1.5 + Math.random() * 1.5, // Random speed
    offset: (Math.random() - 0.5) * 0.25, // Lane offset
    isMoving: true,
  })

  // Initialize position
  useEffect(() => {
    const worldPos = gridToWorld(initialRoad.position)
    carState.current.currentPosition.set(
      worldPos.x + TILE_SIZE / 2 + carState.current.offset, 
      0, 
      worldPos.z + TILE_SIZE / 2 + carState.current.offset
    )
    carState.current.targetPosition.copy(carState.current.currentPosition)
    
    if (groupRef.current) {
      groupRef.current.position.copy(carState.current.currentPosition)
    }
  }, [initialRoad])

  useFrame((_, delta) => {
    if (!groupRef.current || !carState.current.isMoving) return

    const state = carState.current

    // Find current road object from latest roads array
    const currentRoad = roads.find(r => r.id === state.currentRoadId)
    
    // If road deleted or invalid, remove car (or stop it)
    if (!currentRoad) {
      state.isMoving = false
      return
    }

    // Movement Logic
    if (state.progress >= 1) {
      // Reached destination, find next road
      state.progress = 0
      state.currentPosition.copy(state.targetPosition)
      
      if (currentRoad.connections && currentRoad.connections.length > 0) {
        // Pick random connection
        const nextConn = currentRoad.connections[Math.floor(Math.random() * currentRoad.connections.length)]
        
        if (nextConn) {
          const [cx, cz] = nextConn.connectedTo.split(',').map(Number)
          const nextRoad = roads.find(r => r.position.x === cx && r.position.z === cz)
          
          if (nextRoad) {
            state.currentRoadId = nextRoad.id
            const nextWorldPos = gridToWorld(nextRoad.position)
            state.targetPosition.set(
              nextWorldPos.x + TILE_SIZE / 2 + state.offset,
              0,
              nextWorldPos.z + TILE_SIZE / 2 + state.offset
            )
            
            // Orient car towards target immediately (or lerp rotation for smoothness)
            groupRef.current.lookAt(state.targetPosition)
          } else {
            state.progress = 0
          }
        }
      } else {
        state.progress = 0
      }
    } else {
      // Move towards target
      state.progress += delta * state.speed * 0.5
      
      // Ensure targetPosition is valid Vector3 before distanceToSq
      if (state.targetPosition instanceof THREE.Vector3) {
        if (state.targetPosition.distanceToSq(state.currentPosition) > 0.01) {
          const newPos = new THREE.Vector3().copy(state.currentPosition)
          newPos.lerp(state.targetPosition, Math.min(state.progress, 1))
          groupRef.current.position.copy(newPos)
        }
      }
    }
  })

  return (
    <primitive 
      ref={groupRef}
      object={clonedScene}
      scale={[0.3, 0.3, 0.3]} // Scale down cars to fit
    />
  )
}

// ==========================================
// Traffic Manager System
// ==========================================

export function TrafficSystem() {
  const roads = useCityStore((state) => state.roads)
  const roadArray = useMemo(() => Array.from(roads.values()), [roads])
  
  // Create fixed number of cars
  const cars = useMemo(() => {
    if (roadArray.length === 0) return []
    
    const carCount = Math.min(15, roadArray.length) // Max 15 cars, or 1 per road if less
    
    return Array.from({ length: carCount }).map((_, i) => {
      // Pick random starting road
      const startRoad = roadArray[Math.floor(Math.random() * roadArray.length)]
      // Pick random model
      const model = CAR_MODELS[Math.floor(Math.random() * CAR_MODELS.length)]
      
      return {
        id: `car-${i}`,
        initialRoad: startRoad,
        modelPath: model
      }
    })
  }, [roadArray.length]) 

  if (roadArray.length === 0) return null

  return (
    <group>
      {cars.map((car) => (
        <Car 
          key={car.id} 
          initialRoad={car.initialRoad} 
          roads={roadArray} // Pass latest roads for navigation
          modelPath={car.modelPath}
        />
      ))}
    </group>
  )
}
