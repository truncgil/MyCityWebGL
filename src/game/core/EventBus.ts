import { GameEvent, GameEventType } from '@/types/game.types'

type EventCallback<T = unknown> = (event: GameEvent<T>) => void

/**
 * Global event bus for game-wide communication
 * Implements publish-subscribe pattern
 */
class EventBusClass {
  private listeners: Map<GameEventType, Set<EventCallback>> = new Map()
  private eventHistory: GameEvent[] = []
  private maxHistorySize = 100

  /**
   * Subscribe to an event type
   */
  subscribe<T = unknown>(
    eventType: GameEventType,
    callback: EventCallback<T>
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }

    const callbacks = this.listeners.get(eventType)!
    callbacks.add(callback as EventCallback)

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback as EventCallback)
      if (callbacks.size === 0) {
        this.listeners.delete(eventType)
      }
    }
  }

  /**
   * Publish an event
   */
  publish<T = unknown>(eventType: GameEventType, payload: T): void {
    const event: GameEvent<T> = {
      type: eventType,
      payload,
      timestamp: Date.now(),
    }

    // Add to history
    this.eventHistory.push(event as GameEvent)
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift()
    }

    // Notify listeners
    const callbacks = this.listeners.get(eventType)
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(event as GameEvent)
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error)
        }
      })
    }
  }

  /**
   * Subscribe to multiple event types
   */
  subscribeMany(
    eventTypes: GameEventType[],
    callback: EventCallback
  ): () => void {
    const unsubscribers = eventTypes.map((type) =>
      this.subscribe(type, callback)
    )

    return () => {
      unsubscribers.forEach((unsub) => unsub())
    }
  }

  /**
   * Subscribe once - auto unsubscribe after first event
   */
  subscribeOnce<T = unknown>(
    eventType: GameEventType,
    callback: EventCallback<T>
  ): () => void {
    const unsubscribe = this.subscribe<T>(eventType, (event) => {
      callback(event)
      unsubscribe()
    })

    return unsubscribe
  }

  /**
   * Get event history
   */
  getHistory(): GameEvent[] {
    return [...this.eventHistory]
  }

  /**
   * Get filtered history
   */
  getHistoryByType(eventType: GameEventType): GameEvent[] {
    return this.eventHistory.filter((e) => e.type === eventType)
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = []
  }

  /**
   * Remove all listeners
   */
  clear(): void {
    this.listeners.clear()
    this.eventHistory = []
  }

  /**
   * Get listener count for debugging
   */
  getListenerCount(eventType?: GameEventType): number {
    if (eventType) {
      return this.listeners.get(eventType)?.size ?? 0
    }
    
    let count = 0
    this.listeners.forEach((callbacks) => {
      count += callbacks.size
    })
    return count
  }
}

// Singleton instance
export const EventBus = new EventBusClass()

// Helper functions for common events
export const GameEvents = {
  // Building events
  buildingPlaced: (data: { buildingId: string; position: { x: number; z: number } }) =>
    EventBus.publish('building:placed', data),
  
  buildingRemoved: (data: { buildingId: string; position: { x: number; z: number } }) =>
    EventBus.publish('building:removed', data),

  // Road events
  roadPlaced: (data: { roadId: string; position: { x: number; z: number } }) =>
    EventBus.publish('road:placed', data),
  
  roadRemoved: (data: { roadId: string; position: { x: number; z: number } }) =>
    EventBus.publish('road:removed', data),

  // Zone events
  zoneChanged: (data: { position: { x: number; z: number }; zone: string | null }) =>
    EventBus.publish('zone:changed', data),

  // Economy events
  economyUpdated: (data: { balance: number; income: number; expenses: number }) =>
    EventBus.publish('economy:updated', data),

  // Population events
  populationChanged: (data: { total: number; delta: number }) =>
    EventBus.publish('population:changed', data),

  // Time events
  timeChanged: (data: { day: number; hour: number; minute: number }) =>
    EventBus.publish('time:changed', data),

  // Save/Load events
  gameSaved: () => EventBus.publish('game:saved', {}),
  gameLoaded: () => EventBus.publish('game:loaded', {}),
  gameReset: () => EventBus.publish('game:reset', {}),
}
