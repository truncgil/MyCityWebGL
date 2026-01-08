import { GAME_SPEEDS, TICK_RATE, GAME_MINUTE_MS } from '@/lib/constants'
import { GameSpeed } from '@/types/game.types'

type UpdateCallback = (delta: number) => void
type RenderCallback = (alpha: number) => void

/**
 * Fixed timestep game loop with interpolation support
 */
export class GameLoop {
  private isRunning = false
  private isPaused = false
  private gameSpeed: GameSpeed = 'normal'
  
  private lastTime = 0
  private accumulator = 0
  private gameTimeAccumulator = 0
  
  private updateCallbacks: Set<UpdateCallback> = new Set()
  private renderCallbacks: Set<RenderCallback> = new Set()
  
  // Fixed timestep (ms)
  private readonly fixedDelta = 1000 / TICK_RATE // ~16.67ms for 60fps
  
  // Stats
  private fps = 0
  private frameCount = 0
  private fpsTime = 0
  
  // Callbacks for game time
  private onGameMinute: (() => void) | null = null

  constructor() {
    this.loop = this.loop.bind(this)
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.lastTime = performance.now()
    this.accumulator = 0
    this.gameTimeAccumulator = 0
    
    requestAnimationFrame(this.loop)
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.isRunning = false
  }

  /**
   * Pause/unpause the game
   */
  setPaused(paused: boolean): void {
    this.isPaused = paused
  }

  /**
   * Set game speed
   */
  setSpeed(speed: GameSpeed): void {
    this.gameSpeed = speed
    this.isPaused = speed === 'paused'
  }

  /**
   * Register update callback (called at fixed timestep)
   */
  onUpdate(callback: UpdateCallback): () => void {
    this.updateCallbacks.add(callback)
    return () => this.updateCallbacks.delete(callback)
  }

  /**
   * Register render callback (called every frame)
   */
  onRender(callback: RenderCallback): () => void {
    this.renderCallbacks.add(callback)
    return () => this.renderCallbacks.delete(callback)
  }

  /**
   * Register game minute callback
   */
  setOnGameMinute(callback: () => void): void {
    this.onGameMinute = callback
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps
  }

  /**
   * Get current game speed
   */
  getSpeed(): GameSpeed {
    return this.gameSpeed
  }

  /**
   * Main game loop
   */
  private loop(currentTime: number): void {
    if (!this.isRunning) return

    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    // Calculate FPS
    this.frameCount++
    this.fpsTime += deltaTime
    if (this.fpsTime >= 1000) {
      this.fps = this.frameCount
      this.frameCount = 0
      this.fpsTime = 0
    }

    // Cap delta time to prevent spiral of death
    const cappedDelta = Math.min(deltaTime, this.fixedDelta * 5)

    // Accumulate time
    this.accumulator += cappedDelta

    // Fixed timestep updates
    while (this.accumulator >= this.fixedDelta) {
      if (!this.isPaused) {
        // Update game logic
        const delta = this.fixedDelta / 1000 // Convert to seconds
        this.updateCallbacks.forEach((callback) => callback(delta))

        // Update game time based on speed
        const speedMultiplier = GAME_SPEEDS[this.gameSpeed]
        this.gameTimeAccumulator += this.fixedDelta * speedMultiplier

        // Check for game minute
        while (this.gameTimeAccumulator >= GAME_MINUTE_MS) {
          this.gameTimeAccumulator -= GAME_MINUTE_MS
          if (this.onGameMinute) {
            this.onGameMinute()
          }
        }
      }

      this.accumulator -= this.fixedDelta
    }

    // Calculate interpolation alpha for smooth rendering
    const alpha = this.accumulator / this.fixedDelta

    // Render
    this.renderCallbacks.forEach((callback) => callback(alpha))

    // Continue loop
    requestAnimationFrame(this.loop)
  }
}

// Singleton instance
let gameLoopInstance: GameLoop | null = null

export function getGameLoop(): GameLoop {
  if (!gameLoopInstance) {
    gameLoopInstance = new GameLoop()
  }
  return gameLoopInstance
}

export function destroyGameLoop(): void {
  if (gameLoopInstance) {
    gameLoopInstance.stop()
    gameLoopInstance = null
  }
}
