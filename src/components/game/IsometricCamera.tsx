'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import * as THREE from 'three'

import { useGameStore } from '@/stores/gameStore'
import { useCityStore } from '@/stores/cityStore'
import {
  CAMERA_DEFAULT_ZOOM,
  CAMERA_MIN_ZOOM,
  CAMERA_MAX_ZOOM,
  CAMERA_PAN_SPEED,
  CAMERA_ZOOM_SPEED,
  GRID_SIZE,
  TILE_SIZE,
} from '@/lib/constants'
import { clamp, worldToGrid, gridPositionToKey } from '@/lib/utils'
import { GridPosition } from '@/types/game.types'

export function IsometricCamera() {
  const cameraRef = useRef<THREE.OrthographicCamera>(null)
  const { size, gl } = useThree()
  
  const setHoveredTile = useGameStore((state) => state.setHoveredTile)
  const mode = useGameStore((state) => state.mode)
  const selectedBuilding = useGameStore((state) => state.selectedBuilding)
  const rotation = useGameStore((state) => state.rotation)
  
  const placeBuilding = useCityStore((state) => state.placeBuilding)
  const placeRoad = useCityStore((state) => state.placeRoad)
  const removeBuilding = useCityStore((state) => state.removeBuilding)
  const removeRoad = useCityStore((state) => state.removeRoad)
  const setZone = useCityStore((state) => state.setZone)
  const getTile = useCityStore((state) => state.getTile)
  const selectedZone = useGameStore((state) => state.selectedZone)
  
  // Camera state
  const zoomRef = useRef(CAMERA_DEFAULT_ZOOM)
  const targetRef = useRef(new THREE.Vector3(0, 0, 0))
  const keysRef = useRef(new Set<string>())
  
  // Interaction state
  const isDraggingRef = useRef(false) // For camera pan
  const isLeftMouseDownRef = useRef(false) // For building
  const lastMouseRef = useRef({ x: 0, y: 0 })
  const lastPlacedTileRef = useRef<string | null>(null)
  
  // Raycaster for mouse picking
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  
  // Calculate isometric camera position
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return
    
    const camera = cameraRef.current
    const distance = 50
    const angle = Math.PI / 4 // 45 degrees
    const elevation = Math.PI / 6 // 30 degrees
    
    camera.position.set(
      targetRef.current.x + distance * Math.cos(angle) * Math.cos(elevation),
      targetRef.current.y + distance * Math.sin(elevation),
      targetRef.current.z + distance * Math.sin(angle) * Math.cos(elevation)
    )
    
    camera.lookAt(targetRef.current)
    camera.zoom = zoomRef.current
    camera.updateProjectionMatrix()
  }, [])
  
  // Handle placement logic
  const handlePlacement = useCallback((gridPos: GridPosition) => {
    const key = gridPositionToKey(gridPos)
    
    // Don't place on the same tile twice in one drag action (unless it's a different tool that allows it)
    if (lastPlacedTileRef.current === key) return
    
    console.log('[Placement] Mode:', mode, 'Position:', gridPos, 'Key:', key)
    
    let placed = false
    
    if (mode === 'build' && selectedBuilding) {
      console.log('[Placement] Attempting to place building:', selectedBuilding)
      const result = placeBuilding(selectedBuilding, gridPos, rotation)
      if (result) placed = true
      console.log('[Placement] Building result:', result)
    } else if (mode === 'road') {
      console.log('[Placement] Attempting to place road')
      const result = placeRoad(gridPos)
      if (result) placed = true
      console.log('[Placement] Road result:', result)
    } else if (mode === 'zone' && selectedZone) {
      setZone(gridPos, selectedZone)
      placed = true
    } else if (mode === 'demolish') {
      const tile = getTile(gridPos)
      if (tile?.buildingId) {
        removeBuilding(tile.buildingId)
        placed = true
      } else if (tile?.roadId) {
        removeRoad(tile.roadId)
        placed = true
      }
    }
    
    if (placed) {
      lastPlacedTileRef.current = key
    }
  }, [mode, selectedBuilding, rotation, selectedZone, placeBuilding, placeRoad, setZone, removeBuilding, removeRoad, getTile])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase())
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])
  
  // Handle mouse events
  useEffect(() => {
    const canvas = gl.domElement
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      
      // Handle dragging for camera pan
      if (isDraggingRef.current) {
        const deltaX = e.clientX - lastMouseRef.current.x
        const deltaY = e.clientY - lastMouseRef.current.y
        
        targetRef.current.x -= deltaX * CAMERA_PAN_SPEED * 0.05
        targetRef.current.z -= deltaY * CAMERA_PAN_SPEED * 0.05
        
        // Clamp to grid bounds
        const halfGrid = (GRID_SIZE * TILE_SIZE) / 2
        targetRef.current.x = clamp(targetRef.current.x, -halfGrid, halfGrid)
        targetRef.current.z = clamp(targetRef.current.z, -halfGrid, halfGrid)
      }
      
      lastMouseRef.current = { x: e.clientX, y: e.clientY }
    }
    
    const handleMouseDown = (e: MouseEvent) => {
      // Middle or Right click -> Pan
      if (e.button === 1 || e.button === 2) { 
        isDraggingRef.current = true
        lastMouseRef.current = { x: e.clientX, y: e.clientY }
      } 
      // Left click
      else if (e.button === 0) {
        // If we are in a building mode, left click means PAINT/BUILD, not pan
        const isBuildingMode = mode === 'road' || mode === 'zone' || mode === 'build' || mode === 'demolish'
        
        if (isBuildingMode) {
          isLeftMouseDownRef.current = true
          lastPlacedTileRef.current = null // Reset for new drag
        } else {
          // If not in build mode (e.g. view mode), left click can pan too
          isDraggingRef.current = true
          lastMouseRef.current = { x: e.clientX, y: e.clientY }
        }
      }
    }
    
    const handleMouseUp = (e: MouseEvent) => {
      isDraggingRef.current = false
      if (e.button === 0) {
        isLeftMouseDownRef.current = false
        lastPlacedTileRef.current = null
      }
    }
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -CAMERA_ZOOM_SPEED * 2 : CAMERA_ZOOM_SPEED * 2
      zoomRef.current = clamp(
        zoomRef.current + delta,
        CAMERA_MIN_ZOOM * 0.1,
        CAMERA_MAX_ZOOM * 0.1
      )
    }
    
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }
    
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('contextmenu', handleContextMenu)
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [gl, mode]) // Re-bind if mode changes to update drag vs pan logic
  
  // Update loop
  useFrame(() => {
    if (!cameraRef.current) return
    
    // Update camera based on keyboard input
    const keys = keysRef.current
    
    if (keys.has('w') || keys.has('arrowup')) {
      targetRef.current.z -= CAMERA_PAN_SPEED
    }
    if (keys.has('s') || keys.has('arrowdown')) {
      targetRef.current.z += CAMERA_PAN_SPEED
    }
    if (keys.has('a') || keys.has('arrowleft')) {
      targetRef.current.x -= CAMERA_PAN_SPEED
    }
    if (keys.has('d') || keys.has('arrowright')) {
      targetRef.current.x += CAMERA_PAN_SPEED
    }
    if (keys.has('f')) {
      targetRef.current.set(0, 0, 0)
    }
    
    // Clamp to grid bounds
    const halfGrid = (GRID_SIZE * TILE_SIZE) / 2
    targetRef.current.x = clamp(targetRef.current.x, -halfGrid, halfGrid)
    targetRef.current.z = clamp(targetRef.current.z, -halfGrid, halfGrid)
    
    // Update camera position
    updateCameraPosition()
    
    // Raycasting for hover and placement
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
    const intersectPoint = new THREE.Vector3()
    raycasterRef.current.ray.intersectPlane(planeRef.current, intersectPoint)
    
    if (intersectPoint) {
      const gridPos = worldToGrid({
        x: intersectPoint.x,
        y: intersectPoint.y,
        z: intersectPoint.z,
      })
      
      if (gridPos.x >= 0 && gridPos.x < GRID_SIZE && gridPos.z >= 0 && gridPos.z < GRID_SIZE) {
        setHoveredTile(gridPos)
        
        // Drag-to-build logic
        if (isLeftMouseDownRef.current) {
          handlePlacement(gridPos)
        }
      } else {
        setHoveredTile(null)
      }
    }
  })
  
  // Calculate frustum size based on aspect ratio
  const frustumSize = 20
  const aspect = size.width / size.height
  
  return (
    <OrthographicCamera
      ref={cameraRef}
      makeDefault
      position={[50, 50, 50]}
      zoom={CAMERA_DEFAULT_ZOOM * 0.1}
      left={-frustumSize * aspect}
      right={frustumSize * aspect}
      top={frustumSize}
      bottom={-frustumSize}
      near={0.1}
      far={1000}
    />
  )
}
