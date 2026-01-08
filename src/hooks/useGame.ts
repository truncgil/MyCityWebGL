'use client'

import { useEffect, useCallback, useRef } from 'react'
import { getGameEngine, GameEngine } from '@/game/core/GameEngine'
import { getInputManager } from '@/game/core/InputManager'
import { SimulationManager } from '@/game/simulation/SimulationManager'
import { EconomySystem } from '@/game/simulation/EconomySystem'
import { ZoningSystem } from '@/game/simulation/ZoningSystem'
import { PopulationSystem } from '@/game/simulation/PopulationSystem'
import { TrafficSystem } from '@/game/simulation/TrafficSystem'
import { TimeSystem } from '@/game/simulation/TimeSystem'
import { useGameStore } from '@/stores/gameStore'
import { useCityStore } from '@/stores/cityStore'

/**
 * Hook for initializing and managing the game engine
 */
export function useGame() {
  const engineRef = useRef<GameEngine | null>(null)
  const initializedRef = useRef(false)

  const isPaused = useGameStore((state) => state.isPaused)
  const gameTime = useGameStore((state) => state.gameTime)

  // Initialize game
  const initialize = useCallback(() => {
    if (initializedRef.current) return

    console.log('[useGame] Initializing...')

    // Get engine instance
    const engine = getGameEngine()
    engineRef.current = engine

    // Register simulation systems
    const simManager = SimulationManager.getInstance()
    
    simManager.register(new TimeSystem())
    simManager.register(new EconomySystem())
    simManager.register(new ZoningSystem())
    simManager.register(new PopulationSystem())
    simManager.register(new TrafficSystem())

    // Register systems with engine
    simManager.getSystems = () => {
      const systems: any[] = []
      // Get all registered systems
      return systems
    }

    // Initialize engine
    engine.initialize()

    // Initialize input manager
    getInputManager()

    initializedRef.current = true
    console.log('[useGame] Initialized')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    initialize()

    return () => {
      if (engineRef.current) {
        GameEngine.destroy()
        engineRef.current = null
        initializedRef.current = false
      }
    }
  }, [initialize])

  // Pause/resume based on state
  useEffect(() => {
    if (!engineRef.current) return

    if (isPaused) {
      engineRef.current.pause()
    } else {
      engineRef.current.resume()
    }
  }, [isPaused])

  return {
    engine: engineRef.current,
    isReady: initializedRef.current,
    isPaused,
    gameTime,
  }
}

/**
 * Hook for game controls
 */
export function useGameControls() {
  const setMode = useGameStore((state) => state.setMode)
  const setSelectedBuilding = useGameStore((state) => state.setSelectedBuilding)
  const rotateBuilding = useGameStore((state) => state.rotateBuilding)
  const setGameSpeed = useGameStore((state) => state.setGameSpeed)
  const togglePause = useGameStore((state) => state.togglePause)

  const save = useCityStore((state) => state.save)
  const reset = useCityStore((state) => state.reset)

  const handleSave = useCallback(() => {
    save()
  }, [save])

  const handleReset = useCallback(() => {
    reset()
  }, [reset])

  return {
    setMode,
    setSelectedBuilding,
    rotateBuilding,
    setGameSpeed,
    togglePause,
    save: handleSave,
    reset: handleReset,
  }
}
