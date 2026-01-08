'use client'

import { useMemo } from 'react'
import { useCityStore } from '@/stores/cityStore'
import { useGameStore } from '@/stores/gameStore'

/**
 * Hook for accessing simulation data
 */
export function useSimulation() {
  const economy = useCityStore((state) => state.economy)
  const population = useCityStore((state) => state.population)
  const zoneDemand = useCityStore((state) => state.zoneDemand)
  const buildings = useCityStore((state) => state.buildings)
  const roads = useCityStore((state) => state.roads)
  const gameTime = useGameStore((state) => state.gameTime)

  // Calculate city statistics
  const stats = useMemo(() => {
    const totalBuildings = buildings.size
    const totalRoads = roads.size
    
    // Calculate zone counts
    let residential = 0
    let commercial = 0
    let industrial = 0
    let services = 0
    let parks = 0

    const catalog = useCityStore.getState().buildingCatalog
    
    buildings.forEach((building) => {
      const def = catalog.find(d => d.id === building.definitionId)
      if (!def) return

      switch (def.category) {
        case 'residential':
          residential++
          break
        case 'commercial':
          commercial++
          break
        case 'industrial':
          industrial++
          break
        case 'service':
          services++
          break
        case 'park':
          parks++
          break
      }
    })

    return {
      totalBuildings,
      totalRoads,
      residential,
      commercial,
      industrial,
      services,
      parks,
    }
  }, [buildings, roads])

  // Calculate city rating
  const cityRating = useMemo(() => {
    const happinessFactor = population.happiness / 100
    const employmentFactor = population.employmentRate
    const financeFactor = economy.balance > 0 ? 1 : 0.5
    const growthFactor = zoneDemand.residential > 0 ? 1 : 0.8

    const rating = (
      happinessFactor * 0.3 +
      employmentFactor * 0.3 +
      financeFactor * 0.2 +
      growthFactor * 0.2
    ) * 100

    return Math.round(rating)
  }, [population, economy, zoneDemand])

  return {
    economy,
    population,
    zoneDemand,
    gameTime,
    stats,
    cityRating,
  }
}

/**
 * Hook for economy data
 */
export function useEconomy() {
  const economy = useCityStore((state) => state.economy)
  const setTaxRate = useCityStore((state) => state.setTaxRate)
  const updateBalance = useCityStore((state) => state.updateBalance)

  const netIncome = economy.income - economy.expenses

  return {
    balance: economy.balance,
    income: economy.income,
    expenses: economy.expenses,
    netIncome,
    taxRates: economy.taxRates,
    taxIncome: economy.taxIncome,
    serviceExpenses: economy.serviceExpenses,
    setTaxRate,
    updateBalance,
  }
}

/**
 * Hook for population data
 */
export function usePopulation() {
  const population = useCityStore((state) => state.population)

  return {
    total: population.total,
    employed: population.employed,
    unemployed: population.unemployed,
    employmentRate: population.employmentRate,
    happiness: population.happiness,
    health: population.health,
    education: population.education,
    growth: population.growth,
    demographics: population.demographics,
  }
}

/**
 * Hook for zone demand data
 */
export function useZoneDemand() {
  const zoneDemand = useCityStore((state) => state.zoneDemand)

  const maxDemand = Math.max(
    zoneDemand.residential,
    zoneDemand.commercial,
    zoneDemand.industrial
  )

  return {
    residential: zoneDemand.residential,
    commercial: zoneDemand.commercial,
    industrial: zoneDemand.industrial,
    maxDemand,
    // Normalized values (0-100)
    residentialNorm: Math.max(0, Math.min(100, zoneDemand.residential)),
    commercialNorm: Math.max(0, Math.min(100, zoneDemand.commercial)),
    industrialNorm: Math.max(0, Math.min(100, zoneDemand.industrial)),
  }
}
