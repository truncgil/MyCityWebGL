import { ISimulationSystem, GameTime } from '@/types/game.types'
import { GameLoop, getGameLoop, destroyGameLoop } from './GameLoop'
import { EventBus, GameEvents } from './EventBus'
import { useGameStore } from '@/stores/gameStore'
import { useCityStore } from '@/stores/cityStore'

/**
 * Main game engine that coordinates all systems
 */
export class GameEngine {
  private static instance: GameEngine | null = null
  
  private gameLoop: GameLoop
  private systems: Map<string, ISimulationSystem> = new Map()
  private isInitialized = false
  
  private constructor() {
    this.gameLoop = getGameLoop()
    this.setupGameLoop()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): GameEngine {
    if (!GameEngine.instance) {
      GameEngine.instance = new GameEngine()
    }
    return GameEngine.instance
  }

  /**
   * Destroy instance
   */
  static destroy(): void {
    if (GameEngine.instance) {
      GameEngine.instance.shutdown()
      GameEngine.instance = null
    }
  }

  /**
   * Setup game loop callbacks
   */
  private setupGameLoop(): void {
    // Update callback
    this.gameLoop.onUpdate((delta) => {
      this.update(delta)
    })

    // Game minute callback
    this.gameLoop.setOnGameMinute(() => {
      this.advanceGameTime()
    })
  }

  /**
   * Initialize the engine
   */
  initialize(): void {
    if (this.isInitialized) return

    // Initialize grid if needed
    const cityStore = useCityStore.getState()
    if (cityStore.tiles.size === 0) {
      cityStore.initializeGrid()
    }

    // Start game loop
    this.gameLoop.start()
    this.isInitialized = true

    console.log('[GameEngine] Initialized')
  }

  /**
   * Shutdown the engine
   */
  shutdown(): void {
    this.gameLoop.stop()
    this.systems.clear()
    destroyGameLoop()
    EventBus.clear()
    this.isInitialized = false

    console.log('[GameEngine] Shutdown')
  }

  /**
   * Register a simulation system
   */
  registerSystem(system: ISimulationSystem): void {
    if (this.systems.has(system.name)) {
      console.warn(`[GameEngine] System "${system.name}" already registered`)
      return
    }

    this.systems.set(system.name, system)
    console.log(`[GameEngine] Registered system: ${system.name}`)
  }

  /**
   * Unregister a simulation system
   */
  unregisterSystem(name: string): void {
    this.systems.delete(name)
  }

  /**
   * Get a system by name
   */
  getSystem<T extends ISimulationSystem>(name: string): T | undefined {
    return this.systems.get(name) as T | undefined
  }

  /**
   * Get all registered systems
   */
  getSystems(): ISimulationSystem[] {
    return Array.from(this.systems.values())
  }

  /**
   * Main update loop
   */
  private update(delta: number): void {
    const gameTime = useGameStore.getState().gameTime

    // Update systems by priority
    const sortedSystems = Array.from(this.systems.values())
      .filter((s) => s.enabled)
      .sort((a, b) => a.priority - b.priority)

    for (const system of sortedSystems) {
      try {
        system.update(delta, gameTime)
      } catch (error) {
        console.error(`[GameEngine] Error in system "${system.name}":`, error)
      }
    }
  }

  /**
   * Advance game time by one minute
   */
  private advanceGameTime(): void {
    const { advanceTime, gameTime } = useGameStore.getState()
    advanceTime(1)

    // Publish time event
    GameEvents.timeChanged({
      day: gameTime.day,
      hour: gameTime.hour,
      minute: gameTime.minute,
    })
  }

  /**
   * Set game speed
   */
  setSpeed(speed: 'paused' | 'normal' | 'fast' | 'ultra'): void {
    this.gameLoop.setSpeed(speed)
    useGameStore.getState().setGameSpeed(speed)
  }

  /**
   * Pause the game
   */
  pause(): void {
    this.gameLoop.setPaused(true)
    useGameStore.getState().setGameSpeed('paused')
  }

  /**
   * Resume the game
   */
  resume(): void {
    this.gameLoop.setPaused(false)
    useGameStore.getState().setGameSpeed('normal')
  }

  /**
   * Toggle pause
   */
  togglePause(): void {
    const isPaused = useGameStore.getState().isPaused
    if (isPaused) {
      this.resume()
    } else {
      this.pause()
    }
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.gameLoop.getFPS()
  }

  /**
   * Save game
   */
  saveGame(): void {
    const cityStore = useCityStore.getState()
    const saveData = cityStore.save()
    GameEvents.gameSaved()
    console.log('[GameEngine] Game saved', saveData)
  }

  /**
   * Load game
   */
  loadGame(): boolean {
    const cityStore = useCityStore.getState()
    const saveKey = 'mycity_save'
    const saved = localStorage.getItem(saveKey)

    if (!saved) {
      console.log('[GameEngine] No save data found')
      return false
    }

    try {
      const saveData = JSON.parse(saved)
      cityStore.load(saveData)
      GameEvents.gameLoaded()
      console.log('[GameEngine] Game loaded')
      return true
    } catch (error) {
      console.error('[GameEngine] Failed to load game:', error)
      return false
    }
  }

  /**
   * Reset game
   */
  resetGame(): void {
    const cityStore = useCityStore.getState()
    const gameStore = useGameStore.getState()

    cityStore.reset()
    gameStore.reset()

    // Reset all systems
    this.systems.forEach((system) => system.reset())

    GameEvents.gameReset()
    console.log('[GameEngine] Game reset')
  }

  /**
   * Check if engine is initialized
   */
  isReady(): boolean {
    return this.isInitialized
  }
}

// Export singleton getter
export function getGameEngine(): GameEngine {
  return GameEngine.getInstance()
}
