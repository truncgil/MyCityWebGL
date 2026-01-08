import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Truncgil MyCity WebGL',
  description: 'İzometrik şehir yapma simülasyonu - Kendi metropolünüzü inşa edin!',
  keywords: ['city builder', 'simulation', 'webgl', 'isometric', 'game'],
  authors: [{ name: 'Truncgil' }],
  openGraph: {
    title: 'Truncgil MyCity WebGL',
    description: 'İzometrik şehir yapma simülasyonu',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="overflow-hidden">
        {children}
      </body>
    </html>
  )
}
