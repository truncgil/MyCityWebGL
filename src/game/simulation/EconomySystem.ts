import { BaseSimulationSystem } from './SimulationManager'
import { GameTime } from '@/types/game.types'
import { EconomyState } from '@/types/simulation.types'
import { useCityStore } from '@/stores/cityStore'
import { EventBus, GameEvents } from '../core/EventBus'
import {
  TAX_INCOME_PER_RESIDENT,
  TAX_INCOME_PER_WORKER,
  TAX_INCOME_PER_INDUSTRY,
} from '@/lib/constants'

/**
 * Economy simulation system
 * Handles taxes, income, expenses, and budget management
 */
export class EconomySystem extends BaseSimulationSystem {
  name = 'economy'
  priority = 10

  private lastUpdateHour = -1

  update(delta: number, gameTime: GameTime): void {
    // Only update economy once per game hour
    if (gameTime.hour === this.lastUpdateHour) return
    this.lastUpdateHour = gameTime.hour

    this.calculateIncome()
    this.calculateExpenses()
    this.updateBalance()
  }

  /**
   * Calculate tax income from buildings
   */
  private calculateIncome(): void {
    const cityStore = useCityStore.getState()
    const { buildings, buildingCatalog, economy } = cityStore

    let residentialIncome = 0
    let commercialIncome = 0
    let industrialIncome = 0

    buildings.forEach((building) => {
      const definition = buildingCatalog.find(d => d.id === building.definitionId)
      if (!definition) return

      const occupancyRate = building.occupancy / 100

      switch (definition.zone) {
        case 'residential':
          const residents = definition.capacity * occupancyRate
          residentialIncome += residents * TAX_INCOME_PER_RESIDENT * 
            (economy.taxRates.residential / 100)
          break

        case 'commercial':
          const workers = definition.jobs * occupancyRate
          commercialIncome += workers * TAX_INCOME_PER_WORKER * 
            (economy.taxRates.commercial / 100)
          break

        case 'industrial':
          const industryWorkers = definition.jobs * occupancyRate
          industrialIncome += industryWorkers * TAX_INCOME_PER_INDUSTRY * 
            (economy.taxRates.industrial / 100)
          break
      }
    })

    // Update economy state
    const newEconomy: Partial<EconomyState> = {
      taxIncome: {
        residential: Math.floor(residentialIncome),
        commercial: Math.floor(commercialIncome),
        industrial: Math.floor(industrialIncome),
        total: Math.floor(residentialIncome + commercialIncome + industrialIncome),
      },
      income: Math.floor(residentialIncome + commercialIncome + industrialIncome),
    }

    // Merge with current economy
    const currentEconomy = cityStore.economy
    Object.assign(currentEconomy, newEconomy)
  }

  /**
   * Calculate expenses from services and maintenance
   */
  private calculateExpenses(): void {
    const cityStore = useCityStore.getState()
    const { buildings, buildingCatalog, economy } = cityStore

    let maintenanceExpenses = 0
    const serviceExpenses = {
      police: 0,
      fire: 0,
      health: 0,
      education: 0,
      power: 0,
      water: 0,
      waste: 0,
      total: 0,
    }

    buildings.forEach((building) => {
      const definition = buildingCatalog.find(d => d.id === building.definitionId)
      if (!definition) return

      maintenanceExpenses += definition.maintenanceCost

      // Add service costs
      if (definition.serviceType) {
        const key = definition.serviceType as keyof typeof serviceExpenses
        if (key in serviceExpenses && key !== 'total') {
          serviceExpenses[key] += definition.maintenanceCost
        }
      }
    })

    serviceExpenses.total = Object.values(serviceExpenses)
      .filter((_, i) => i < 7)
      .reduce((a, b) => a + b, 0)

    // Update economy state
    const currentEconomy = cityStore.economy
    currentEconomy.serviceExpenses = serviceExpenses
    currentEconomy.maintenanceExpenses = maintenanceExpenses
    currentEconomy.expenses = maintenanceExpenses + serviceExpenses.total
  }

  /**
   * Update balance based on income and expenses
   */
  private updateBalance(): void {
    const cityStore = useCityStore.getState()
    const { economy } = cityStore

    const hourlyIncome = economy.income / 24 // Monthly income / 24 hours
    const hourlyExpenses = economy.expenses / 24

    const netHourly = hourlyIncome - hourlyExpenses
    cityStore.updateBalance(netHourly)

    // Emit economy update event
    GameEvents.economyUpdated({
      balance: economy.balance,
      income: economy.income,
      expenses: economy.expenses,
    })
  }

  getState(): EconomyState {
    return useCityStore.getState().economy
  }

  reset(): void {
    this.lastUpdateHour = -1
  }

  serialize(): unknown {
    return this.getState()
  }

  deserialize(data: unknown): void {
    // Economy state is managed by cityStore
  }
}
