import { GridPosition, WorldPosition } from '@/types/game.types'
import { GRID_SIZE, TILE_SIZE } from './constants'
import { v4 as uuidv4 } from 'uuid'

// ============================================
// ID Generation
// ============================================

export function generateId(): string {
  return uuidv4()
}

export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 9)
}

// ============================================
// Grid Utilities
// ============================================

export function gridToWorld(position: GridPosition): WorldPosition {
  return {
    x: position.x * TILE_SIZE - (GRID_SIZE * TILE_SIZE) / 2,
    y: 0,
    z: position.z * TILE_SIZE - (GRID_SIZE * TILE_SIZE) / 2,
  }
}

export function worldToGrid(position: WorldPosition): GridPosition {
  return {
    x: Math.floor((position.x + (GRID_SIZE * TILE_SIZE) / 2) / TILE_SIZE),
    z: Math.floor((position.z + (GRID_SIZE * TILE_SIZE) / 2) / TILE_SIZE),
  }
}

export function isValidGridPosition(position: GridPosition): boolean {
  return (
    position.x >= 0 &&
    position.x < GRID_SIZE &&
    position.z >= 0 &&
    position.z < GRID_SIZE
  )
}

export function gridPositionToKey(position: GridPosition): string {
  return `${position.x},${position.z}`
}

export function keyToGridPosition(key: string): GridPosition {
  const [x, z] = key.split(',').map(Number)
  return { x, z }
}

export function getAdjacentTiles(position: GridPosition): GridPosition[] {
  const directions = [
    { x: 0, z: -1 }, // north
    { x: 0, z: 1 },  // south
    { x: -1, z: 0 }, // west
    { x: 1, z: 0 },  // east
  ]
  
  return directions
    .map(d => ({ x: position.x + d.x, z: position.z + d.z }))
    .filter(isValidGridPosition)
}

export function getTilesInRadius(center: GridPosition, radius: number): GridPosition[] {
  const tiles: GridPosition[] = []
  
  for (let x = -radius; x <= radius; x++) {
    for (let z = -radius; z <= radius; z++) {
      const distance = Math.sqrt(x * x + z * z)
      if (distance <= radius) {
        const pos = { x: center.x + x, z: center.z + z }
        if (isValidGridPosition(pos)) {
          tiles.push(pos)
        }
      }
    }
  }
  
  return tiles
}

export function getTilesInRect(
  start: GridPosition,
  width: number,
  depth: number
): GridPosition[] {
  const tiles: GridPosition[] = []
  
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      const pos = { x: start.x + x, z: start.z + z }
      if (isValidGridPosition(pos)) {
        tiles.push(pos)
      }
    }
  }
  
  return tiles
}

export function manhattanDistance(a: GridPosition, b: GridPosition): number {
  return Math.abs(a.x - b.x) + Math.abs(a.z - b.z)
}

export function euclideanDistance(a: GridPosition, b: GridPosition): number {
  const dx = a.x - b.x
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dz * dz)
}

// ============================================
// Math Utilities
// ============================================

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function inverseLerp(a: number, b: number, value: number): number {
  return (value - a) / (b - a)
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1))
}

export function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

// ============================================
// Formatting Utilities
// ============================================

export function formatMoney(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `₺${(amount / 1_000_000).toFixed(1)}M`
  }
  if (Math.abs(amount) >= 1_000) {
    return `₺${(amount / 1_000).toFixed(1)}K`
  }
  return `₺${amount.toFixed(0)}`
}

export function formatNumber(num: number): string {
  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`
  }
  if (Math.abs(num) >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`
  }
  return num.toFixed(0)
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`
}

export function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

// ============================================
// Color Utilities
// ============================================

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    return { r: 0, g: 0, b: 0 }
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

export function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)
  
  return rgbToHex(
    Math.round(lerp(c1.r, c2.r, t)),
    Math.round(lerp(c1.g, c2.g, t)),
    Math.round(lerp(c1.b, c2.b, t))
  )
}

// ============================================
// Time Utilities
// ============================================

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// ============================================
// Deep Clone Utility
// ============================================

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// ============================================
// Class Name Utility
// ============================================

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
