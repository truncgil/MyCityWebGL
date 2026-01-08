'use client'

import { useGameStore } from '@/stores/gameStore'
import { useCityStore } from '@/stores/cityStore'
import { useUIStore } from '@/stores/uiStore'
import { GameMode } from '@/types/game.types'
import { cn } from '@/lib/utils'

const TOOLS: { id: GameMode; icon: string; label: string; shortcut: string }[] = [
  { id: 'build', icon: '🏗️', label: 'İnşa', shortcut: 'B' },
  { id: 'road', icon: '🛤️', label: 'Yol', shortcut: 'R' },
  { id: 'zone', icon: '📐', label: 'Bölge', shortcut: 'Z' },
  { id: 'demolish', icon: '🔨', label: 'Yıkım', shortcut: 'X' },
  { id: 'view', icon: '👁️', label: 'Görünüm', shortcut: 'V' },
]

export function Toolbar() {
  const mode = useGameStore((state) => state.mode)
  const setMode = useGameStore((state) => state.setMode)
  const rotation = useGameStore((state) => state.rotation)
  const rotateBuilding = useGameStore((state) => state.rotateBuilding)
  const toggleGrid = useGameStore((state) => state.toggleGrid)
  const showGrid = useGameStore((state) => state.showGrid)
  
  const save = useCityStore((state) => state.save)
  const reset = useCityStore((state) => state.reset)
  
  const addNotification = useUIStore((state) => state.addNotification)
  
  const handleSave = () => {
    save()
    addNotification({
      type: 'success',
      title: 'Kaydedildi',
      message: 'Şehir başarıyla kaydedildi.',
    })
  }
  
  const handleReset = () => {
    if (confirm('Şehri sıfırlamak istediğinize emin misiniz?')) {
      reset()
      addNotification({
        type: 'info',
        title: 'Sıfırlandı',
        message: 'Yeni bir şehir başlatıldı.',
      })
    }
  }
  
  return (
    <div className="panel flex items-center gap-2 px-3 py-2">
      {/* Tool buttons */}
      <div className="flex items-center gap-1 border-r border-panel-border pr-3 mr-2">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setMode(tool.id)}
            className={cn(
              'flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all',
              'hover:bg-gray-700',
              mode === tool.id && 'bg-city-accent/20 border border-city-accent'
            )}
            title={`${tool.label} (${tool.shortcut})`}
          >
            <span className="text-xl">{tool.icon}</span>
            <span className="text-[10px] text-gray-400">{tool.label}</span>
          </button>
        ))}
      </div>
      
      {/* Rotation control (only in build mode) */}
      {mode === 'build' && (
        <div className="flex items-center gap-2 border-r border-panel-border pr-3 mr-2">
          <button
            onClick={rotateBuilding}
            className="btn-icon flex flex-col items-center"
            title="Döndür (R)"
          >
            <span className="text-xl">🔄</span>
            <span className="text-[10px] text-gray-400">{rotation}°</span>
          </button>
        </div>
      )}
      
      {/* Grid toggle */}
      <button
        onClick={toggleGrid}
        className={cn(
          'btn-icon',
          showGrid && 'bg-gray-700'
        )}
        title="Izgara (G)"
      >
        <span className="text-xl">📏</span>
      </button>
      
      {/* Save/Reset */}
      <div className="flex items-center gap-1 border-l border-panel-border pl-3 ml-2">
        <button
          onClick={handleSave}
          className="btn-icon"
          title="Kaydet (F1)"
        >
          <span className="text-xl">💾</span>
        </button>
        <button
          onClick={handleReset}
          className="btn-icon"
          title="Sıfırla"
        >
          <span className="text-xl">🔄</span>
        </button>
      </div>
    </div>
  )
}
