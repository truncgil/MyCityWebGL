'use client'

import { useRef, useEffect, Suspense } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { 
  OrbitControls, 
  PerspectiveCamera,
  Environment,
  Sky,
  Grid as DreiGrid,
} from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

import { useGameStore } from '@/stores/gameStore'
import { useCityStore } from '@/stores/cityStore'
import { IsometricCamera } from './IsometricCamera'
import { WorldGrid } from './WorldGrid'
import { BuildingRenderer } from './BuildingRenderer'
import { RoadRenderer } from './RoadRenderer'
import { TileHighlight } from './TileHighlight'
import { DayNightLighting } from './DayNightLighting'
import { GameLoop } from './GameLoop'
import { TrafficSystem } from './TrafficSystem'
import { PedestrianSystem } from './PedestrianSystem'
import { StatusOverlay } from './StatusOverlay'
import { GRID_SIZE, TILE_SIZE } from '@/lib/constants'

// Scene setup component
function SceneSetup() {
  const { scene } = useThree()
  
  useEffect(() => {
    scene.background = new THREE.Color('#1a202c')
  }, [scene])
  
  return null
}

// Grid initialization
function GridInitializer() {
  const initializeGrid = useCityStore((state) => state.initializeGrid)
  const tiles = useCityStore((state) => state.tiles)
  
  useEffect(() => {
    if (tiles.size === 0) {
      initializeGrid()
    }
  }, [initializeGrid, tiles.size])
  
  return null
}

// Main 3D Scene content
function Scene() {
  const showGrid = useGameStore((state) => state.showGrid)
  const gameTime = useGameStore((state) => state.gameTime)
  
  return (
    <>
      <SceneSetup />
      <GridInitializer />
      
      {/* Camera */}
      <IsometricCamera />
      
      {/* Lighting */}
      <DayNightLighting isDaytime={gameTime.isDaytime} hour={gameTime.hour} />
      
      {/* Environment */}
      <fog attach="fog" args={['#1a202c', 30, 100]} />
      
      {/* Ground Plane */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[GRID_SIZE * TILE_SIZE * 2, GRID_SIZE * TILE_SIZE * 2]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      
      {/* Grid Visualization */}
      {showGrid && (
        <DreiGrid
          position={[0, 0.01, 0]}
          args={[GRID_SIZE * TILE_SIZE, GRID_SIZE * TILE_SIZE]}
          cellSize={TILE_SIZE}
          cellThickness={0.5}
          cellColor="#4a5568"
          sectionSize={TILE_SIZE * 10}
          sectionThickness={1}
          sectionColor="#718096"
          fadeDistance={50}
          fadeStrength={1}
          infiniteGrid={false}
        />
      )}
      
      {/* Game Loop Logic */}
      <GameLoop />
      
      {/* World Grid (zones) */}
      <WorldGrid />
      
      {/* Buildings */}
      <BuildingRenderer />
      
      {/* Roads */}
      <RoadRenderer />
      
      {/* Traffic */}
      <TrafficSystem />
      
      {/* Pedestrians */}
      <PedestrianSystem />

      {/* Status Icons */}
      <StatusOverlay />
      
      {/* Tile Highlight */}
      <TileHighlight />
      
      {/* Post-processing */}
      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.9}
          luminanceSmoothing={0.9}
          intensity={0.3}
        />
        <Vignette darkness={0.5} offset={0.3} />
      </EffectComposer>
    </>
  )
}

// Main GameCanvas component
export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  return (
    <div ref={containerRef} className="w-full h-full game-canvas">
      <Canvas
        shadows
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}
