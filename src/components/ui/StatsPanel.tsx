'use client'

import { useCityStore } from '@/stores/cityStore'
import { useGameStore } from '@/stores/gameStore'
import { formatNumber, formatTime } from '@/lib/utils'

export function StatsPanel() {
  const population = useCityStore((state) => state.population)
  const zoneDemand = useCityStore((state) => state.zoneDemand)
  const gameTime = useGameStore((state) => state.gameTime)
  
  return (
    <div className="panel px-4 py-3">
      <div className="flex items-center gap-6">
        {/* Time */}
        <div className="flex items-center gap-2">
          <span className="text-xl">{gameTime.isDaytime ? '☀️' : '🌙'}</span>
          <div>
            <div className="stat-value text-sm">
              {formatTime(gameTime.hour, gameTime.minute)}
            </div>
            <div className="stat-label">Gün {gameTime.day}</div>
          </div>
        </div>
        
        {/* Population */}
        <div className="flex items-center gap-2">
          <span className="text-xl">👥</span>
          <div>
            <div className="stat-value text-sm text-city-residential">
              {formatNumber(population.total)}
            </div>
            <div className="stat-label">Nüfus</div>
          </div>
        </div>
        
        {/* Employment */}
        <div className="flex items-center gap-2">
          <span className="text-xl">💼</span>
          <div>
            <div className="stat-value text-sm text-city-commercial">
              {population.total > 0 
                ? `${Math.round(population.employmentRate * 100)}%` 
                : '-'}
            </div>
            <div className="stat-label">İstihdam</div>
          </div>
        </div>
        
        {/* Happiness */}
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {population.happiness >= 70 ? '😊' : population.happiness >= 40 ? '😐' : '😢'}
          </span>
          <div>
            <div className="stat-value text-sm text-yellow-400">
              {Math.round(population.happiness)}%
            </div>
            <div className="stat-label">Mutluluk</div>
          </div>
        </div>
        
        {/* Zone Demand */}
        <div className="flex items-center gap-3 border-l border-panel-border pl-4 ml-2">
          <div className="flex flex-col items-center">
            <div 
              className="w-3 bg-city-residential rounded-t"
              style={{ height: `${Math.max(4, zoneDemand.residential / 2)}px` }}
            />
            <span className="text-[10px] text-gray-400 mt-1">R</span>
          </div>
          <div className="flex flex-col items-center">
            <div 
              className="w-3 bg-city-commercial rounded-t"
              style={{ height: `${Math.max(4, zoneDemand.commercial / 2)}px` }}
            />
            <span className="text-[10px] text-gray-400 mt-1">C</span>
          </div>
          <div className="flex flex-col items-center">
            <div 
              className="w-3 bg-city-industrial rounded-t"
              style={{ height: `${Math.max(4, zoneDemand.industrial / 2)}px` }}
            />
            <span className="text-[10px] text-gray-400 mt-1">I</span>
          </div>
        </div>
      </div>
    </div>
  )
}
