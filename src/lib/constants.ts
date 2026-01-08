// ============================================
// Grid Constants
// ============================================

export const GRID_SIZE = 64 // 64x64 tiles
export const TILE_SIZE = 1 // 1 unit per tile in world space
export const TILE_HEIGHT = 0.1 // Base tile height

// ============================================
// Camera Constants
// ============================================

export const CAMERA_DEFAULT_ZOOM = 1
export const CAMERA_MIN_ZOOM = 5
export const CAMERA_MAX_ZOOM = 50
export const CAMERA_PAN_SPEED = 0.5
export const CAMERA_ZOOM_SPEED = 0.1
export const CAMERA_ROTATION_SPEED = 2
export const CAMERA_ANGLE = 45 // Isometric angle in degrees

// ============================================
// Game Speed Constants
// ============================================

export const GAME_SPEEDS = {
  paused: 0,
  normal: 1,
  fast: 3,
  ultra: 10,
} as const

export const TICK_RATE = 60 // FPS
export const SIMULATION_TICK_MS = 1000 / TICK_RATE
export const GAME_MINUTE_MS = 500 // Real ms per game minute at normal speed

// ============================================
// Economy Constants
// ============================================

export const STARTING_BALANCE = 50000
export const MIN_TAX_RATE = 0
export const MAX_TAX_RATE = 20
export const DEFAULT_TAX_RATE = 9

export const TAX_INCOME_PER_RESIDENT = 10
export const TAX_INCOME_PER_WORKER = 15
export const TAX_INCOME_PER_INDUSTRY = 20

// ============================================
// Population Constants
// ============================================

export const BASE_HAPPINESS = 50
export const MAX_HAPPINESS = 100
export const MIN_HAPPINESS = 0

export const BASE_HEALTH = 70
export const BASE_EDUCATION = 50

export const POPULATION_GROWTH_RATE = 0.01 // Per day
export const MIGRATION_FACTOR = 0.5 // Based on happiness

// ============================================
// Zone Constants
// ============================================

export const ZONE_COLORS = {
  residential: '#48bb78',
  commercial: '#4299e1',
  industrial: '#ecc94b',
} as const

export const DEMAND_MIN = -100
export const DEMAND_MAX = 100
export const DEMAND_DECAY_RATE = 0.1

// ============================================
// Traffic Constants
// ============================================

export const MAX_VEHICLES = 200
export const VEHICLE_SPEED = 2 // Units per second
export const VEHICLE_SPAWN_RATE = 0.1 // Per building per minute
export const CONGESTION_THRESHOLD = 0.7

// ============================================
// Service Constants
// ============================================

export const SERVICE_RADIUS = {
  police: 10,
  fire: 12,
  health: 15,
  education: 8,
  power: 20,
  water: 15,
} as const

export const SERVICE_EFFICIENCY_DECAY = 0.1 // Per tile outside radius

// ============================================
// Day/Night Constants
// ============================================

export const DAY_START_HOUR = 6
export const DAY_END_HOUR = 20
export const HOURS_PER_DAY = 24
export const MINUTES_PER_HOUR = 60

// ============================================
// Rendering Constants
// ============================================

export const SHADOW_MAP_SIZE = 2048
export const AMBIENT_LIGHT_DAY = 0.7
export const AMBIENT_LIGHT_NIGHT = 0.2
export const DIRECTIONAL_LIGHT_DAY = 0.8
export const DIRECTIONAL_LIGHT_NIGHT = 0.1

// ============================================
// UI Constants
// ============================================

export const MINIMAP_SIZE = 200
export const TOOLTIP_DELAY = 500
export const NOTIFICATION_DURATION = 5000
export const AUTOSAVE_INTERVAL = 60000 // 1 minute

// ============================================
// Input Key Mappings
// ============================================

export const KEY_BINDINGS = {
  // Camera
  pan_up: ['w', 'ArrowUp'],
  pan_down: ['s', 'ArrowDown'],
  pan_left: ['a', 'ArrowLeft'],
  pan_right: ['d', 'ArrowRight'],
  zoom_in: ['+', '='],
  zoom_out: ['-', '_'],
  rotate_left: ['q'],
  rotate_right: ['e'],
  center: ['f'],
  
  // Building
  rotate_building: ['r'],
  demolish: ['Delete', 'Backspace'],
  cancel: ['Escape'],
  
  // Game
  pause: ['Space', 'p'],
  speed_normal: ['1'],
  speed_fast: ['2'],
  speed_ultra: ['3'],
  
  // System
  save: ['F1'],
  load: ['F2'],
  toggle_grid: ['g'],
  toggle_overlay: ['o'],
} as const

// ============================================
// Local Storage Keys
// ============================================

export const STORAGE_KEYS = {
  SAVE_DATA: 'mycity_save',
  SETTINGS: 'mycity_settings',
  LANGUAGE: 'mycity_language',
} as const

// ============================================
// Model Paths
// ============================================

export const MODEL_PATHS = {
  buildings: '/models/buildings/',
  roads: '/models/roads/',
  vehicles: '/models/vehicles/',
  environment: '/models/environment/',
} as const

// ============================================
// Version
// ============================================

export const GAME_VERSION = '0.1.0'
export const SAVE_VERSION = '1'
