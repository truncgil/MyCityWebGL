'use client'

import { useMemo, useRef, useEffect } from 'react'
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

// Lane offset from center - right-hand traffic
const LANE_OFFSET = 0.18

// ==========================================
// Helper: Get road center position
// ==========================================
function getRoadCenter(road: Road): THREE.Vector3 {
  const worldPos = gridToWorld(road.position)
  return new THREE.Vector3(
    worldPos.x + TILE_SIZE / 2,
    0.02,
    worldPos.z + TILE_SIZE / 2
  )
}

// ==========================================
// Helper: Calculate lane position based on direction
// ==========================================
function getLanePosition(
  from: THREE.Vector3,
  to: THREE.Vector3,
  laneOffset: number
): THREE.Vector3 {
  const direction = new THREE.Vector3().subVectors(to, from).normalize()
  // Perpendicular vector (right side)
  const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x)
  return new THREE.Vector3().copy(to).addScaledVector(perpendicular, laneOffset)
}

// ==========================================
// Individual Car Component
// ==========================================

interface CarProps {
  carId: string
  modelPath: string
  roadsRef: React.MutableRefObject<Road[]>
}

function Car({ carId, modelPath, roadsRef }: CarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(modelPath)
  
  const clonedScene = useMemo(() => scene.clone(), [scene])
  
  // Car state
  const carState = useRef({
    currentRoadId: '',
    nextRoadId: '',
    fromPosition: new THREE.Vector3(),
    toPosition: new THREE.Vector3(),
    progress: 0,
    speed: 0.8 + Math.random() * 0.6,
    isMoving: true,
    initialized: false,
  })

  // Initialize
  useEffect(() => {
    if (carState.current.initialized) return
    
    const roads = roadsRef.current
    if (roads.length === 0) return
    
    const startRoad = roads[Math.floor(Math.random() * roads.length)]
    if (!startRoad) return
    
    carState.current.currentRoadId = startRoad.id
    carState.current.initialized = true
    
    const center = getRoadCenter(startRoad)
    carState.current.fromPosition.copy(center)
    carState.current.toPosition.copy(center)
    
    if (groupRef.current) {
      groupRef.current.position.copy(center)
    }
  }, [roadsRef])

  useFrame((_, delta) => {
    if (!groupRef.current || !carState.current.isMoving) return
    
    const roads = roadsRef.current
    const state = carState.current

    const currentRoad = roads.find(r => r.id === state.currentRoadId)
    
    if (!currentRoad) {
      if (roads.length > 0) {
        const newRoad = roads[Math.floor(Math.random() * roads.length)]
        state.currentRoadId = newRoad.id
        const center = getRoadCenter(newRoad)
        state.fromPosition.copy(center)
        state.toPosition.copy(center)
        state.progress = 0
        groupRef.current.position.copy(center)
      }
      return
    }

    // Progress along current segment
    state.progress += delta * state.speed

    if (state.progress >= 1) {
      // Arrived at destination, pick next road
      state.progress = 0
      state.fromPosition.copy(state.toPosition)
      
      if (currentRoad.connections && currentRoad.connections.length > 0) {
        // Pick a random connection (avoid going back)
        const connections = currentRoad.connections.filter(conn => {
          const [cx, cz] = conn.connectedTo.split(',').map(Number)
          const connRoad = roads.find(r => r.position.x === cx && r.position.z === cz)
          return connRoad && connRoad.id !== state.nextRoadId
        })
        
        const useConnections = connections.length > 0 ? connections : currentRoad.connections
        const nextConn = useConnections[Math.floor(Math.random() * useConnections.length)]
        
        if (nextConn) {
          const [cx, cz] = nextConn.connectedTo.split(',').map(Number)
          const nextRoad = roads.find(r => r.position.x === cx && r.position.z === cz)
          
          if (nextRoad) {
            state.nextRoadId = state.currentRoadId
            state.currentRoadId = nextRoad.id
            
            const nextCenter = getRoadCenter(nextRoad)
            // Apply lane offset based on movement direction
            state.toPosition.copy(
              getLanePosition(state.fromPosition, nextCenter, LANE_OFFSET)
            )
          }
        }
      } else {
        // Dead end - stay in place or reverse
        state.progress = 0
      }
    }

    // Interpolate position
    const t = Math.min(state.progress, 1)
    groupRef.current.position.lerpVectors(state.fromPosition, state.toPosition, t)
    
    // Rotate towards movement direction
    const moveDir = new THREE.Vector3().subVectors(state.toPosition, state.fromPosition)
    if (moveDir.lengthSq() > 0.001) {
      const targetAngle = Math.atan2(moveDir.x, moveDir.z)
      const currentAngle = groupRef.current.rotation.y
      
      // Smooth rotation
      let angleDiff = targetAngle - currentAngle
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
      
      groupRef.current.rotation.y += angleDiff * delta * 8
    }
  })

  return (
    <primitive 
      ref={groupRef}
      object={clonedScene}
      scale={[0.15, 0.15, 0.15]}
    />
  )
}

// ==========================================
// Traffic Manager System
// ==========================================

interface CarData {
  id: string
  modelPath: string
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
  
  // Calculate target car count based on road count
  const roadCount = roads.size
  const targetCarCount = Math.min(25, Math.max(0, Math.floor(roadCount / 3)))
  
  // Add cars incrementally when roads increase
  useEffect(() => {
    const currentCarCount = carsRef.current.length
    
    if (targetCarCount > currentCarCount) {
      const newCars: CarData[] = []
      for (let i = currentCarCount; i < targetCarCount; i++) {
        newCars.push({
          id: `car-${Date.now()}-${i}`,
          modelPath: CAR_MODELS[Math.floor(Math.random() * CAR_MODELS.length)],
        })
      }
      carsRef.current = [...carsRef.current, ...newCars]
    }
  }, [roadCount, targetCarCount])
  
  const cars = carsRef.current

  if (roadCount === 0) return null

  return (
    <group>
      {cars.map((car) => (
        <Car 
          key={car.id}
          carId={car.id}
          modelPath={car.modelPath}
          roadsRef={roadsRef}
        />
      ))}
    </group>
  )
}
