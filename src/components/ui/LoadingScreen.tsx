'use client'

export function LoadingScreen() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          <span className="text-city-accent">My</span>City
        </h1>
        <p className="text-gray-400 text-center">WebGL</p>
      </div>
      
      {/* Spinner */}
      <div className="spinner mb-4" />
      
      {/* Loading text */}
      <p className="text-gray-400 animate-pulse">Şehir yükleniyor...</p>
      
      {/* Tips */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-sm text-gray-500">
          💡 İpucu: WASD tuşları ile kamerayı hareket ettirin
        </p>
      </div>
    </div>
  )
}
