import { BaseSimulationSystem } from './SimulationManager'
import { GameTime, ZoneType } from '@/types/game.types'
import { ZoningState, ZoneDemand, ZoneDevelopment } from '@/types/simulation.types'
import { useCityStore } from '@/stores/cityStore'
import {
  DEMAND_MIN,
  DEMAND_MAX,
  DEMAND_DECAY_RATE,
} from '@/lib/constants'
import { clamp } from '@/lib/utils'

/**
 * Zoning simulation system
 * Manages RCI zones and demand calculations
 */
export class ZoningSystem extends BaseSimulationSystem {
  name = 'zoning'
  priority = 20

  private lastUpdateDay = -1

  update(delta: number, gameTime: GameTime): void {
    // Only update zoning once per game day
    if (gameTime.day === this.lastUpdateDay) return
    this.lastUpdateDay = gameTime.day

    this.calculateDemand()
    this.processDevelopment()
  }

  /**
   * Calculate zone demand based on city state
   */
  private calculateDemand(): void {
    const cityStore = useCityStore.getState()
    const { buildings, buildingCatalog, tiles, population, zoneDemand } = cityStore

    // Count zone stats
    let residentialCapacity = 0
    let residentialOccupied = 0
    let commercialJobs = 0
    let commercialOccupied = 0
    let industrialJobs = 0
    let industrialOccupied = 0

    buildings.forEach((building) => {
      const definition = buildingCatalog.find(d => d.id === building.definitionId)
      if (!definition) return

      const occupancy = building.occupancy / 100

      switch (definition.zone) {
        case 'residential':
          residentialCapacity += definition.capacity
          residentialOccupied += definition.capacity * occupancy
          break
        case 'commercial':
          commercialJobs += definition.jobs
          commercialOccupied += definition.jobs * occupancy
          break
        case 'industrial':
          industrialJobs += definition.jobs
          industrialOccupied += definition.jobs * occupancy
          break
      }
    })

    // Count empty zones
    let emptyResidential = 0
    let emptyCommercial = 0
    let emptyIndustrial = 0

    tiles.forEach((tile) => {
      if (tile.zone && !tile.buildingId) {
        switch (tile.zone) {
          case 'residential':
            emptyResidential++
            break
          case 'commercial':
            emptyCommercial++
            break
          case 'industrial':
            emptyIndustrial++
            break
        }
      }
    })

    // Calculate demand factors
    const totalPopulation = population.total || 1
    const employmentRate = population.employmentRate || 0.5

    // Residential demand: based on job availability and happiness
    let newResidentialDemand = zoneDemand.residential
    if (commercialJobs + industrialJobs > residentialCapacity * 0.8) {
      newResidentialDemand += 5 // More jobs than housing = housing demand
    } else if (residentialCapacity > (commercialJobs + industrialJobs) * 1.5) {
      newResidentialDemand -= 3 // Too much housing
    }

    // Commercial demand: based on population
    let newCommercialDemand = zoneDemand.commercial
    if (totalPopulation > commercialJobs * 2) {
      newCommercialDemand += 4 // Not enough shops/offices
    } else if (commercialJobs > totalPopulation * 0.8) {
      newCommercialDemand -= 2 // Too many commercial
    }

    // Industrial demand: based on unemployment
    let newIndustrialDemand = zoneDemand.industrial
    if (employmentRate < 0.7) {
      newIndustrialDemand += 5 // Need more jobs
    } else if (employmentRate > 0.95) {
      newIndustrialDemand -= 2 // Enough jobs
    }

    // Apply decay
    newResidentialDemand = newResidentialDemand * (1 - DEMAND_DECAY_RATE)
    newCommercialDemand = newCommercialDemand * (1 - DEMAND_DECAY_RATE)
    newIndustrialDemand = newIndustrialDemand * (1 - DEMAND_DECAY_RATE)

    // Clamp values
    const newDemand: ZoneDemand = {
      residential: clamp(newResidentialDemand, DEMAND_MIN, DEMAND_MAX),
      commercial: clamp(newCommercialDemand, DEMAND_MIN, DEMAND_MAX),
      industrial: clamp(newIndustrialDemand, DEMAND_MIN, DEMAND_MAX),
    }

    // Update store
    Object.assign(cityStore.zoneDemand, newDemand)
  }

  /**
   * Process automatic development in zones
   * Buildings grow organically based on demand
   */
  private processDevelopment(): void {
    const cityStore = useCityStore.getState()
    const { tiles, buildings, buildingCatalog, zoneDemand, economy } = cityStore

    // Find empty zone tiles with high demand
    const developableTiles: { position: { x: number; z: number }; zone: ZoneType }[] = []

    tiles.forEach((tile) => {
      if (tile.zone && !tile.buildingId && !tile.roadId) {
        // Check demand for this zone
        const demand = zoneDemand[tile.zone]
        if (demand > 30) { // Only develop if demand is high enough
          developableTiles.push({ position: tile.position, zone: tile.zone })
        }
      }
    })

    // Limit development per day
    const maxDevelopments = 2
    let developments = 0

    for (const developable of developableTiles) {
      if (developments >= maxDevelopments) break

      // Find suitable building for this zone
      const suitableBuildings = buildingCatalog.filter(b => 
        b.zone === developable.zone &&
        b.size.width === 1 && b.size.depth === 1 && // Only 1x1 for now
        b.cost <= economy.balance * 0.1 // Max 10% of budget
      )

      if (suitableBuildings.length === 0) continue

      // Pick random building
      const building = suitableBuildings[Math.floor(Math.random() * suitableBuildings.length)]

      // Place building
      const placed = cityStore.placeBuilding(
        building.id,
        developable.position,
        Math.floor(Math.random() * 4) * 90 // Random rotation
      )

      if (placed) {
        // Set initial occupancy based on demand
        placed.occupancy = Math.min(50 + zoneDemand[developable.zone], 100)
        developments++
      }
    }
  }

  /**
   * Get zoning state
   */
  getState(): ZoningState {
    const cityStore = useCityStore.getState()
    const { tiles, buildings } = cityStore

    const zones = new Map()
    tiles.forEach((tile) => {
      if (tile.zone) {
        zones.set(`${tile.position.x},${tile.position.z}`, {
          position: tile.position,
          type: tile.zone,
          developmentLevel: 0,
          isOccupied: !!tile.buildingId,
          buildingId: tile.buildingId,
        })
      }
    })

    return {
      zones,
      demand: cityStore.zoneDemand,
      development: this.calculateDevelopment(),
    }
  }

  private calculateDevelopment(): ZoneDevelopment {
    const cityStore = useCityStore.getState()
    const { tiles } = cityStore

    const development: ZoneDevelopment = {
      residential: { total: 0, developed: 0 },
      commercial: { total: 0, developed: 0 },
      industrial: { total: 0, developed: 0 },
    }

    tiles.forEach((tile) => {
      if (tile.zone) {
        development[tile.zone].total++
        if (tile.buildingId) {
          development[tile.zone].developed++
        }
      }
    })

    return development
  }

  reset(): void {
    this.lastUpdateDay = -1
  }

  serialize(): unknown {
    return this.getState()
  }

  deserialize(data: unknown): void {
    // Zoning state is managed by cityStore
  }
}
