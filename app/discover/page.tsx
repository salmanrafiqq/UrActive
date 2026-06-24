'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Calendar, MapPin, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getAllEvents, getEventsByCategory } from '@/lib/database'
import { getCurrentUser } from '@/lib/auth'

interface Event {
  id: string
  title: string
  description: string
  category: string
  date: string
  time: string
  location: string
  organizer: string
  attendees: number
  image: string
}

const categories = ['All', 'Academic', 'Social', 'Sports & Recreation', 'Arts & Culture', 'Technology', 'Career Development', 'Wellness']

export default function DiscoverPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkAuthAndFetchEvents = async () => {
      try {
        // Check if user is authenticated
        const user = await getCurrentUser()
        if (!user) {
          router.push('/login')
          return
        }

        setIsLoading(true)
        const fetchedEvents = await getAllEvents()
        setEvents(fetchedEvents as Event[])
        setFilteredEvents(fetchedEvents as Event[])
      } catch (err: any) {
        setError(err.message || 'Failed to load events')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthAndFetchEvents()
  }, [router])

  useEffect(() => {
    let filtered = events

    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.organizer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((event) => event.category === selectedCategory)
    }

    setFilteredEvents(filtered)
  }, [searchTerm, selectedCategory, events])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Discover Events</h1>
          <p className="text-slate-600">Find exciting events happening on campus</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search events, clubs, keywords..."
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8 flex gap-2 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              disabled={isLoading}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:border-primary'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-slate-600">Loading events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          /* Events Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <Link key={event.id} href={`/event/${event.id}`}>
                <div className="event-card cursor-pointer h-full">
                  {/* Image */}
                  <div className="relative overflow-hidden rounded-t-lg bg-slate-100">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          console.warn('Failed to load image:', event.image)
                          e.currentTarget.src = ''
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                        <span className="text-slate-400 text-sm">
                          {event.title ? `No image for ${event.title}` : 'No image'}
                        </span>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 badge bg-primary text-white">
                      {event.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2">
                      {event.title}
                    </h3>

                    <div className="space-y-2 text-sm text-slate-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-primary" />
                        <span>{event.date} at {event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-primary" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        <span>{event.attendees} attending</span>
                      </div>
                    </div>

                    <button className="w-full btn-primary text-sm py-2">
                      View Details
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <p className="text-slate-600 text-lg">No events found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
