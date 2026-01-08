/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // WebGL ve Three.js için gerekli ayarlar
  webpack: (config) => {
    // GLSL shader dosyaları için loader
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ['raw-loader', 'glslify-loader'],
    })
    
    return config
  },
  
  // Statik dosya optimizasyonu
  images: {
    unoptimized: true,
  },
  
  // Transpile edilecek paketler
  transpilePackages: ['three'],
}

module.exports = nextConfig
