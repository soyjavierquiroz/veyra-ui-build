import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Cormorant_Garamond } from 'next/font/google'
import { ClarityInit } from '@/components/funnel/clarity-init'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})
const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Mujer, No Le Escribas — Reto 7 Días para Volver a Ti',
  description:
    'Antes de escribirle desde ansiedad, haz una P.A.U.S.A. y vuelve a ti. El primer portal del Método P.A.U.S.A. dentro de GranDiosa Mujer.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#150a24',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${cormorant.variable}`}
    >
      <body className="font-sans antialiased bg-background overflow-x-hidden">
        <ClarityInit />
        {children}
      </body>
    </html>
  )
}
