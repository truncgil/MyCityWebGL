'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '@/stores/gameStore'

export function GameLoop() {
  const advanceTime = useGameStore((state) => state.advanceTime)
  const gameTime = useGameStore((state) => state.gameTime)
  const isPaused = useGameStore((state) => state.isPaused)
  
  // Accumulate time to advance minutes correctly
  // 1 game minute = X real seconds based on speed
  const accumulatorRef = useRef(0)
  
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
    
    // If enough time passed (e.g. > 1/60th of a second for smooth updates, 
    // but here we just want to tick minutes)
    // Let's say 1 real second = 60 game minutes at normal speed? 
    // Or 1 real second = 1 game minute? 
    // Let's go with 1 real second = 1 game minute for 'normal' speed.
    
    if (accumulatorRef.current >= 1) {
      const minutesToAdvance = Math.floor(accumulatorRef.current)
      advanceTime(minutesToAdvance)
      accumulatorRef.current -= minutesToAdvance
    }
  })
  
  return null
}
