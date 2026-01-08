'use client'

import { useMemo, useRef, useEffect, useCallback } from 'react'
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

// Lane offset - right side driving
const LANE_OFFSET = 0.15

// ==========================================
// Individual Car Component
// ==========================================

interface CarProps {
  carId: string
  modelPath: string
  lane: 'left' | 'right' // Which lane the car drives in
  roadsRef: React.MutableRefObject<Road[]>
  initialPosition?: { roadId: string; progress: number }
}

function Car({ carId, modelPath, lane, roadsRef, initialPosition }: CarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(modelPath)
  
  // Clone scene for each instance
  const clonedScene = useMemo(() => scene.clone(), [scene])
  
  // Determine lane offset based on direction
  const laneOffset = lane === 'right' ? LANE_OFFSET : -LANE_OFFSET
  
  // Car state ref - persisted across renders
  const carState = useRef({
    currentRoadId: '',
    previousRoadId: '',
    targetPosition: new THREE.Vector3(),
    currentPosition: new THREE.Vector3(),
    progress: Math.random(), // Start at random progress
    speed: 1.2 + Math.random() * 1.0, // Random speed
    isMoving: true,
    initialized: false,
    direction: new THREE.Vector3(),
  })

  // Initialize position only once
  useEffect(() => {
    if (carState.current.initialized) return
    
    const roads = roadsRef.current
    if (roads.length === 0) return
    
    // Pick a random road to start
    const startRoad = roads[Math.floor(Math.random() * roads.length)]
    if (!startRoad) return
    
    carState.current.currentRoadId = startRoad.id
    carState.current.initialized = true
    
    const worldPos = gridToWorld(startRoad.position)
    carState.current.currentPosition.set(
      worldPos.x + TILE_SIZE / 2,
      0.02,
      worldPos.z + TILE_SIZE / 2
    )
    carState.current.targetPosition.copy(carState.current.currentPosition)
    
    if (groupRef.current) {
      groupRef.current.position.copy(carState.current.currentPosition)
    }
  }, [roadsRef, laneOffset])

  useFrame((_, delta) => {
    if (!groupRef.current || !carState.current.isMoving) return
    
    const roads = roadsRef.current
    const state = carState.current

    // Find current road object from latest roads array
    const currentRoad = roads.find(r => r.id === state.currentRoadId)
    
    // If road deleted, try to find another road
    if (!currentRoad) {
      if (roads.length > 0) {
        const newRoad = roads[Math.floor(Math.random() * roads.length)]
        state.currentRoadId = newRoad.id
        const worldPos = gridToWorld(newRoad.position)
        state.currentPosition.set(worldPos.x + TILE_SIZE / 2, 0.02, worldPos.z + TILE_SIZE / 2)
        state.targetPosition.copy(state.currentPosition)
        state.progress = 0
      } else {
        state.isMoving = false
      }
      return
    }

    // Movement Logic
    if (state.progress >= 1) {
      // Reached destination, find next road
      state.progress = 0
      state.currentPosition.copy(state.targetPosition)
      state.previousRoadId = state.currentRoadId
      
      if (currentRoad.connections && currentRoad.connections.length > 0) {
        // Filter out the road we came from to avoid U-turns (unless it's the only option)
        const validConnections = currentRoad.connections.filter(
          conn => {
            const [cx, cz] = conn.connectedTo.split(',').map(Number)
            const connRoad = roads.find(r => r.position.x === cx && r.position.z === cz)
            return connRoad && connRoad.id !== state.previousRoadId
          }
        )
        
        const connectionsToUse = validConnections.length > 0 ? validConnections : currentRoad.connections
        const nextConn = connectionsToUse[Math.floor(Math.random() * connectionsToUse.length)]
        
        if (nextConn) {
          const [cx, cz] = nextConn.connectedTo.split(',').map(Number)
          const nextRoad = roads.find(r => r.position.x === cx && r.position.z === cz)
          
          if (nextRoad) {
            state.currentRoadId = nextRoad.id
            const nextWorldPos = gridToWorld(nextRoad.position)
            
            // Calculate direction for lane offset
            const baseTarget = new THREE.Vector3(
              nextWorldPos.x + TILE_SIZE / 2,
              0.02,
              nextWorldPos.z + TILE_SIZE / 2
            )
            
            // Calculate perpendicular offset for lane
            state.direction.subVectors(baseTarget, state.currentPosition).normalize()
            const perpendicular = new THREE.Vector3(-state.direction.z, 0, state.direction.x)
            
            state.targetPosition.copy(baseTarget).addScaledVector(perpendicular, laneOffset)
          }
        }
      }
    } else {
      // Move towards target
      state.progress += delta * state.speed * 0.5
      
      const t = Math.min(state.progress, 1)
      
      // Smooth interpolation
      groupRef.current.position.lerpVectors(state.currentPosition, state.targetPosition, t)
      
      // Smooth rotation towards target
      if (state.targetPosition.distanceTo(state.currentPosition) > 0.1) {
        const lookTarget = new THREE.Vector3().copy(state.targetPosition)
        lookTarget.y = groupRef.current.position.y
        
        const targetQuaternion = new THREE.Quaternion()
        const matrix = new THREE.Matrix4().lookAt(groupRef.current.position, lookTarget, new THREE.Vector3(0, 1, 0))
        targetQuaternion.setFromRotationMatrix(matrix)
        
        groupRef.current.quaternion.slerp(targetQuaternion, delta * 5)
      }
    }
  })

  return (
    <primitive 
      ref={groupRef}
      object={clonedScene}
      scale={[0.15, 0.15, 0.15]} // Halved from 0.3
    />
  )
}

// ==========================================
// Traffic Manager System
// ==========================================

interface CarData {
  id: string
  modelPath: string
  lane: 'left' | 'right'
}

export function TrafficSystem() {
  const roads = useCityStore((state) => state.roads)
  
  // Keep roads in a ref to avoid re-creating cars when roads change
  const roadsRef = useRef<Road[]>([])
  
  // Update roadsRef when roads change
  useEffect(() => {
    roadsRef.current = Array.from(roads.values())
  }, [roads])
  
  // Stable car list - only add new cars, never reset existing ones
  const carsRef = useRef<CarData[]>([])
  const lastRoadCount = useRef(0)
  
  // Calculate target car count based on road count
  const roadCount = roads.size
  const targetCarCount = Math.min(30, Math.max(0, Math.floor(roadCount / 2)))
  
  // Add cars incrementally when roads increase
  useEffect(() => {
    const currentCarCount = carsRef.current.length
    
    if (targetCarCount > currentCarCount) {
      // Add new cars
      const newCars: CarData[] = []
      for (let i = currentCarCount; i < targetCarCount; i++) {
        newCars.push({
          id: `car-${Date.now()}-${i}`,
          modelPath: CAR_MODELS[Math.floor(Math.random() * CAR_MODELS.length)],
          lane: Math.random() > 0.5 ? 'right' : 'left',
        })
      }
      carsRef.current = [...carsRef.current, ...newCars]
    }
    
    lastRoadCount.current = roadCount
  }, [roadCount, targetCarCount])
  
  // Force re-render when cars change
  const cars = carsRef.current

  if (roadCount === 0) return null

  return (
    <group>
      {cars.map((car) => (
        <Car 
          key={car.id}
          carId={car.id}
          modelPath={car.modelPath}
          lane={car.lane}
          roadsRef={roadsRef}
        />
      ))}
    </group>
  )
}
