import { BaseSimulationSystem } from './SimulationManager'
import { GameTime } from '@/types/game.types'
import { TimeState, TimeSpeed, DayOfWeek, Season } from '@/types/simulation.types'
import { useGameStore } from '@/stores/gameStore'
import { DAY_START_HOUR, DAY_END_HOUR, HOURS_PER_DAY } from '@/lib/constants'

const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
]

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']

/**
 * Time simulation system
 * Handles day/night cycle and seasons
 */
export class TimeSystem extends BaseSimulationSystem {
  name = 'time'
  priority = 0 // Highest priority - runs first

  update(delta: number, gameTime: GameTime): void {
    // Time advancement is handled by GameLoop
    // This system just provides helpers and state
  }

  /**
   * Get current day of week
   */
  getDayOfWeek(day: number): DayOfWeek {
    return DAYS_OF_WEEK[(day - 1) % 7]
  }

  /**
   * Get current season
   */
  getSeason(day: number): Season {
    const seasonDay = (day - 1) % 120 // 120 days per year (30 per season)
    return SEASONS[Math.floor(seasonDay / 30)]
  }

  /**
   * Get sun position (0 = midnight, 0.5 = noon, 1 = midnight)
   */
  getSunPosition(hour: number, minute: number): number {
    const totalMinutes = hour * 60 + minute
    return totalMinutes / (24 * 60)
  }

  /**
   * Check if it's daytime
   */
  isDaytime(hour: number): boolean {
    return hour >= DAY_START_HOUR && hour < DAY_END_HOUR
  }

  /**
   * Get light level (0-1)
   */
  getLightLevel(hour: number, minute: number): number {
    const h = hour + minute / 60

    if (h >= 6 && h < 7) {
      // Sunrise
      return (h - 6) * 0.7 + 0.3
    } else if (h >= 7 && h < 19) {
      // Day
      return 1
    } else if (h >= 19 && h < 20) {
      // Sunset
      return 1 - (h - 19) * 0.7
    } else {
      // Night
      return 0.3
    }
  }

  /**
   * Get formatted time string
   */
  formatTime(hour: number, minute: number): string {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  /**
   * Get time state
   */
  getState(): TimeState {
    const gameStore = useGameStore.getState()
    const { gameTime } = gameStore

    return {
      day: gameTime.day,
      hour: gameTime.hour,
      minute: gameTime.minute,
      totalMinutes: gameTime.totalMinutes,
      speed: this.speedToNumber(gameTime.speed),
      isPaused: gameTime.speed === 'paused',
      dayOfWeek: this.getDayOfWeek(gameTime.day),
      season: this.getSeason(gameTime.day),
      sunPosition: this.getSunPosition(gameTime.hour, gameTime.minute),
      isDaytime: gameTime.isDaytime,
    }
  }

  private speedToNumber(speed: string): TimeSpeed {
    switch (speed) {
      case 'paused': return 0
      case 'normal': return 1
      case 'fast': return 2
      case 'ultra': return 3
      default: return 1
    }
  }

  reset(): void {
    // Time is reset via gameStore
  }

  serialize(): unknown {
    return this.getState()
  }

  deserialize(data: unknown): void {
    // Time state is managed by gameStore
  }
}
