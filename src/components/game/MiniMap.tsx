'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useCityStore } from '@/stores/cityStore'
import { GRID_SIZE, MINIMAP_SIZE, ZONE_COLORS } from '@/lib/constants'
import { gridPositionToKey } from '@/lib/utils'

export function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const tiles = useCityStore((state) => state.tiles)
  const buildings = useCityStore((state) => state.buildings)
  const roads = useCityStore((state) => state.roads)
  
  // Draw minimap
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const scale = MINIMAP_SIZE / GRID_SIZE
    
    // Clear
    ctx.fillStyle = '#1a202c'
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE)
    
    // Draw tiles
    tiles.forEach((tile) => {
      const x = tile.position.x * scale
      const y = tile.position.z * scale
      
      // Draw zone
      if (tile.zone) {
        ctx.fillStyle = ZONE_COLORS[tile.zone] + '40' // 25% opacity
        ctx.fillRect(x, y, scale, scale)
      }
      
      // Draw road
      if (tile.roadId) {
        ctx.fillStyle = '#4a5568'
        ctx.fillRect(x, y, scale, scale)
      }
      
      // Draw building
      if (tile.buildingId) {
        const building = buildings.get(tile.buildingId)
        if (building) {
          const def = useCityStore.getState().buildingCatalog.find(
            d => d.id === building.definitionId
          )
          if (def) {
            switch (def.category) {
              case 'residential':
                ctx.fillStyle = '#48bb78'
                break
              case 'commercial':
                ctx.fillStyle = '#4299e1'
                break
              case 'industrial':
                ctx.fillStyle = '#ecc94b'
                break
              case 'service':
                ctx.fillStyle = '#9f7aea'
                break
              case 'park':
                ctx.fillStyle = '#68d391'
                break
              default:
                ctx.fillStyle = '#a0aec0'
            }
            ctx.fillRect(x, y, scale, scale)
          }
        }
      }
    })
    
    // Draw grid lines
    ctx.strokeStyle = '#2d3748'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= GRID_SIZE; i += 8) {
      ctx.beginPath()
      ctx.moveTo(i * scale, 0)
      ctx.lineTo(i * scale, MINIMAP_SIZE)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(0, i * scale)
      ctx.lineTo(MINIMAP_SIZE, i * scale)
      ctx.stroke()
    }
    
    // Draw border
    ctx.strokeStyle = '#4a5568'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE)
    
  }, [tiles, buildings, roads])
  
  // Stats
  const stats = useMemo(() => {
    let buildingCount = 0
    let roadCount = 0
    let zonedCount = 0
    
    tiles.forEach((tile) => {
      if (tile.buildingId) buildingCount++
      if (tile.roadId) roadCount++
      if (tile.zone) zonedCount++
    })
    
    return { buildingCount, roadCount, zonedCount }
  }, [tiles])
  
  return (
    <div className="panel">
      <div className="panel-header">🗺️ Mini Harita</div>
      <div className="p-2">
        {/* Canvas */}
        <div className="minimap">
          <canvas
            ref={canvasRef}
            width={MINIMAP_SIZE}
            height={MINIMAP_SIZE}
            className="rounded"
          />
        </div>
        
        {/* Stats */}
        <div className="mt-2 grid grid-cols-3 gap-1 text-center text-xs">
          <div className="bg-gray-800 rounded py-1">
            <div className="text-city-residential font-mono">{stats.buildingCount}</div>
            <div className="text-gray-500">Bina</div>
          </div>
          <div className="bg-gray-800 rounded py-1">
            <div className="text-gray-300 font-mono">{stats.roadCount}</div>
            <div className="text-gray-500">Yol</div>
          </div>
          <div className="bg-gray-800 rounded py-1">
            <div className="text-city-commercial font-mono">{stats.zonedCount}</div>
            <div className="text-gray-500">Alan</div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-city-residential" />
            <span className="text-gray-400">Konut</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-city-commercial" />
            <span className="text-gray-400">Ticari</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-city-industrial" />
            <span className="text-gray-400">Sanayi</span>
          </div>
        </div>
      </div>
    </div>
  )
}
