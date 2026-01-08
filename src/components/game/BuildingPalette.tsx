'use client'

import { useState, useMemo, useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useCityStore } from '@/stores/cityStore'
import { BuildingCategory, BUILDING_CATEGORIES, DEFAULT_BUILDINGS } from '@/types/building.types'
import { formatMoney, cn } from '@/lib/utils'

export function BuildingPalette() {
  const [activeCategory, setActiveCategory] = useState<BuildingCategory>('residential')
  const [searchTerm, setSearchTerm] = useState('')
  
  const mode = useGameStore((state) => state.mode)
  const selectedBuilding = useGameStore((state) => state.selectedBuilding)
  const setSelectedBuilding = useGameStore((state) => state.setSelectedBuilding)
  const setMode = useGameStore((state) => state.setMode)
  
  // Always use DEFAULT_BUILDINGS to prevent hydration issues
  const buildingCatalog = DEFAULT_BUILDINGS
  const economy = useCityStore((state) => state.economy)
  
  // Filter buildings by category and search
  
  // Filter buildings by category and search
  const filteredBuildings = useMemo(() => {
    return buildingCatalog.filter((building) => {
      const matchesCategory = building.category === activeCategory
      const matchesSearch = searchTerm === '' || 
        building.name.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [buildingCatalog, activeCategory, searchTerm])
  
  const handleSelectBuilding = (buildingId: string) => {
    setSelectedBuilding(buildingId)
    setMode('build')
  }
  
  if (mode !== 'build' && mode !== 'view') {
    return null
  }
  
  return (
    <div className="panel w-64 max-h-[70vh] flex flex-col">
      {/* Header */}
      <div className="panel-header flex items-center justify-between">
        <span>🏗️ Binalar</span>
        <span className="text-xs text-gray-400 font-normal">
          {formatMoney(economy.balance)}
        </span>
      </div>
      
      {/* Search */}
      <div className="p-2 border-b border-panel-border">
        <input
          type="text"
          placeholder="Bina ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 rounded-md text-sm
                     placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-city-accent"
        />
      </div>
      
      {/* Categories */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-panel-border">
        {(Object.keys(BUILDING_CATEGORIES) as BuildingCategory[]).map((category) => {
          const cat = BUILDING_CATEGORIES[category]
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                'px-2 py-1 rounded text-xs transition-all',
                activeCategory === category
                  ? 'bg-city-accent text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
              title={cat.name}
            >
              {cat.icon}
            </button>
          )
        })}
      </div>
      
      {/* Building list */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-2">
          {filteredBuildings.map((building) => {
            const canAfford = economy.balance >= building.cost
            const isSelected = selectedBuilding === building.id
            
            return (
              <button
                key={building.id}
                onClick={() => handleSelectBuilding(building.id)}
                disabled={!canAfford}
                className={cn(
                  'building-item flex flex-col items-center p-2 text-center',
                  isSelected && 'selected',
                  !canAfford && 'opacity-50 cursor-not-allowed'
                )}
              >
                {/* Building preview */}
                <div className={cn(
                  'w-12 h-12 rounded-lg mb-1 flex items-center justify-center text-2xl',
                  'bg-gradient-to-br',
                  building.category === 'residential' && 'from-green-600 to-green-800',
                  building.category === 'commercial' && 'from-blue-600 to-blue-800',
                  building.category === 'industrial' && 'from-yellow-600 to-yellow-800',
                  building.category === 'service' && 'from-purple-600 to-purple-800',
                  building.category === 'utility' && 'from-orange-600 to-orange-800',
                  building.category === 'park' && 'from-emerald-600 to-emerald-800',
                  building.category === 'transport' && 'from-indigo-600 to-indigo-800',
                  building.category === 'landmark' && 'from-red-600 to-red-800',
                )}>
                  {building.category === 'residential' && '🏠'}
                  {building.category === 'commercial' && '🏪'}
                  {building.category === 'industrial' && '🏭'}
                  {building.category === 'service' && '🏛️'}
                  {building.category === 'utility' && '⚡'}
                  {building.category === 'park' && '🌳'}
                  {building.category === 'transport' && '🚗'}
                  {building.category === 'landmark' && '🏛️'}
                </div>
                
                {/* Building name */}
                <span className="text-xs text-gray-300 truncate w-full" suppressHydrationWarning>
                  {building.name}
                </span>
                
                {/* Cost */}
                <span className={cn(
                  'text-xs font-mono',
                  canAfford ? 'text-green-400' : 'text-red-400'
                )}>
                  {formatMoney(building.cost)}
                </span>
                
                {/* Size indicator */}
                <span className="text-[10px] text-gray-500">
                  {building.size.width}x{building.size.depth}
                </span>
              </button>
            )
          })}
        </div>
        
        {filteredBuildings.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            Bina bulunamadı
          </div>
        )}
      </div>
      
      {/* Selected building info */}
      {selectedBuilding && (
        <div className="border-t border-panel-border p-3 bg-gray-800/50">
          {(() => {
            const building = buildingCatalog.find(b => b.id === selectedBuilding)
            if (!building) return null
            
            return (
              <div className="text-xs space-y-1">
                <div className="font-semibold text-white">{building.name}</div>
                <div className="flex justify-between text-gray-400">
                  <span>Kapasite:</span>
                  <span>{building.capacity > 0 ? building.capacity : building.jobs} 
                    {building.capacity > 0 ? ' kişi' : ' iş'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Bakım:</span>
                  <span className="text-red-400">{formatMoney(building.maintenanceCost)}/ay</span>
                </div>
                {building.pollution > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>Kirlilik:</span>
                    <span className="text-yellow-400">+{building.pollution}</span>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
