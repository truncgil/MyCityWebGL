'use client'

import { useMemo, useRef, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box, Cylinder, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

import { useCityStore } from '@/stores/cityStore'
import { Building, DEFAULT_BUILDINGS } from '@/types/building.types'
import { TILE_SIZE } from '@/lib/constants'
import { gridToWorld, gridPositionToKey } from '@/lib/utils'

// Preload all building models
DEFAULT_BUILDINGS.forEach((building) => {
  useGLTF.preload(building.modelPath)
})

// GLTF Model building component
function GLTFBuilding({
  building,
  definition,
}: {
  building: Building
  definition: ReturnType<typeof useCityStore.getState>['buildingCatalog'][0]
}) {
  const worldPos = gridToWorld(building.position)
  const { width, depth } = definition.size
  const rotationY = (building.rotation * Math.PI) / 180

  try {
    const { scene } = useGLTF(definition.modelPath)
    const clonedScene = useMemo(() => {
      const clone = scene.clone()
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      return clone
    }, [scene])

    return (
      <primitive
        object={clonedScene}
        position={[
          worldPos.x + (width * TILE_SIZE) / 2,
          0,
          worldPos.z + (depth * TILE_SIZE) / 2,
        ]}
        rotation={[0, rotationY, 0]}
        scale={[1, 1, 1]}
      />
    )
  } catch (error) {
    console.error('Failed to load model:', definition.modelPath, error)
    // Fallback to procedural if model fails
    return (
      <ProceduralBuilding building={building} definition={definition} />
    )
  }
}

// Procedural building component (fallback when no model)
function ProceduralBuilding({ 
  building, 
  definition 
}: { 
  building: Building
  definition: ReturnType<typeof useCityStore.getState>['buildingCatalog'][0] | undefined
}) {
  const meshRef = useRef<THREE.Group>(null)
  
  if (!definition) return null
  
  const worldPos = gridToWorld(building.position)
  const { width, depth } = definition.size
  
  // Generate building appearance based on category
  const { color, height, roofColor } = useMemo(() => {
    const baseHeight = 0.5 + Math.random() * 0.5
    
    switch (definition.category) {
      case 'residential':
        return {
          color: '#68d391',
          height: baseHeight * (1 + definition.capacity / 50),
          roofColor: '#c53030',
        }
      case 'commercial':
        return {
          color: '#4299e1',
          height: baseHeight * (1 + definition.jobs / 100),
          roofColor: '#2b6cb0',
        }
      case 'industrial':
        return {
          color: '#ecc94b',
          height: baseHeight * 0.8,
          roofColor: '#975a16',
        }
      case 'service':
        return {
          color: '#9f7aea',
          height: baseHeight * 1.2,
          roofColor: '#553c9a',
        }
      case 'utility':
        return {
          color: '#f6ad55',
          height: baseHeight * 0.6,
          roofColor: '#c05621',
        }
      case 'park':
        return {
          color: '#48bb78',
          height: 0.1,
          roofColor: '#276749',
        }
      default:
        return {
          color: '#a0aec0',
          height: baseHeight,
          roofColor: '#4a5568',
        }
    }
  }, [definition])
  
  // Apply rotation
  const rotationY = (building.rotation * Math.PI) / 180
  
  return (
    <group
      ref={meshRef}
      position={[
        worldPos.x + (width * TILE_SIZE) / 2,
        0,
        worldPos.z + (depth * TILE_SIZE) / 2,
      ]}
      rotation={[0, rotationY, 0]}
    >
      {definition.category === 'park' ? (
        // Park - trees and grass
        <>
          {/* Grass base */}
          <Box
            args={[width * TILE_SIZE * 0.95, 0.1, depth * TILE_SIZE * 0.95]}
            position={[0, 0.05, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color="#48bb78" />
          </Box>
          
          {/* Trees */}
          {Array.from({ length: Math.min(width * depth, 4) }).map((_, i) => {
            const tx = ((i % 2) - 0.5) * width * TILE_SIZE * 0.5
            const tz = (Math.floor(i / 2) - 0.5) * depth * TILE_SIZE * 0.5
            return (
              <group key={i} position={[tx, 0, tz]}>
                {/* Tree trunk */}
                <Cylinder
                  args={[0.05, 0.08, 0.3, 8]}
                  position={[0, 0.25, 0]}
                  castShadow
                >
                  <meshStandardMaterial color="#8B4513" />
                </Cylinder>
                {/* Tree foliage */}
                <Cylinder
                  args={[0, 0.25, 0.5, 8]}
                  position={[0, 0.55, 0]}
                  castShadow
                >
                  <meshStandardMaterial color="#228B22" />
                </Cylinder>
              </group>
            )
          })}
        </>
      ) : (
        // Regular building
        <>
          {/* Main building body */}
          <Box
            args={[
              width * TILE_SIZE * 0.85,
              height,
              depth * TILE_SIZE * 0.85,
            ]}
            position={[0, height / 2, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color={color} />
          </Box>
          
          {/* Roof */}
          <Box
            args={[
              width * TILE_SIZE * 0.9,
              height * 0.1,
              depth * TILE_SIZE * 0.9,
            ]}
            position={[0, height + height * 0.05, 0]}
            castShadow
          >
            <meshStandardMaterial color={roofColor} />
          </Box>
          
          {/* Windows (for taller buildings) */}
          {height > 0.8 && (
            <>
              {[0.3, 0.6].map((yOffset, yi) => (
                [1, -1].map((side, si) => (
                  <Box
                    key={`window-${yi}-${si}`}
                    args={[0.15, 0.1, 0.02]}
                    position={[
                      side * width * TILE_SIZE * 0.3,
                      yOffset * height,
                      depth * TILE_SIZE * 0.43,
                    ]}
                  >
                    <meshStandardMaterial 
                      color="#87CEEB" 
                      emissive="#4299e1"
                      emissiveIntensity={0.2}
                    />
                  </Box>
                ))
              ))}
            </>
          )}
          
          {/* Chimney for industrial */}
          {definition.category === 'industrial' && (
            <Cylinder
              args={[0.1, 0.1, 0.4, 8]}
              position={[width * TILE_SIZE * 0.3, height + 0.2, 0]}
              castShadow
            >
              <meshStandardMaterial color="#4a5568" />
            </Cylinder>
          )}
        </>
      )}
    </group>
  )
}

export function BuildingRenderer() {
  const buildings = useCityStore((state) => state.buildings)
  const buildingCatalog = useCityStore((state) => state.buildingCatalog)
  
  // Convert buildings map to array
  const buildingArray = useMemo(() => {
    return Array.from(buildings.values())
  }, [buildings])
  
  return (
    <group name="buildings">
      {buildingArray.map((building) => {
        const definition = buildingCatalog.find(d => d.id === building.definitionId)
        
        if (!definition) return null
        
        return (
          <Suspense 
            key={building.id} 
            fallback={
              <Box 
                args={[TILE_SIZE * 0.8, 0.5, TILE_SIZE * 0.8]}
                position={[
                  gridToWorld(building.position).x + TILE_SIZE / 2,
                  0.25,
                  gridToWorld(building.position).z + TILE_SIZE / 2,
                ]}
              >
                <meshStandardMaterial color="#718096" />
              </Box>
            }
          >
            <GLTFBuilding
              building={building}
              definition={definition}
            />
          </Suspense>
        )
      })}
    </group>
  )
}
