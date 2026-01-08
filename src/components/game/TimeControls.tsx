'use client'

import { useGameStore } from '@/stores/gameStore'
import { GameSpeed } from '@/types/game.types'
import { cn } from '@/lib/utils'

const SPEEDS: { id: GameSpeed; icon: string; label: string }[] = [
  { id: 'paused', icon: '⏸️', label: 'Durdur' },
  { id: 'normal', icon: '▶️', label: 'Normal' },
  { id: 'fast', icon: '⏩', label: 'Hızlı' },
  { id: 'ultra', icon: '⏭️', label: 'Çok Hızlı' },
]

export function TimeControls() {
  const gameTime = useGameStore((state) => state.gameTime)
  const setGameSpeed = useGameStore((state) => state.setGameSpeed)
  const isPaused = useGameStore((state) => state.isPaused)
  
  return (
    <div className="panel flex items-center gap-2 px-3 py-2">
      {/* Speed buttons */}
      {SPEEDS.map((speed) => (
        <button
          key={speed.id}
          onClick={() => setGameSpeed(speed.id)}
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
            'hover:bg-gray-700',
            gameTime.speed === speed.id && 'bg-city-accent/20 border border-city-accent'
          )}
          title={speed.label}
        >
          <span className="text-lg">{speed.icon}</span>
        </button>
      ))}
      
      {/* Status indicator */}
      <div className="flex items-center gap-2 border-l border-panel-border pl-3 ml-2">
        <div className={cn(
          'w-2 h-2 rounded-full animate-pulse',
          isPaused ? 'bg-yellow-400' : 'bg-green-400'
        )} />
        <span className="text-xs text-gray-400">
          {isPaused ? 'Duraklatıldı' : 
           gameTime.speed === 'normal' ? 'Normal' :
           gameTime.speed === 'fast' ? 'Hızlı' : 'Çok Hızlı'}
        </span>
      </div>
    </div>
  )
}
