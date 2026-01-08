'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamic imports to prevent hydration errors for components using localStorage state
const GameCanvas = dynamic(() => import('@/components/game/GameCanvas'), { ssr: false })
const Toolbar = dynamic(() => import('@/components/ui/Toolbar').then(mod => mod.Toolbar), { ssr: false })
const StatsPanel = dynamic(() => import('@/components/ui/StatsPanel').then(mod => mod.StatsPanel), { ssr: false })
const BudgetPanel = dynamic(() => import('@/components/ui/BudgetPanel').then(mod => mod.BudgetPanel), { ssr: false })
const BuildingPalette = dynamic(() => import('@/components/game/BuildingPalette').then(mod => mod.BuildingPalette), { ssr: false })
const MiniMap = dynamic(() => import('@/components/game/MiniMap').then(mod => mod.MiniMap), { ssr: false })
const TimeControls = dynamic(() => import('@/components/game/TimeControls').then(mod => mod.TimeControls), { ssr: false })
const OverlayControls = dynamic(() => import('@/components/game/OverlayControls').then(mod => mod.OverlayControls), { ssr: false })

import { LoadingScreen } from '@/components/ui/LoadingScreen'

export default function Home() {
  return (
    <main className="relative w-screen h-screen bg-gray-900 overflow-hidden">
      {/* Loading Screen */}
      <Suspense fallback={<LoadingScreen />}>
        {/* 3D Game Canvas */}
        <div className="absolute inset-0">
          <GameCanvas />
        </div>

        {/* UI Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Bar - Stats & Budget */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-auto">
            <StatsPanel />
            <BudgetPanel />
          </div>

          {/* Left Side - Building Palette */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 p-4 pointer-events-auto">
            <BuildingPalette />
          </div>

          {/* Right Side - Mini Map */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 p-4 pointer-events-auto">
            <MiniMap />
          </div>

          {/* Bottom Bar - Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-end pointer-events-auto">
            <TimeControls />
            <Toolbar />
            <OverlayControls />
          </div>
        </div>
      </Suspense>
    </main>
  )
}
