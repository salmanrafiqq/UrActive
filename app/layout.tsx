'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/lib/providers'
import { Navigation } from '@/components/navigation'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Navigation />
          <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
