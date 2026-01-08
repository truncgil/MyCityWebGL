import { ISimulationSystem, GameTime } from '@/types/game.types'
import { EventBus } from '../core/EventBus'

/**
 * Base class for simulation systems
 */
export abstract class BaseSimulationSystem implements ISimulationSystem {
  abstract name: string
  abstract priority: number
  enabled = true

  abstract update(delta: number, gameTime: GameTime): void
  abstract getState(): unknown
  abstract reset(): void
  abstract serialize(): unknown
  abstract deserialize(data: unknown): void

  protected emit(event: string, data: unknown): void {
    EventBus.publish(event as any, data)
  }
}

/**
 * Manages all simulation systems
 */
export class SimulationManager {
  private static instance: SimulationManager | null = null
  private systems: Map<string, ISimulationSystem> = new Map()

  private constructor() {}

  static getInstance(): SimulationManager {
    if (!SimulationManager.instance) {
      SimulationManager.instance = new SimulationManager()
    }
    return SimulationManager.instance
  }

  /**
   * Register a system
   */
  register(system: ISimulationSystem): void {
    this.systems.set(system.name, system)
  }

  /**
   * Unregister a system
   */
  unregister(name: string): void {
    this.systems.delete(name)
  }

  /**
   * Get a system
   */
  get<T extends ISimulationSystem>(name: string): T | undefined {
    return this.systems.get(name) as T | undefined
  }

  /**
   * Update all systems
   */
  update(delta: number, gameTime: GameTime): void {
    const sorted = Array.from(this.systems.values())
      .filter(s => s.enabled)
      .sort((a, b) => a.priority - b.priority)

    for (const system of sorted) {
      system.update(delta, gameTime)
    }
  }

  /**
   * Reset all systems
   */
  reset(): void {
    this.systems.forEach(system => system.reset())
  }

  /**
   * Serialize all systems
   */
  serialize(): Record<string, unknown> {
    const data: Record<string, unknown> = {}
    this.systems.forEach((system, name) => {
      data[name] = system.serialize()
    })
    return data
  }

  /**
   * Deserialize all systems
   */
  deserialize(data: Record<string, unknown>): void {
    this.systems.forEach((system, name) => {
      if (data[name]) {
        system.deserialize(data[name])
      }
    })
  }
}
