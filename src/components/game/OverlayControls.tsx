'use client'

import { useGameStore } from '@/stores/gameStore'
import { OverlayType, ZoneType } from '@/types/game.types'
import { cn } from '@/lib/utils'

const OVERLAYS: { id: OverlayType; icon: string; label: string; color: string }[] = [
  { id: 'none', icon: '🗺️', label: 'Normal', color: 'gray' },
  { id: 'traffic', icon: '🚗', label: 'Trafik', color: 'red' },
  { id: 'pollution', icon: '💨', label: 'Kirlilik', color: 'yellow' },
  { id: 'landValue', icon: '💰', label: 'Arazi Değeri', color: 'green' },
  { id: 'crime', icon: '🚔', label: 'Suç', color: 'purple' },
  { id: 'happiness', icon: '😊', label: 'Mutluluk', color: 'blue' },
  { id: 'services', icon: '🏥', label: 'Hizmetler', color: 'teal' },
]

const ZONES: { id: ZoneType; icon: string; label: string; color: string }[] = [
  { id: 'residential', icon: '🏠', label: 'Konut', color: 'city-residential' },
  { id: 'commercial', icon: '🏪', label: 'Ticari', color: 'city-commercial' },
  { id: 'industrial', icon: '🏭', label: 'Sanayi', color: 'city-industrial' },
]

export function OverlayControls() {
  const overlay = useGameStore((state) => state.overlay)
  const setOverlay = useGameStore((state) => state.setOverlay)
  const mode = useGameStore((state) => state.mode)
  const selectedZone = useGameStore((state) => state.selectedZone)
  const setSelectedZone = useGameStore((state) => state.setSelectedZone)
  const setMode = useGameStore((state) => state.setMode)
  
  const handleZoneSelect = (zone: ZoneType) => {
    setSelectedZone(zone)
    setMode('zone')
  }
  
  return (
    <div className="panel flex flex-col gap-2 px-3 py-2">
      {/* Zone controls (only in zone mode) */}
      {mode === 'zone' && (
        <div className="flex items-center gap-1 pb-2 border-b border-panel-border">
          {ZONES.map((zone) => (
            <button
              key={zone.id}
              onClick={() => handleZoneSelect(zone.id)}
              className={cn(
                'flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all',
                'hover:bg-gray-700',
                selectedZone === zone.id && `bg-${zone.color}/20 border border-${zone.color}`
              )}
              style={{
                backgroundColor: selectedZone === zone.id ? 
                  (zone.id === 'residential' ? 'rgba(72, 187, 120, 0.2)' :
                   zone.id === 'commercial' ? 'rgba(66, 153, 225, 0.2)' :
                   'rgba(236, 201, 75, 0.2)') : undefined,
                borderColor: selectedZone === zone.id ?
                  (zone.id === 'residential' ? '#48bb78' :
                   zone.id === 'commercial' ? '#4299e1' :
                   '#ecc94b') : undefined,
                borderWidth: selectedZone === zone.id ? '1px' : undefined,
              }}
              title={zone.label}
            >
              <span className="text-xl">{zone.icon}</span>
              <span className="text-[10px] text-gray-400">{zone.label}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Overlay controls */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400 mr-2">Katman:</span>
        {OVERLAYS.slice(0, 4).map((item) => (
          <button
            key={item.id}
            onClick={() => setOverlay(item.id)}
            className={cn(
              'w-8 h-8 rounded flex items-center justify-center transition-all',
              'hover:bg-gray-700',
              overlay === item.id && 'bg-city-accent/20 border border-city-accent'
            )}
            title={item.label}
          >
            <span className="text-sm">{item.icon}</span>
          </button>
        ))}
        
        {/* More overlays dropdown */}
        <div className="relative group">
          <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-700">
            <span className="text-sm">⋯</span>
          </button>
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
            <div className="panel p-2 space-y-1">
              {OVERLAYS.slice(4).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setOverlay(item.id)}
                  className={cn(
                    'w-full px-3 py-2 rounded text-left text-sm flex items-center gap-2',
                    'hover:bg-gray-700',
                    overlay === item.id && 'bg-city-accent/20'
                  )}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
