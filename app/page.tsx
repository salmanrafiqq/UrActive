'use client'

import Link from 'next/link'
import { Calendar, Users, Zap, Loader } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          // User is logged in, redirect to discover page
          router.push('/discover')
          setIsAuthenticated(true)
        } else {
          // User is not logged in, show landing page
          setIsAuthenticated(false)
          setIsLoading(false)
        }
      } catch (err) {
        setIsAuthenticated(false)
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Welcome to URActive
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Discover and manage university events effortlessly at the University of Regina.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/signup" className="btn-primary px-8 py-3 text-lg">
              Get Started
            </Link>
            <Link href="/discover" className="btn-outline px-8 py-3 text-lg">
              Browse Events
            </Link>
          </div>
        </div>
      </section>

      {/* Why URActive Section */}
      <section className="bg-slate-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-slate-900">
            Why URActive?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="card p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Discover Events</h3>
              <p className="text-slate-600">
                Find campus events tailored to your interests and academic goals.
              </p>
            </div>

            {/* Card 2 */}
            <div className="card p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Easy RSVP</h3>
              <p className="text-slate-600">
                Reserve your spot at events with a single click and track your schedule.
              </p>
            </div>

            {/* Card 3 */}
            <div className="card p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Create Events</h3>
              <p className="text-slate-600">
                Student organizers can easily create and manage campus events.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Join URActive</h2>
          <p className="text-lg text-green-50 mb-8">
            Connect with your university community through exciting events and activities.
          </p>
          <Link href="/signup" className="inline-block bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors">
            Sign Up Now
          </Link>
        </div>
      </section>
    </div>
  )
}
