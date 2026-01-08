import { GridPosition, ZoneType } from './game.types'

// ============================================
// Building Category Types
// ============================================

export type BuildingCategory =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'service'
  | 'transport'
  | 'utility'
  | 'landmark'
  | 'park'

// ============================================
// Building Definition
// ============================================

export interface BuildingDefinition {
  id: string
  name: string
  nameKey: string // i18n key
  category: BuildingCategory
  zone: ZoneType | null
  
  // Visual
  modelPath: string
  thumbnailPath: string
  
  // Grid size
  size: {
    width: number
    depth: number
  }
  
  // Costs
  cost: number
  maintenanceCost: number
  
  // Stats
  capacity: number // residents or workers
  jobs: number
  pollution: number
  crimeRate: number
  fireRisk: number
  
  // Requirements
  requirements: {
    population?: number
    budget?: number
    unlocks?: string[]
  }
  
  // Effects
  effects: {
    landValue: number
    happiness: number
    traffic: number
    power: number
    water: number
  }
  
  // Services
  serviceRadius?: number
  serviceType?: ServiceType
}

// ============================================
// Building Instance
// ============================================

export interface Building {
  id: string
  definitionId: string
  position: GridPosition
  rotation: number // 0, 90, 180, 270
  
  // State
  level: number
  occupancy: number // 0-100%
  condition: number // 0-100%
  isActive: boolean
  isPowered: boolean
  hasWater: boolean
  
  // Time tracking
  createdAt: number
  lastUpdate: number
}

// ============================================
// Service Types
// ============================================

export type ServiceType =
  | 'police'
  | 'fire'
  | 'health'
  | 'education'
  | 'power'
  | 'water'
  | 'waste'

export interface ServiceBuilding extends Building {
  serviceType: ServiceType
  serviceRadius: number
  efficiency: number
  coverage: GridPosition[]
}

// ============================================
// Building Catalog
// ============================================

export const BUILDING_CATEGORIES: Record<BuildingCategory, {
  name: string
  nameKey: string
  icon: string
  color: string
}> = {
  residential: {
    name: 'Konut',
    nameKey: 'category.residential',
    icon: '🏠',
    color: '#48bb78',
  },
  commercial: {
    name: 'Ticari',
    nameKey: 'category.commercial',
    icon: '🏪',
    color: '#4299e1',
  },
  industrial: {
    name: 'Sanayi',
    nameKey: 'category.industrial',
    icon: '🏭',
    color: '#ecc94b',
  },
  service: {
    name: 'Hizmet',
    nameKey: 'category.service',
    icon: '🏛️',
    color: '#9f7aea',
  },
  transport: {
    name: 'Ulaşım',
    nameKey: 'category.transport',
    icon: '🚗',
    color: '#667eea',
  },
  utility: {
    name: 'Altyapı',
    nameKey: 'category.utility',
    icon: '⚡',
    color: '#f6ad55',
  },
  landmark: {
    name: 'Simge',
    nameKey: 'category.landmark',
    icon: '🏛️',
    color: '#fc8181',
  },
  park: {
    name: 'Park',
    nameKey: 'category.park',
    icon: '🌳',
    color: '#68d391',
  },
}

// ============================================
// Default Building Definitions (Kenney Models)
// ============================================

export const DEFAULT_BUILDINGS: BuildingDefinition[] = [
  // Utility Buildings (MUST BE FIRST FOR UNLOCKS)
  {
    id: 'power_plant_coal',
    name: 'Kömür Santrali',
    nameKey: 'building.power_plant_coal',
    category: 'utility',
    zone: null,
    modelPath: '/models/industrial/building-p.glb',
    thumbnailPath: '/sprites/buildings/power_plant.png',
    size: { width: 2, depth: 2 },
    cost: 1500,
    maintenanceCost: 100,
    capacity: 0,
    jobs: 20,
    pollution: 50,
    crimeRate: 0,
    fireRisk: 5,
    requirements: {},
    effects: {
      landValue: -20,
      happiness: -10,
      traffic: 10,
      power: 1000, // Provides 1000 power
      water: -10,
    },
    serviceRadius: 50,
    serviceType: 'power',
  },
  {
    id: 'water_tower',
    name: 'Su Deposu',
    nameKey: 'building.water_tower',
    category: 'utility',
    zone: null,
    modelPath: '/models/industrial/detail-tank.glb',
    thumbnailPath: '/sprites/buildings/water_tower.png',
    size: { width: 1, depth: 1 },
    cost: 800,
    maintenanceCost: 40,
    capacity: 0,
    jobs: 2,
    pollution: 0,
    crimeRate: 0,
    fireRisk: 0,
    requirements: {},
    effects: {
      landValue: -5,
      happiness: 0,
      traffic: 2,
      power: -5,
      water: 1000, // Provides 1000 water
    },
    serviceRadius: 40,
    serviceType: 'water',
  },

  // Residential - Kenney Models
  {
    id: 'building_small_a',
    name: 'Küçük Ev A',
    nameKey: 'building.small_a',
    category: 'residential',
    zone: 'residential',
    modelPath: '/models/models/building-small-a.glb',
    thumbnailPath: '/sprites/buildings/house_small.png',
    size: { width: 1, depth: 1 },
    cost: 100,
    maintenanceCost: 5,
    capacity: 4,
    jobs: 0,
    pollution: 0,
    crimeRate: 0,
    fireRisk: 1,
    requirements: {},
    effects: {
      landValue: 5,
      happiness: 5,
      traffic: 1,
      power: -5,
      water: -5,
    },
  },
  {
    id: 'building_small_b',
    name: 'Küçük Ev B',
    nameKey: 'building.small_b',
    category: 'residential',
    zone: 'residential',
    modelPath: '/models/models/building-small-b.glb',
    thumbnailPath: '/sprites/buildings/house_medium.png',
    size: { width: 1, depth: 1 },
    cost: 150,
    maintenanceCost: 8,
    capacity: 6,
    jobs: 0,
    pollution: 0,
    crimeRate: 0,
    fireRisk: 1,
    requirements: {},
    effects: {
      landValue: 8,
      happiness: 6,
      traffic: 1,
      power: -8,
      water: -8,
    },
  },
  {
    id: 'building_small_c',
    name: 'Orta Bina C',
    nameKey: 'building.small_c',
    category: 'residential',
    zone: 'residential',
    modelPath: '/models/models/building-small-c.glb',
    thumbnailPath: '/sprites/buildings/apartment_low.png',
    size: { width: 1, depth: 1 },
    cost: 250,
    maintenanceCost: 12,
    capacity: 12,
    jobs: 0,
    pollution: 0,
    crimeRate: 1,
    fireRisk: 1,
    requirements: { population: 100 },
    effects: {
      landValue: 12,
      happiness: 7,
      traffic: 2,
      power: -15,
      water: -15,
    },
  },
  {
    id: 'building_small_d',
    name: 'Apartman D',
    nameKey: 'building.small_d',
    category: 'residential',
    zone: 'residential',
    modelPath: '/models/models/building-small-d.glb',
    thumbnailPath: '/sprites/buildings/apartment_high.png',
    size: { width: 1, depth: 1 },
    cost: 400,
    maintenanceCost: 20,
    capacity: 24,
    jobs: 0,
    pollution: 0,
    crimeRate: 1,
    fireRisk: 2,
    requirements: { population: 300 },
    effects: {
      landValue: 15,
      happiness: 6,
      traffic: 4,
      power: -25,
      water: -25,
    },
  },

  // Commercial Buildings
  {
    id: 'commercial_shop_a',
    name: 'Küçük Dükkan',
    nameKey: 'building.shop_a',
    category: 'commercial',
    zone: 'commercial',
    modelPath: '/models/commercial/building-a.glb',
    thumbnailPath: '/sprites/buildings/shop_small.png',
    size: { width: 1, depth: 1 },
    cost: 200,
    maintenanceCost: 10,
    capacity: 0,
    jobs: 4,
    pollution: 2,
    crimeRate: 1,
    fireRisk: 2,
    requirements: {},
    effects: {
      landValue: 5,
      happiness: 2,
      traffic: 5,
      power: -10,
      water: -5,
    },
  },
  {
    id: 'commercial_office_a',
    name: 'Ofis Binası',
    nameKey: 'building.office_a',
    category: 'commercial',
    zone: 'commercial',
    modelPath: '/models/commercial/building-c.glb',
    thumbnailPath: '/sprites/buildings/office_small.png',
    size: { width: 1, depth: 1 },
    cost: 500,
    maintenanceCost: 25,
    capacity: 0,
    jobs: 12,
    pollution: 1,
    crimeRate: 0,
    fireRisk: 1,
    requirements: { population: 100 },
    effects: {
      landValue: 10,
      happiness: 5,
      traffic: 8,
      power: -20,
      water: -10,
    },
  },
  {
    id: 'commercial_skyscraper',
    name: 'Gökdelen',
    nameKey: 'building.skyscraper',
    category: 'commercial',
    zone: 'commercial',
    modelPath: '/models/commercial/building-skyscraper-a.glb',
    thumbnailPath: '/sprites/buildings/skyscraper.png',
    size: { width: 2, depth: 2 },
    cost: 2000,
    maintenanceCost: 100,
    capacity: 0,
    jobs: 50,
    pollution: 5,
    crimeRate: 2,
    fireRisk: 3,
    requirements: { population: 1000 },
    effects: {
      landValue: 20,
      happiness: 10,
      traffic: 30,
      power: -100,
      water: -50,
    },
  },

  // Industrial Buildings
  {
    id: 'industrial_factory_small',
    name: 'Küçük Atölye',
    nameKey: 'building.factory_small',
    category: 'industrial',
    zone: 'industrial',
    modelPath: '/models/industrial/building-a.glb',
    thumbnailPath: '/sprites/buildings/factory_small.png',
    size: { width: 1, depth: 1 },
    cost: 300,
    maintenanceCost: 15,
    capacity: 0,
    jobs: 8,
    pollution: 15,
    crimeRate: 2,
    fireRisk: 3,
    requirements: {},
    effects: {
      landValue: -10,
      happiness: -5,
      traffic: 10,
      power: -20,
      water: -10,
    },
  },
  {
    id: 'industrial_factory_large',
    name: 'Büyük Fabrika',
    nameKey: 'building.factory_large',
    category: 'industrial',
    zone: 'industrial',
    modelPath: '/models/industrial/building-j.glb',
    thumbnailPath: '/sprites/buildings/factory_large.png',
    size: { width: 2, depth: 2 },
    cost: 800,
    maintenanceCost: 40,
    capacity: 0,
    jobs: 25,
    pollution: 30,
    crimeRate: 3,
    fireRisk: 5,
    requirements: { population: 200 },
    effects: {
      landValue: -20,
      happiness: -10,
      traffic: 25,
      power: -50,
      water: -30,
    },
  },
  {
    id: 'building_garage',
    name: 'Depo',
    nameKey: 'building.garage',
    category: 'industrial',
    zone: 'industrial',
    modelPath: '/models/models/building-garage.glb',
    thumbnailPath: '/sprites/buildings/warehouse.png',
    size: { width: 1, depth: 1 },
    cost: 200,
    maintenanceCost: 10,
    capacity: 0,
    jobs: 5,
    pollution: 5,
    crimeRate: 1,
    fireRisk: 2,
    requirements: {},
    effects: {
      landValue: -2,
      happiness: 0,
      traffic: 5,
      power: -10,
      water: -5,
    },
  },
  
  // Parks & Environment - Kenney Models
  {
    id: 'grass',
    name: 'Çim Alan',
    nameKey: 'building.grass',
    category: 'park',
    zone: null,
    modelPath: '/models/models/grass.glb',
    thumbnailPath: '/sprites/buildings/park_small.png',
    size: { width: 1, depth: 1 },
    cost: 50,
    maintenanceCost: 2,
    capacity: 0,
    jobs: 0,
    pollution: -2,
    crimeRate: 0,
    fireRisk: 0,
    requirements: {},
    effects: {
      landValue: 5,
      happiness: 3,
      traffic: 0,
      power: 0,
      water: -1,
    },
  },
  {
    id: 'grass_trees',
    name: 'Ağaçlık Alan',
    nameKey: 'building.grass_trees',
    category: 'park',
    zone: null,
    modelPath: '/models/models/grass-trees.glb',
    thumbnailPath: '/sprites/buildings/park_small.png',
    size: { width: 1, depth: 1 },
    cost: 100,
    maintenanceCost: 5,
    capacity: 0,
    jobs: 0,
    pollution: -5,
    crimeRate: 0,
    fireRisk: 0,
    requirements: {},
    effects: {
      landValue: 10,
      happiness: 8,
      traffic: 0,
      power: 0,
      water: -2,
    },
  },
  {
    id: 'grass_trees_tall',
    name: 'Yüksek Ağaçlar',
    nameKey: 'building.grass_trees_tall',
    category: 'park',
    zone: null,
    modelPath: '/models/models/grass-trees-tall.glb',
    thumbnailPath: '/sprites/buildings/park_large.png',
    size: { width: 1, depth: 1 },
    cost: 150,
    maintenanceCost: 8,
    capacity: 0,
    jobs: 0,
    pollution: -8,
    crimeRate: -1,
    fireRisk: 0,
    requirements: {},
    effects: {
      landValue: 15,
      happiness: 12,
      traffic: 0,
      power: 0,
      water: -3,
    },
  },
  {
    id: 'pavement',
    name: 'Kaldırım',
    nameKey: 'building.pavement',
    category: 'transport',
    zone: null,
    modelPath: '/models/models/pavement.glb',
    thumbnailPath: '/sprites/buildings/pavement.png',
    size: { width: 1, depth: 1 },
    cost: 20,
    maintenanceCost: 1,
    capacity: 0,
    jobs: 0,
    pollution: 0,
    crimeRate: 0,
    fireRisk: 0,
    requirements: {},
    effects: {
      landValue: 2,
      happiness: 1,
      traffic: 0,
      power: 0,
      water: 0,
    },
  },
  {
    id: 'pavement_fountain',
    name: 'Çeşmeli Meydan',
    nameKey: 'building.pavement_fountain',
    category: 'landmark',
    zone: null,
    modelPath: '/models/models/pavement-fountain.glb',
    thumbnailPath: '/sprites/buildings/fountain.png',
    size: { width: 1, depth: 1 },
    cost: 500,
    maintenanceCost: 25,
    capacity: 0,
    jobs: 1,
    pollution: 0,
    crimeRate: -2,
    fireRisk: 0,
    requirements: { population: 200 },
    effects: {
      landValue: 25,
      happiness: 15,
      traffic: 1,
      power: -5,
      water: -10,
    },
  },
]

// ============================================
// Road Definitions (Kenney Models)
// ============================================

export const ROAD_MODELS = {
  straight: '/models/models/road-straight.glb',
  straight_lightposts: '/models/models/road-straight-lightposts.glb',
  corner: '/models/models/road-corner.glb',
  intersection: '/models/models/road-intersection.glb',
  split: '/models/models/road-split.glb',
}
