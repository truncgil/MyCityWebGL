'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { useCityStore } from '@/stores/cityStore'
import { gridToWorld } from '@/lib/utils'
import { TILE_SIZE } from '@/lib/constants'

function StatusIcon({ position, type }: { position: [number, number, number], type: 'power' | 'water' }) {
  // Simple floating icon
  const ref = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })

  const color = type === 'power' ? '#f6ad55' : '#4299e1' // Orange for power, Blue for water
  const icon = type === 'power' ? '⚡' : '💧'

  return (
    <group ref={ref} position={position}>
      <Billboard>
        <Text
          fontSize={0.5}
          color={color}
          outlineWidth={0.02}
          outlineColor="#ffffff"
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
        const issues = []
        if (!building.isPowered) issues.push('power')
        if (!building.hasWater) issues.push('water')
        
        if (issues.length === 0) return null
        
        const worldPos = gridToWorld(building.position)
        
        // Show only one issue at a time to avoid clutter? Or stack them?
        // Let's just show the first one for now or offset them.
        return (
          <group key={building.id}>
            {issues.map((issue, i) => (
              <StatusIcon 
                key={issue} 
                type={issue as 'power' | 'water'} 
                position={[
                  worldPos.x + TILE_SIZE / 2 + (i * 0.4), 
                  1.5, 
                  worldPos.z + TILE_SIZE / 2
                ]} 
              />
            ))}
          </group>
        )
      })}
    </group>
  )
}
