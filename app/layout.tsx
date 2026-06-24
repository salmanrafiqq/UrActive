import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/lib/providers'
import { Navigation } from '@/components/navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'URActive - Event Management Platform',
  description: 'Discover and manage events at University of Regina',
  icons: {
    icon: 'https://urcourses.uregina.ca/pluginfile.php/1/theme_boost_union/favicon/64x64/1778700389/favicon.ico',
  },
}

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
