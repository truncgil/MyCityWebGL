'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { useCityStore } from '@/stores/cityStore'
import { gridToWorld } from '@/lib/utils'
import { TILE_SIZE } from '@/lib/constants'
import { DEFAULT_BUILDINGS } from '@/types/building.types'

// Ground indicator for missing utilities
function GroundIndicator({ position, needsPower, needsWater }: { 
  position: [number, number, number]
  needsPower: boolean
  needsWater: boolean 
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      // Pulsing opacity
      const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.15
      const material = meshRef.current.material as THREE.MeshBasicMaterial
      material.opacity = pulse
    }
  })
  
  // Determine color based on what's missing
  let color = '#f59e0b' // Orange for power
  if (needsWater && !needsPower) color = '#3b82f6' // Blue for water only
  if (needsPower && needsWater) color = '#ef4444' // Red for both
  
  return (
    <mesh 
      ref={meshRef}
      position={position} 
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[TILE_SIZE * 0.8, TILE_SIZE * 0.8]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function StatusIcon({ position, type }: { position: [number, number, number], type: 'power' | 'water' }) {
  const ref = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })

  const color = type === 'power' ? '#f59e0b' : '#3b82f6'
  const icon = type === 'power' ? '⚡' : '💧'

  return (
    <group ref={ref} position={position}>
      <Billboard>
        <Text
          fontSize={0.35}
          color={color}
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {icon}
        </Text>
      </Billboard>
    </group>
  )
}

export function StatusOverlay() {
  const buildings = useCityStore((state) => state.buildings)
  const buildingArray = useMemo(() => Array.from(buildings.values()), [buildings])

  return (
    <group>
      {buildingArray.map((building) => {
        // Get building definition to check category
        const definition = DEFAULT_BUILDINGS.find(b => b.id === building.definitionId)
        
        // Skip if no definition found
        if (!definition) return null
        
        const category = definition.category
        
        // Skip utilities (power plant, water tower) - they provide services, don't need them
        if (category === 'utility') return null
        
        // Skip parks - they don't need power or water
        if (category === 'park') return null
        
        // Check what this building needs
        const needsPower = !building.isPowered
        const needsWater = !building.hasWater
        
        if (!needsPower && !needsWater) return null
        
        const worldPos = gridToWorld(building.position)
        const centerX = worldPos.x + TILE_SIZE / 2
        const centerZ = worldPos.z + TILE_SIZE / 2
        
        return (
          <group key={building.id}>
            {/* Ground indicator */}
            <GroundIndicator 
              position={[centerX, 0.03, centerZ]}
              needsPower={needsPower}
              needsWater={needsWater}
            />
            
            {/* Floating icons */}
            {needsPower && (
              <StatusIcon 
                type="power" 
                position={[centerX - 0.2, 1.2, centerZ]} 
              />
            )}
            {needsWater && (
              <StatusIcon 
                type="water" 
                position={[centerX + 0.2, 1.2, centerZ]} 
              />
            )}
          </group>
        )
      })}
    </group>
  )
}
