'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '@/stores/gameStore'

import { useCityStore } from '@/stores/cityStore'

export function GameLoop() {
  const advanceTime = useGameStore((state) => state.advanceTime)
  const gameTime = useGameStore((state) => state.gameTime)
  const isPaused = useGameStore((state) => state.isPaused)
  
  const simulateCity = useCityStore((state) => state.simulateCity)
  
  // Accumulate time to advance minutes correctly
  // 1 game minute = X real seconds based on speed
  const accumulatorRef = useRef(0)
  const lastHourRef = useRef(gameTime.hour)
  
  useFrame((state, delta) => {
    if (isPaused) return
    
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
      
      // Check if hour changed to run simulation
      // We need to access the NEW time, but state update is async/batched.
      // However, we can track total minutes passed.
      // Better: Just check if store's current hour != lastHourRef
      const currentHour = useGameStore.getState().gameTime.hour
      if (currentHour !== lastHourRef.current) {
         simulateCity()
         lastHourRef.current = currentHour
      }
    }
  })
  
  return null
}
