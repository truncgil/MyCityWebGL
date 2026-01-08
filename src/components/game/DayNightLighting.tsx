'use client'

import { useRef } from 'react'
import * as THREE from 'three'

import {
  AMBIENT_LIGHT_DAY,
  DIRECTIONAL_LIGHT_DAY,
} from '@/lib/constants'

interface DayNightLightingProps {
  isDaytime: boolean
  hour: number
}

/**
 * Always bright daylight lighting with fixed sun position
 * Sun always comes from one side (top-right) for consistent shadows
 */
export function DayNightLighting({ isDaytime, hour }: DayNightLightingProps) {
  const directionalRef = useRef<THREE.DirectionalLight>(null)
  
  // Fixed sun position - always from top-right (diagonal from top-right corner)
  // This creates shadows on buildings consistently from one direction
  // Position: x=30, y=40, z=30 creates nice diagonal lighting
  const sunPosition = new THREE.Vector3(30, 40, 30)
  
  // Always use daytime colors and intensities
  const skyColor = new THREE.Color('#87CEEB') // Sky blue
  const groundColor = new THREE.Color('#3d5c3d') // Green ground
  
  return (
    <>
      {/* Ambient light for base illumination - always bright */}
      <ambientLight
        intensity={AMBIENT_LIGHT_DAY}
        color="#ffffff"
      />
      
      {/* Hemisphere light for sky/ground color - always daytime */}
      <hemisphereLight
        intensity={0.6}
        color={skyColor}
        groundColor={groundColor}
      />
      
      {/* Directional light for sun - always bright, fixed position for consistent shadows */}
      <directionalLight
        ref={directionalRef}
        position={sunPosition}
        intensity={DIRECTIONAL_LIGHT_DAY}
        color="#fff5db"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-camera-near={0.1}
        shadow-camera-far={300}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />
    </>
  )
}
