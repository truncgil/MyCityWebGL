'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '@/stores/gameStore'
import { useCityStore } from '@/stores/cityStore'
import { SimulationManager } from '@/game/simulation/SimulationManager'

export function GameLoop() {
  const advanceTime = useGameStore((state) => state.advanceTime)
  const gameTime = useGameStore((state) => state.gameTime)
  const isPaused = useGameStore((state) => state.isPaused)
  
  const simulateCity = useCityStore((state) => state.simulateCity)
  const simManagerRef = useRef(SimulationManager.getInstance())
  
  // Accumulate time to advance minutes correctly
  // 1 game minute = X real seconds based on speed
  const accumulatorRef = useRef(0)
  const lastHourRef = useRef(gameTime.hour)
  
  useFrame((state, delta) => {
    if (isPaused) return
    
    // Update simulation systems every frame with delta
    const simManager = simManagerRef.current
    simManager.update(delta, gameTime)
    
    // Speed multipliers
    // normal: 1 real sec = 1 game minute
    // fast: 1 real sec = 5 game minutes
    // ultra: 1 real sec = 15 game minutes
    let speedMultiplier = 1
    if (gameTime.speed === 'fast') speedMultiplier = 5
    if (gameTime.speed === 'ultra') speedMultiplier = 15
    
    accumulatorRef.current += delta * speedMultiplier
    
    if (accumulatorRef.current >= 1) {
      const minutesToAdvance = Math.floor(accumulatorRef.current)
      advanceTime(minutesToAdvance)
      accumulatorRef.current -= minutesToAdvance
      
      // Also call simulateCity for legacy building/utility updates
      const currentGameTime = useGameStore.getState().gameTime
      const currentHour = currentGameTime.hour
      if (currentHour !== lastHourRef.current) {
         simulateCity()
         lastHourRef.current = currentHour
      }
    }
  })
  
  return null
}
