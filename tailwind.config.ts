import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // MyCity tema renkleri
        city: {
          primary: '#1a365d',
          secondary: '#2d3748',
          accent: '#38b2ac',
          success: '#48bb78',
          warning: '#ed8936',
          danger: '#f56565',
          // Zonlama renkleri
          residential: '#48bb78',
          commercial: '#4299e1',
          industrial: '#ecc94b',
        },
        // UI renkleri
        panel: {
          bg: 'rgba(26, 32, 44, 0.95)',
          border: 'rgba(74, 85, 104, 0.5)',
          hover: 'rgba(45, 55, 72, 0.95)',
        },
      },
      fontFamily: {
        game: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config
