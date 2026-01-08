import { InputAction, GridPosition } from '@/types/game.types'
import { KEY_BINDINGS } from '@/lib/constants'
import { useGameStore } from '@/stores/gameStore'
import { useCityStore } from '@/stores/cityStore'
import { getGameEngine } from './GameEngine'
import { useUIStore } from '@/stores/uiStore'

type ActionCallback = () => void

/**
 * Input manager for handling keyboard and mouse input
 */
export class InputManager {
  private static instance: InputManager | null = null
  
  private pressedKeys: Set<string> = new Set()
  private actionCallbacks: Map<InputAction, ActionCallback[]> = new Map()
  private isEnabled = true
  
  private constructor() {
    this.setupEventListeners()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager()
    }
    return InputManager.instance
  }

  /**
   * Destroy instance
   */
  static destroy(): void {
    if (InputManager.instance) {
      InputManager.instance.cleanup()
      InputManager.instance = null
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    window.addEventListener('keyup', this.handleKeyUp.bind(this))
    window.addEventListener('blur', this.handleBlur.bind(this))
  }

  /**
   * Cleanup event listeners
   */
  private cleanup(): void {
    if (typeof window === 'undefined') return

    window.removeEventListener('keydown', this.handleKeyDown.bind(this))
    window.removeEventListener('keyup', this.handleKeyUp.bind(this))
    window.removeEventListener('blur', this.handleBlur.bind(this))
  }

  /**
   * Handle key down
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return

    // Ignore if typing in input
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return
    }

    const key = event.key.toLowerCase()
    this.pressedKeys.add(key)

    // Check for action triggers
    this.checkActionTriggers(key, event)
  }

  /**
   * Handle key up
   */
  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase()
    this.pressedKeys.delete(key)
  }

  /**
   * Handle window blur
   */
  private handleBlur(): void {
    this.pressedKeys.clear()
  }

  /**
   * Check if an action should be triggered
   */
  private checkActionTriggers(key: string, event: KeyboardEvent): void {
    const gameStore = useGameStore.getState()
    const cityStore = useCityStore.getState()
    const uiStore = useUIStore.getState()

    // Check key bindings
    for (const [action, keys] of Object.entries(KEY_BINDINGS)) {
      const keyList = keys as string[]
      if (keyList.map(k => k.toLowerCase()).includes(key)) {
        event.preventDefault()
        this.executeAction(action as keyof typeof KEY_BINDINGS)
        break
      }
    }
  }

  /**
   * Execute an action
   */
  private executeAction(action: keyof typeof KEY_BINDINGS): void {
    const gameStore = useGameStore.getState()
    const engine = getGameEngine()
    const uiStore = useUIStore.getState()

    switch (action) {
      // Building actions
      case 'rotate_building':
        if (gameStore.mode === 'build') {
          gameStore.rotateBuilding()
        }
        break

      case 'demolish':
        gameStore.setMode('demolish')
        break

      case 'cancel':
        gameStore.setSelectedBuilding(null)
        gameStore.setMode('view')
        break

      // Game speed
      case 'pause':
        engine.togglePause()
        break

      case 'speed_normal':
        engine.setSpeed('normal')
        break

      case 'speed_fast':
        engine.setSpeed('fast')
        break

      case 'speed_ultra':
        engine.setSpeed('ultra')
        break

      // System
      case 'save':
        engine.saveGame()
        uiStore.addNotification({
          type: 'success',
          title: 'Kaydedildi',
          message: 'Oyun başarıyla kaydedildi.',
        })
        break

      case 'load':
        if (engine.loadGame()) {
          uiStore.addNotification({
            type: 'success',
            title: 'Yüklendi',
            message: 'Oyun başarıyla yüklendi.',
          })
        } else {
          uiStore.addNotification({
            type: 'error',
            title: 'Hata',
            message: 'Kayıtlı oyun bulunamadı.',
          })
        }
        break

      case 'toggle_grid':
        gameStore.toggleGrid()
        break

      case 'toggle_overlay':
        const overlays: ('none' | 'traffic' | 'pollution' | 'landValue')[] = 
          ['none', 'traffic', 'pollution', 'landValue']
        const currentIdx = overlays.indexOf(gameStore.overlay as any)
        const nextIdx = (currentIdx + 1) % overlays.length
        gameStore.setOverlay(overlays[nextIdx])
        break

      default:
        break
    }

    // Trigger registered callbacks
    const callbacks = this.actionCallbacks.get(action as InputAction)
    if (callbacks) {
      callbacks.forEach((cb) => cb())
    }
  }

  /**
   * Register action callback
   */
  onAction(action: InputAction, callback: ActionCallback): () => void {
    if (!this.actionCallbacks.has(action)) {
      this.actionCallbacks.set(action, [])
    }

    this.actionCallbacks.get(action)!.push(callback)

    return () => {
      const callbacks = this.actionCallbacks.get(action)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  /**
   * Check if a key is currently pressed
   */
  isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key.toLowerCase())
  }

  /**
   * Check if any of the keys are pressed
   */
  areAnyKeysPressed(keys: string[]): boolean {
    return keys.some((key) => this.pressedKeys.has(key.toLowerCase()))
  }

  /**
   * Get all pressed keys
   */
  getPressedKeys(): string[] {
    return Array.from(this.pressedKeys)
  }

  /**
   * Enable/disable input
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    if (!enabled) {
      this.pressedKeys.clear()
    }
  }

  /**
   * Check if input is enabled
   */
  isInputEnabled(): boolean {
    return this.isEnabled
  }
}

// Export singleton getter
export function getInputManager(): InputManager {
  return InputManager.getInstance()
}
