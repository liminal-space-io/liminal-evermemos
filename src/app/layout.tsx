import type { Metadata } from 'next'
import { Cormorant_Garamond, Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Arc Memory — Liminal Space × EverMemOS',
  description: 'Memory for who you\'re becoming. AI that remembers every moment of your inner transformation — and reflects your arc back to you.',
  openGraph: {
    title: 'Arc Memory — Liminal Space × EverMemOS',
    description: 'Memory for who you\'re becoming.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
