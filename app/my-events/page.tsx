'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getUserRegistrations, getEventById } from '@/lib/database'
import { getCurrentUser } from '@/lib/auth'
import { ProtectedRoute } from '@/components/protected-route'

interface Event {
  id: string
  title: string
  description?: string
  category?: string
  date: string
  location: string
  organizerId?: string
  capacity?: number
  image?: string
  [key: string]: any
}

export default function MyEventsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [pastEvents, setPastEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const fetchUserEvents = async () => {
      try {
        const user = await getCurrentUser()
        setCurrentUser(user)
        
        if (!user) {
          setIsLoading(false)
          return
        }
        
        // Get all event IDs the user is registered for
        const registrationIds = await getUserRegistrations(user.uid)
        
        if (!registrationIds || registrationIds.length === 0) {
          setUpcomingEvents([])
          setPastEvents([])
          setIsLoading(false)
          return
        }

        // Fetch full event details for each registration
        const eventDetails = await Promise.all(
          registrationIds.map(eventId => getEventById(eventId))
        )

        // Filter out null events and separate into upcoming/past
        const validEvents = eventDetails.filter((event) => event !== null) as Event[]
        const now = new Date()

        const upcoming = validEvents.filter((event) => {
          const eventDate = new Date(event.date)
          return eventDate >= now
        })

        const past = validEvents.filter((event) => {
          const eventDate = new Date(event.date)
          return eventDate < now
        })

        setUpcomingEvents(upcoming)
        setPastEvents(past)
      } catch (err: any) {
        console.error('Failed to load events:', err)
        setError(err.message || 'Failed to load your events')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserEvents()
  }, [])

  const displayEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Loading your events...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">My Events</h1>
            <p className="text-slate-600">Track your registered events</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">My Events</h1>
            <p className="text-slate-600">Track your registered events</p>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
              activeTab === 'upcoming'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
              activeTab === 'past'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Past Events
          </button>
        </div>

        {/* Empty State */}
        {displayEvents.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-600 text-lg mb-6">
              {activeTab === 'upcoming'
                ? "You haven't registered for any upcoming events yet."
                : 'No past events found.'}
            </p>
            <Link href="/discover" className="btn-primary inline-block">
              Browse Events
            </Link>
          </div>
        ) : (
          /* Events Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayEvents.map((event) => (
              <Link key={event.id} href={`/event/${event.id}`}>
                <div className="event-card cursor-pointer h-full">
                  {/* Image */}
                  {event.image ? (
                    <div className="relative">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      {event.category && (
                        <span className="absolute top-3 left-3 badge bg-primary text-white">
                          {event.category}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center rounded-t-lg">
                      <span className="text-white text-sm font-semibold">No image</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2">
                      {event.title}
                    </h3>

                    <div className="space-y-2 text-sm text-slate-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-primary" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-primary" />
                        <span>{event.location || 'TBA'}</span>
                      </div>
                      {event.capacity && (
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-primary" />
                          <span>Capacity: {event.capacity}</span>
                        </div>
                      )}
                    </div>

                    <button className="w-full btn-primary text-sm py-2">
                      View Details
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
