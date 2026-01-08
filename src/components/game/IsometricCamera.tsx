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
  KEY_BINDINGS,
} from '@/lib/constants'
import { clamp, gridToWorld, worldToGrid } from '@/lib/utils'

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
  const isDraggingRef = useRef(false)
  const lastMouseRef = useRef({ x: 0, y: 0 })
  
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
      if (e.button === 1 || e.button === 2) { // Middle or right click
        isDraggingRef.current = true
        lastMouseRef.current = { x: e.clientX, y: e.clientY }
      }
    }
    
    const handleMouseUp = (e: MouseEvent) => {
      isDraggingRef.current = false
    }
    
    const handleClick = (e: MouseEvent) => {
      if (e.button !== 0) return // Only left click
      
      // Raycast to find clicked tile
      if (!cameraRef.current) return
      
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
      const intersectPoint = new THREE.Vector3()
      raycasterRef.current.ray.intersectPlane(planeRef.current, intersectPoint)
      
      if (intersectPoint) {
        const gridPos = worldToGrid({
          x: intersectPoint.x,
          y: intersectPoint.y,
          z: intersectPoint.z,
        })
        
        // Handle action based on mode
        if (mode === 'build' && selectedBuilding) {
          placeBuilding(selectedBuilding, gridPos, rotation)
        } else if (mode === 'road') {
          placeRoad(gridPos)
        } else if (mode === 'zone' && selectedZone) {
          setZone(gridPos, selectedZone)
        } else if (mode === 'demolish') {
          const tile = getTile(gridPos)
          if (tile?.buildingId) {
            removeBuilding(tile.buildingId)
          } else if (tile?.roadId) {
            removeRoad(tile.roadId)
          }
        }
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
    canvas.addEventListener('click', handleClick)
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('contextmenu', handleContextMenu)
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('click', handleClick)
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [gl, mode, selectedBuilding, rotation, selectedZone, placeBuilding, placeRoad, setZone, removeBuilding, removeRoad, getTile])
  
  // Update hovered tile
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
    
    // Update hovered tile
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
