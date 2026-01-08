import { BaseSimulationSystem } from './SimulationManager'
import { GameTime } from '@/types/game.types'
import { PopulationState } from '@/types/simulation.types'
import { useCityStore } from '@/stores/cityStore'
import { EventBus, GameEvents } from '../core/EventBus'
import {
  POPULATION_GROWTH_RATE,
  MIGRATION_FACTOR,
  BASE_HAPPINESS,
  MAX_HAPPINESS,
  MIN_HAPPINESS,
} from '@/lib/constants'
import { clamp, lerp } from '@/lib/utils'

/**
 * Population simulation system
 * Handles population growth, employment, and happiness
 */
export class PopulationSystem extends BaseSimulationSystem {
  name = 'population'
  priority = 30

  private lastUpdateDay = -1

  update(delta: number, gameTime: GameTime): void {
    // Only update population once per game day
    if (gameTime.day === this.lastUpdateDay) return
    this.lastUpdateDay = gameTime.day

    this.updateOccupancy()
    this.calculateHappiness()
    this.processGrowth() // Process growth before employment to get updated population
    this.calculateEmployment()
  }

  /**
   * Update building occupancy
   */
  private updateOccupancy(): void {
    const cityStore = useCityStore.getState()
    const { buildings, zoneDemand, population } = cityStore

    buildings.forEach((building, id) => {
      const definition = cityStore.buildingCatalog.find(
        d => d.id === building.definitionId
      )
      if (!definition || !definition.zone) return

      // Calculate target occupancy based on demand
      const demand = zoneDemand[definition.zone]
      const demandFactor = (demand + 100) / 200 // 0 to 1

      // Target occupancy based on demand and happiness
      const happinessFactor = population.happiness / 100
      let targetOccupancy = demandFactor * happinessFactor * 100

      // Services affect occupancy
      if (!building.isPowered) targetOccupancy *= 0.5
      if (!building.hasWater) targetOccupancy *= 0.7

      // Gradually move towards target
      building.occupancy = lerp(building.occupancy, targetOccupancy, 0.1)
      building.occupancy = clamp(building.occupancy, 0, 100)
    })
  }

  /**
   * Calculate employment statistics
   */
  private calculateEmployment(): void {
    const cityStore = useCityStore.getState()
    const { buildings, buildingCatalog, population } = cityStore

    let totalCapacity = 0
    let totalJobs = 0
    let occupiedCapacity = 0
    let filledJobs = 0

    buildings.forEach((building) => {
      const definition = buildingCatalog.find(d => d.id === building.definitionId)
      if (!definition) return

      const occupancyRate = building.occupancy / 100

      if (definition.zone === 'residential') {
        totalCapacity += definition.capacity
        occupiedCapacity += definition.capacity * occupancyRate
      } else if (definition.jobs > 0) {
        totalJobs += definition.jobs
        filledJobs += definition.jobs * occupancyRate
      }
    })

    // Calculate available capacity (max population that can live in residential buildings)
    const maxPopulation = Math.floor(occupiedCapacity)
    
    // Update residential capacity
    population.residential = totalCapacity
    
    // Note: Population capping is now handled in processGrowth() to avoid race conditions
    
    // Calculate workers and employment
    const workers = Math.floor(population.total * 0.6) // 60% are workers
    const employed = Math.min(workers, Math.floor(filledJobs))
    const unemployed = workers - employed
    const employmentRate = workers > 0 ? employed / workers : 0

    Object.assign(population, {
      workers,
      employed,
      unemployed,
      employmentRate,
    })
  }

  /**
   * Calculate city happiness
   */
  private calculateHappiness(): void {
    const cityStore = useCityStore.getState()
    const { population, economy, buildings, buildingCatalog, tiles } = cityStore

    let happiness = BASE_HAPPINESS

    // Employment factor (-20 to +10)
    happiness += (population.employmentRate - 0.5) * 40

    // Tax factor (-15 to +5)
    const avgTax = (economy.taxRates.residential + 
                   economy.taxRates.commercial + 
                   economy.taxRates.industrial) / 3
    happiness -= (avgTax - 10) * 1.5

    // Services factor
    let hasPolice = false
    let hasFire = false
    let hasHealth = false
    let hasEducation = false

    buildings.forEach((building) => {
      const def = buildingCatalog.find(d => d.id === building.definitionId)
      if (def?.serviceType === 'police') hasPolice = true
      if (def?.serviceType === 'fire') hasFire = true
      if (def?.serviceType === 'health') hasHealth = true
      if (def?.serviceType === 'education') hasEducation = true
    })

    if (hasPolice) happiness += 5
    if (hasFire) happiness += 3
    if (hasHealth) happiness += 8
    if (hasEducation) happiness += 7

    // Parks factor
    let parkCount = 0
    buildings.forEach((building) => {
      const def = buildingCatalog.find(d => d.id === building.definitionId)
      if (def?.category === 'park') parkCount++
    })
    happiness += Math.min(parkCount * 3, 15)

    // Pollution factor
    let totalPollution = 0
    tiles.forEach((tile) => {
      totalPollution += tile.pollution
    })
    const avgPollution = tiles.size > 0 ? totalPollution / tiles.size : 0
    happiness -= avgPollution * 0.5

    // Clamp and update
    population.happiness = clamp(happiness, MIN_HAPPINESS, MAX_HAPPINESS)
  }

  /**
   * Process population growth
   */
  private processGrowth(): void {
    const cityStore = useCityStore.getState()
    const { population, zoneDemand, buildings, buildingCatalog } = cityStore

    // Calculate max population capacity from residential buildings
    let maxCapacity = 0
    let totalCapacity = 0
    buildings.forEach((building) => {
      const definition = buildingCatalog.find(d => d.id === building.definitionId)
      if (definition?.zone === 'residential') {
        const occupancyRate = building.occupancy / 100
        // Use at least 10% of capacity even if occupancy is low (allows initial migration)
        const effectiveOccupancyRate = Math.max(occupancyRate, 0.1)
        maxCapacity += definition.capacity * effectiveOccupancyRate
        totalCapacity += definition.capacity
      }
    })
    const maxPopulation = Math.floor(maxCapacity)

    // Calculate growth factors
    const happinessFactor = population.happiness / 100
    const demandFactor = Math.max(zoneDemand.residential, 0) / 100

    // Base growth rate modified by factors
    const growthRate = POPULATION_GROWTH_RATE * happinessFactor * demandFactor

    // Calculate births, deaths, and migration
    const births = Math.floor(population.total * growthRate * 0.3)
    const deaths = Math.floor(population.total * 0.001)
    
    // Migration: stronger when there's capacity but low population
    let migration = 0
    if (maxPopulation > 0 || totalCapacity > 0) {
      // Base migration from demand (even if occupancy is low, buildings attract people)
      const baseDemand = Math.max(zoneDemand.residential / 100, 0.5) // Minimum 0.5 for demand
      migration = Math.floor(
        baseDemand * MIGRATION_FACTOR * 15
      )
      
      // If we have residential buildings but low population, strong migration boost
      if (totalCapacity > 0 && population.total < Math.max(maxPopulation, totalCapacity * 0.1)) {
        const targetCapacity = Math.max(maxPopulation, totalCapacity * 0.2) // Target 20% of total capacity
        const availableCapacity = targetCapacity - population.total
        if (availableCapacity > 0) {
          // More aggressive migration at start: 10% of available capacity per day
          migration += Math.max(1, Math.floor(availableCapacity * 0.1))
        }
      }
    }

    // Update growth stats
    population.births = births
    population.deaths = deaths
    population.migration = migration
    population.growth = births - deaths + migration

    // Apply growth to total population
    const oldTotal = population.total
    population.total = Math.max(0, population.total + population.growth)
    
    // Cap at maximum capacity
    if (maxPopulation > 0 && population.total > maxPopulation) {
      population.total = maxPopulation
    }

    // Update demographics (simplified)
    const total = population.total
    population.demographics = {
      children: Math.floor(total * 0.2),
      adults: Math.floor(total * 0.65),
      elderly: Math.floor(total * 0.15),
    }

    // Emit population change event with actual delta
    const delta = population.total - oldTotal
    if (delta !== 0) {
      GameEvents.populationChanged({
        total: population.total,
        delta,
      })
    }
  }

  getState(): PopulationState {
    return useCityStore.getState().population
  }

  reset(): void {
    this.lastUpdateDay = -1
  }

  serialize(): unknown {
    return this.getState()
  }

  deserialize(data: unknown): void {
    // Population state is managed by cityStore
  }
}
