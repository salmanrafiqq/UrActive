'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Users, ArrowLeft, Share2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { getEventById, registerForEvent, isUserRegisteredForEvent, getUserProfile } from '@/lib/database'
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
  organizerId: string
  organizerEmail: string
  organizerAvatar?: string
  attendees: number
  capacity: number
  image: string
}

export default function EventDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [organizerAvatar, setOrganizerAvatar] = useState<string | null>(null)

  useEffect(() => {
    const fetchEventAndUser = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) {
          router.push('/login')
          return
        }
        setCurrentUser(user)

        const eventData = await getEventById(eventId)
        if (!eventData) {
          setError('Event not found')
          return
        }
        setEvent(eventData as Event)

        // Fetch organizer's avatar
        const typedEvent = eventData as Event
        if (typedEvent.organizerId) {
          try {
            const organizerProfile = await getUserProfile(typedEvent.organizerId)
            setOrganizerAvatar((organizerProfile as any)?.avatar || null)
          } catch (err) {
            console.error('Failed to fetch organizer avatar:', err)
            setOrganizerAvatar(null)
          }
        }

        // Check if user is already registered
        if (user) {
          const registered = await isUserRegisteredForEvent(user.uid, eventId)
          setIsRegistered(registered)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load event')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventAndUser()
  }, [eventId])

  const handleRegister = async () => {
    if (!currentUser) {
      router.push('/login')
      return
    }

    setIsRegistering(true)
    setError('')

    try {
      await registerForEvent(currentUser.uid, eventId)
      
      // Refresh event data to show updated attendee count
      const updatedEvent = await getEventById(eventId)
      if (updatedEvent) {
        setEvent(updatedEvent as Event)
      }
      
      setIsRegistered(true)
      setTimeout(() => {
        router.push('/my-events')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to register for event')
    } finally {
      setIsRegistering(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading event...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Event Not Found</h1>
          <p className="text-slate-600 mb-4">{error || 'The event you are looking for does not exist.'}</p>
          <Link href="/discover" className="btn-primary inline-block">
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Hero Image Section */}
      <div 
        className="relative h-96 bg-cover bg-center"
        style={{
          backgroundImage: event.image 
            ? `url('${event.image}')`
            : 'linear-gradient(135deg, rgba(45, 90, 61, 0.3) 0%, rgba(14, 165, 233, 0.3) 100%)'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Back Button */}
        <div className="absolute top-6 left-6">
          <Link
            href="/discover"
            className="flex items-center gap-2 text-white hover:text-gray-200 bg-black/30 px-4 py-2 rounded-lg backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
            Back to Events
          </Link>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent">
          <div className="max-w-7xl mx-auto">
            <span className="badge bg-primary text-white mb-4">{event.category}</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white">{event.title}</h1>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">About This Event</h2>
              <p className="text-slate-700 whitespace-pre-line mb-8 leading-relaxed">
                {event.description}
              </p>

              {/* Organizer */}
              <div className="mt-12 pt-12 border-t border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Organizer</h3>
                <div className="flex gap-4">
                  {organizerAvatar ? (
                    <img
                      src={organizerAvatar}
                      alt={event.organizer}
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                      {event.organizer.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900">{event.organizer}</p>
                    <a href={`mailto:${event.organizerEmail}`} className="text-cyan-600 hover:text-cyan-700 text-sm">
                      {event.organizerEmail}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="card p-6 sticky top-20">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">📅 Date</p>
                    <p className="font-bold text-slate-900">{event.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">🕐 Time</p>
                    <p className="font-bold text-slate-900">{event.time}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">📍 Location</p>
                    <p className="font-bold text-slate-900">{event.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">👥 Attendees</p>
                    <p className="font-bold text-slate-900">{event.attendees} / {event.capacity}</p>
                  </div>
                </div>

                {isRegistered ? (
                  <div className="space-y-3 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 font-semibold">✓ You're registered!</p>
                    <p className="text-sm text-slate-600">
                      We'll send you updates about the event to your email.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={isRegistering || event.attendees >= event.capacity}
                    className="btn-primary w-full mb-3"
                  >
                    {isRegistering ? 'Registering...' : 'Register'}
                  </button>
                )}

                <button className="w-full border-2 border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:border-slate-400 transition-colors flex items-center justify-center gap-2 font-medium">
                  <Share2 size={18} />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
