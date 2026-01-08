'use client'

import { useState } from 'react'
import { useCityStore } from '@/stores/cityStore'
import { formatMoney } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function BudgetPanel() {
  const [expanded, setExpanded] = useState(false)
  const economy = useCityStore((state) => state.economy)
  const setTaxRate = useCityStore((state) => state.setTaxRate)
  
  const netIncome = economy.income - economy.expenses
  
  return (
    <div className="panel">
      {/* Collapsed view */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-4 px-4 py-3 w-full hover:bg-panel-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <div className="text-left">
            <div className={cn(
              'stat-value text-sm',
              economy.balance >= 0 ? 'text-green-400' : 'text-red-400'
            )}>
              {formatMoney(economy.balance)}
            </div>
            <div className="stat-label">Bütçe</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xl">{netIncome >= 0 ? '📈' : '📉'}</span>
          <div className="text-left">
            <div className={cn(
              'stat-value text-sm',
              netIncome >= 0 ? 'text-green-400' : 'text-red-400'
            )}>
              {netIncome >= 0 ? '+' : ''}{formatMoney(netIncome)}
            </div>
            <div className="stat-label">Net/Ay</div>
          </div>
        </div>
        
        <span className={cn(
          'text-gray-400 transition-transform',
          expanded && 'rotate-180'
        )}>
          ▼
        </span>
      </button>
      
      {/* Expanded view */}
      {expanded && (
        <div className="border-t border-panel-border p-4 animate-slide-down">
          {/* Income breakdown */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Gelirler</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Konut Vergisi</span>
                <span className="text-green-400">+{formatMoney(economy.taxIncome.residential)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ticari Vergi</span>
                <span className="text-green-400">+{formatMoney(economy.taxIncome.commercial)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sanayi Vergisi</span>
                <span className="text-green-400">+{formatMoney(economy.taxIncome.industrial)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-panel-border pt-1 mt-1">
                <span>Toplam Gelir</span>
                <span className="text-green-400">{formatMoney(economy.income)}</span>
              </div>
            </div>
          </div>
          
          {/* Expenses breakdown */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Giderler</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Hizmetler</span>
                <span className="text-red-400">-{formatMoney(economy.serviceExpenses.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bakım</span>
                <span className="text-red-400">-{formatMoney(economy.maintenanceExpenses)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-panel-border pt-1 mt-1">
                <span>Toplam Gider</span>
                <span className="text-red-400">{formatMoney(economy.expenses)}</span>
              </div>
            </div>
          </div>
          
          {/* Tax rate controls */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Vergi Oranları</h4>
            <div className="space-y-3">
              {(['residential', 'commercial', 'industrial'] as const).map((zone) => (
                <div key={zone} className="flex items-center gap-3">
                  <span className={cn(
                    'w-3 h-3 rounded-full',
                    zone === 'residential' && 'bg-city-residential',
                    zone === 'commercial' && 'bg-city-commercial',
                    zone === 'industrial' && 'bg-city-industrial'
                  )} />
                  <span className="text-sm text-gray-400 w-16">
                    {zone === 'residential' ? 'Konut' : zone === 'commercial' ? 'Ticari' : 'Sanayi'}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={economy.taxRates[zone]}
                    onChange={(e) => setTaxRate(zone, Number(e.target.value))}
                    className="flex-1 accent-city-accent"
                  />
                  <span className="text-sm font-mono w-10 text-right">
                    {economy.taxRates[zone]}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
