import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  GameState,
  GameMode,
  OverlayType,
  GridPosition,
  GameTime,
  GameSpeed,
} from '@/types/game.types'
import { STORAGE_KEYS, GAME_SPEEDS } from '@/lib/constants'

interface GameStore {
  // Game State
  mode: GameMode
  selectedBuilding: string | null
  selectedZone: 'residential' | 'commercial' | 'industrial' | null
  hoveredTile: GridPosition | null
  clickedBuildingId: string | null // Currently clicked building for showing service radius
  overlay: OverlayType
  isPlacing: boolean
  rotation: number
  
  // Game Time
  gameTime: GameTime
  
  // UI State
  isPaused: boolean
  showGrid: boolean
  showUI: boolean
  
  // Actions
  setMode: (mode: GameMode) => void
  setSelectedBuilding: (buildingId: string | null) => void
  setSelectedZone: (zone: 'residential' | 'commercial' | 'industrial' | null) => void
  setHoveredTile: (position: GridPosition | null) => void
  setClickedBuilding: (buildingId: string | null) => void
  setOverlay: (overlay: OverlayType) => void
  setIsPlacing: (isPlacing: boolean) => void
  rotateBuilding: () => void
  setRotation: (rotation: number) => void
  
  // Time Actions
  setGameSpeed: (speed: GameSpeed) => void
  togglePause: () => void
  advanceTime: (minutes: number) => void
  
  // UI Actions
  toggleGrid: () => void
  toggleUI: () => void
  
  // Reset
  reset: () => void
}

const initialGameTime: GameTime = {
  day: 1,
  hour: 8,
  minute: 0,
  totalMinutes: 0,
  speed: 'normal',
  isDaytime: true,
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial State
      mode: 'build',
      selectedBuilding: null,
      selectedZone: null,
      hoveredTile: null,
      clickedBuildingId: null,
      overlay: 'none',
      isPlacing: false,
      rotation: 0,
      
      gameTime: initialGameTime,
      
      isPaused: false,
      showGrid: true,
      showUI: true,
      
      // Actions
      setMode: (mode) => set({ 
        mode, 
        selectedBuilding: mode !== 'build' ? null : get().selectedBuilding,
        selectedZone: mode !== 'zone' ? null : get().selectedZone,
        clickedBuildingId: null,
      }),
      
      setSelectedBuilding: (buildingId) => set({ 
        selectedBuilding: buildingId,
        mode: buildingId ? 'build' : get().mode,
      }),
      
      setSelectedZone: (zone) => set({ 
        selectedZone: zone,
        mode: zone ? 'zone' : get().mode,
      }),
      
      setHoveredTile: (position) => set({ hoveredTile: position }),
      
      setClickedBuilding: (buildingId) => set({ clickedBuildingId: buildingId }),
      
      setOverlay: (overlay) => set({ overlay }),
      
      setIsPlacing: (isPlacing) => set({ isPlacing }),
      
      rotateBuilding: () => set((state) => ({
        rotation: (state.rotation + 90) % 360,
      })),
      
      setRotation: (rotation) => set({ rotation }),
      
      // Time Actions
      setGameSpeed: (speed) => set((state) => ({
        gameTime: { ...state.gameTime, speed },
        isPaused: speed === 'paused',
      })),
      
      togglePause: () => set((state) => ({
        isPaused: !state.isPaused,
        gameTime: {
          ...state.gameTime,
          speed: state.isPaused ? 'normal' : 'paused',
        },
      })),
      
      advanceTime: (minutes) => set((state) => {
        const totalMinutes = state.gameTime.totalMinutes + minutes
        const totalHours = Math.floor(totalMinutes / 60)
        const hour = totalHours % 24
        const day = Math.floor(totalHours / 24) + 1
        const minute = totalMinutes % 60
        const isDaytime = hour >= 6 && hour < 20
        
        return {
          gameTime: {
            ...state.gameTime,
            totalMinutes,
            hour,
            minute,
            day,
            isDaytime,
          },
        }
      }),
      
      // UI Actions
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
      toggleUI: () => set((state) => ({ showUI: !state.showUI })),
      
      // Reset
      reset: () => set({
        mode: 'build',
        selectedBuilding: null,
        selectedZone: null,
        hoveredTile: null,
        clickedBuildingId: null,
        overlay: 'none',
        isPlacing: false,
        rotation: 0,
        gameTime: initialGameTime,
        isPaused: false,
        showGrid: true,
        showUI: true,
      }),
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      partialize: (state) => ({
        showGrid: state.showGrid,
        overlay: state.overlay,
      }),
    }
  )
)
