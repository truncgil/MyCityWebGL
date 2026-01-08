'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import {
  AMBIENT_LIGHT_DAY,
  AMBIENT_LIGHT_NIGHT,
  DIRECTIONAL_LIGHT_DAY,
  DIRECTIONAL_LIGHT_NIGHT,
  DAY_START_HOUR,
  DAY_END_HOUR,
} from '@/lib/constants'
import { lerp, smoothstep } from '@/lib/utils'

interface DayNightLightingProps {
  isDaytime: boolean
  hour: number
}

export function DayNightLighting({ isDaytime, hour }: DayNightLightingProps) {
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const directionalRef = useRef<THREE.DirectionalLight>(null)
  const hemisphereRef = useRef<THREE.HemisphereLight>(null)
  
  // Calculate light intensity based on hour
  const { ambientIntensity, directionalIntensity, sunPosition, skyColor, groundColor } = useMemo(() => {
    // Transition hours
    const sunriseStart = DAY_START_HOUR - 1 // 5
    const sunriseEnd = DAY_START_HOUR + 1   // 7
    const sunsetStart = DAY_END_HOUR - 1    // 19
    const sunsetEnd = DAY_END_HOUR + 1      // 21
    
    let dayFactor = 0
    
    if (hour >= sunriseStart && hour < sunriseEnd) {
      // Sunrise transition
      dayFactor = smoothstep(sunriseStart, sunriseEnd, hour)
    } else if (hour >= sunriseEnd && hour < sunsetStart) {
      // Full day
      dayFactor = 1
    } else if (hour >= sunsetStart && hour < sunsetEnd) {
      // Sunset transition
      dayFactor = 1 - smoothstep(sunsetStart, sunsetEnd, hour)
    } else {
      // Night
      dayFactor = 0
    }
    
    // Calculate sun position (simplified arc)
    const sunAngle = ((hour - 6) / 12) * Math.PI // 0 to PI from 6am to 6pm
    const sunY = Math.sin(sunAngle) * 50
    const sunX = Math.cos(sunAngle) * 50
    
    // Colors
    const daySky = new THREE.Color('#87CEEB')
    const nightSky = new THREE.Color('#0a1628')
    const dayGround = new THREE.Color('#3d5c3d')
    const nightGround = new THREE.Color('#1a1a2e')
    
    return {
      ambientIntensity: lerp(AMBIENT_LIGHT_NIGHT, AMBIENT_LIGHT_DAY, dayFactor),
      directionalIntensity: lerp(DIRECTIONAL_LIGHT_NIGHT, DIRECTIONAL_LIGHT_DAY, dayFactor),
      sunPosition: new THREE.Vector3(sunX, Math.max(sunY, 5), 30),
      skyColor: daySky.clone().lerp(nightSky, 1 - dayFactor),
      groundColor: dayGround.clone().lerp(nightGround, 1 - dayFactor),
    }
  }, [hour])
  
  // Animate light transitions
  useFrame((_, delta) => {
    if (ambientRef.current) {
      ambientRef.current.intensity = lerp(
        ambientRef.current.intensity,
        ambientIntensity,
        delta * 2
      )
    }
    
    if (directionalRef.current) {
      directionalRef.current.intensity = lerp(
        directionalRef.current.intensity,
        directionalIntensity,
        delta * 2
      )
      directionalRef.current.position.lerp(sunPosition, delta * 2)
    }
    
    if (hemisphereRef.current) {
      hemisphereRef.current.color.lerp(skyColor, delta * 2)
      hemisphereRef.current.groundColor.lerp(groundColor, delta * 2)
    }
  })
  
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight
        ref={ambientRef}
        intensity={ambientIntensity}
        color="#ffffff"
      />
      
      {/* Hemisphere light for sky/ground color */}
      <hemisphereLight
        ref={hemisphereRef}
        intensity={0.5}
        color={skyColor}
        groundColor={groundColor}
      />
      
      {/* Directional light for sun */}
      <directionalLight
        ref={directionalRef}
        position={sunPosition}
        intensity={directionalIntensity}
        color={isDaytime ? '#fff5db' : '#7f8c9a'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-near={0.1}
        shadow-camera-far={200}
        shadow-bias={-0.0001}
      />
      
      {/* Point lights for night (city lights effect) */}
      {!isDaytime && (
        <>
          <pointLight
            position={[0, 10, 0]}
            intensity={0.3}
            color="#ffa500"
            distance={50}
          />
          <pointLight
            position={[20, 5, 20]}
            intensity={0.2}
            color="#ffff00"
            distance={30}
          />
          <pointLight
            position={[-20, 5, -20]}
            intensity={0.2}
            color="#ffff00"
            distance={30}
          />
        </>
      )}
    </>
  )
}
