import * as THREE from 'three'
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

/**
 * Model cache entry
 */
interface CacheEntry {
  model: THREE.Group
  timestamp: number
}

/**
 * Model loader with caching support
 * Handles GLTF/GLB models from Kenney's City Builder kit
 */
export class ModelLoader {
  private static instance: ModelLoader | null = null
  
  private gltfLoader: GLTFLoader
  private dracoLoader: DRACOLoader
  private cache: Map<string, CacheEntry> = new Map()
  private loadingPromises: Map<string, Promise<THREE.Group>> = new Map()
  
  // Cache settings
  private maxCacheSize = 100
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  private constructor() {
    // Setup DRACO loader for compressed models
    this.dracoLoader = new DRACOLoader()
    this.dracoLoader.setDecoderPath('/draco/')
    
    // Setup GLTF loader
    this.gltfLoader = new GLTFLoader()
    this.gltfLoader.setDRACOLoader(this.dracoLoader)
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ModelLoader {
    if (!ModelLoader.instance) {
      ModelLoader.instance = new ModelLoader()
    }
    return ModelLoader.instance
  }

  /**
   * Load a GLTF model
   */
  async load(path: string): Promise<THREE.Group> {
    // Check cache first
    const cached = this.cache.get(path)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.model.clone()
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(path)
    if (existingPromise) {
      const model = await existingPromise
      return model.clone()
    }

    // Start loading
    const loadPromise = this.loadModel(path)
    this.loadingPromises.set(path, loadPromise)

    try {
      const model = await loadPromise
      
      // Add to cache
      this.addToCache(path, model)
      
      return model.clone()
    } finally {
      this.loadingPromises.delete(path)
    }
  }

  /**
   * Internal model loading
   */
  private async loadModel(path: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        path,
        (gltf: GLTF) => {
          const model = gltf.scene

          // Process model
          this.processModel(model)

          resolve(model)
        },
        (progress) => {
          // Progress callback
          console.log(`[ModelLoader] Loading ${path}: ${Math.round((progress.loaded / progress.total) * 100)}%`)
        },
        (error) => {
          console.error(`[ModelLoader] Failed to load ${path}:`, error)
          reject(error)
        }
      )
    })
  }

  /**
   * Process loaded model (setup materials, shadows, etc.)
   */
  private processModel(model: THREE.Group): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Enable shadows
        child.castShadow = true
        child.receiveShadow = true

        // Optimize materials
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.roughness = 0.8
          child.material.metalness = 0.1
        }
      }
    })
  }

  /**
   * Add model to cache
   */
  private addToCache(path: string, model: THREE.Group): void {
    // Clean old entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanCache()
    }

    this.cache.set(path, {
      model,
      timestamp: Date.now(),
    })
  }

  /**
   * Clean old cache entries
   */
  private cleanCache(): void {
    const now = Date.now()
    const toDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.cacheTimeout) {
        toDelete.push(key)
      }
    })

    toDelete.forEach((key) => this.cache.delete(key))

    // If still too full, remove oldest entries
    if (this.cache.size >= this.maxCacheSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const removeCount = Math.floor(this.cache.size * 0.25)
      entries.slice(0, removeCount).forEach(([key]) => this.cache.delete(key))
    }
  }

  /**
   * Preload multiple models
   */
  async preload(paths: string[]): Promise<void> {
    await Promise.all(paths.map((path) => this.load(path)))
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size
  }

  /**
   * Dispose loader resources
   */
  dispose(): void {
    this.clearCache()
    this.dracoLoader.dispose()
  }
}

/**
 * Procedural building generator
 * Creates simple 3D buildings when GLTF models are not available
 */
export class ProceduralBuildingGenerator {
  /**
   * Generate a simple building mesh
   */
  static generate(
    width: number,
    depth: number,
    height: number,
    color: string,
    category: string
  ): THREE.Group {
    const group = new THREE.Group()

    // Main building body
    const bodyGeometry = new THREE.BoxGeometry(
      width * 0.9,
      height,
      depth * 0.9
    )
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.7,
      metalness: 0.1,
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = height / 2
    body.castShadow = true
    body.receiveShadow = true
    group.add(body)

    // Roof
    const roofHeight = height * 0.1
    const roofGeometry = new THREE.BoxGeometry(width * 0.95, roofHeight, depth * 0.95)
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color).multiplyScalar(0.7),
      roughness: 0.8,
    })
    const roof = new THREE.Mesh(roofGeometry, roofMaterial)
    roof.position.y = height + roofHeight / 2
    roof.castShadow = true
    group.add(roof)

    // Windows (for larger buildings)
    if (height > 1) {
      const windowMaterial = new THREE.MeshStandardMaterial({
        color: '#87CEEB',
        emissive: '#4299e1',
        emissiveIntensity: 0.3,
        roughness: 0.1,
        metalness: 0.8,
      })

      const windowRows = Math.floor(height / 0.4)
      const windowCols = Math.max(1, Math.floor(width / 0.3))

      for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
          const windowGeometry = new THREE.BoxGeometry(0.15, 0.12, 0.02)
          const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial)
          
          windowMesh.position.set(
            (col - (windowCols - 1) / 2) * 0.25,
            0.3 + row * 0.35,
            depth * 0.45
          )
          
          group.add(windowMesh)
        }
      }
    }

    return group
  }
}

// Singleton getter
export function getModelLoader(): ModelLoader {
  return ModelLoader.getInstance()
}
