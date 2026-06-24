'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, XCircle, MessageSquare, Loader, Shield, Grid3X3 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUserProfile, getPendingEvents, updateEvent, getAllEvents } from '@/lib/database'

interface PendingEvent {
  id: string
  title: string
  organizerId: string
  date: string
  location: string
  description: string
  capacity: number
  image?: string
  status: 'pending'
  [key: string]: any
}

export default function AdminPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [events, setEvents] = useState<PendingEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<PendingEvent | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending')
  const [approvedEvents, setApprovedEvents] = useState<{ [key: string]: PendingEvent[] }>({})
  const [isLoadingApproved, setIsLoadingApproved] = useState(false)

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) {
          router.push('/login')
          return
        }

        const userProfile = await getUserProfile(user.uid)
        if (userProfile?.role !== 'admin') {
          router.push('/discover')
          return
        }

        setIsAuthorized(true)
      } catch (err) {
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAccess()
  }, [router])

  useEffect(() => {
    if (!isAuthorized) return

    const loadPendingEvents = async () => {
      setIsLoadingEvents(true)
      try {
        const pendingEvents = await getPendingEvents()
        setEvents(pendingEvents)
        if (pendingEvents.length > 0) {
          setSelectedEvent(pendingEvents[0])
        }
      } catch (err) {
        console.error('Failed to load pending events:', err)
      } finally {
        setIsLoadingEvents(false)
      }
    }

    loadPendingEvents()
  }, [isAuthorized])

  const loadApprovedEventsByCategory = async () => {
    setIsLoadingApproved(true)
    try {
      const approved = await getAllEvents()
      // Group by category
      const grouped: { [key: string]: PendingEvent[] } = {}
      approved.forEach((event: any) => {
        const category = event.category || 'Uncategorized'
        if (!grouped[category]) {
          grouped[category] = []
        }
        grouped[category].push(event)
      })
      setApprovedEvents(grouped)
    } catch (err) {
      console.error('Failed to load approved events:', err)
    } finally {
      setIsLoadingApproved(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'approved' && Object.keys(approvedEvents).length === 0) {
      loadApprovedEventsByCategory()
    }
  }, [activeTab])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Verifying access...</p>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-4">You do not have permission to access the admin portal.</p>
          <Link href="/discover" className="btn-primary inline-block">
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  const stats = {
    pending: events.length,
  }

  const handleApprove = async () => {
    if (!selectedEvent) return

    setIsSubmitting(true)
    try {
      await updateEvent(selectedEvent.id, {
        status: 'approved',
        approvedAt: new Date(),
        adminNotes: feedback,
      })

      const newEvents = events.filter((e) => e.id !== selectedEvent.id)
      setEvents(newEvents)
      if (newEvents.length > 0) {
        setSelectedEvent(newEvents[0])
      } else {
        setSelectedEvent(null)
      }
      setFeedback('')
    } catch (err) {
      console.error('Failed to approve event:', err)
      alert('Failed to approve event. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestChanges = async () => {
    if (!selectedEvent || !feedback) {
      alert('Please provide feedback for requested changes.')
      return
    }

    setIsSubmitting(true)
    try {
      await updateEvent(selectedEvent.id, {
        status: 'changes_requested',
        requestedChanges: feedback,
        changesRequestedAt: new Date(),
      })

      const newEvents = events.filter((e) => e.id !== selectedEvent.id)
      setEvents(newEvents)
      if (newEvents.length > 0) {
        setSelectedEvent(newEvents[0])
      } else {
        setSelectedEvent(null)
      }
      setFeedback('')
    } catch (err) {
      console.error('Failed to request changes:', err)
      alert('Failed to request changes. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!selectedEvent || !feedback) {
      alert('Please provide feedback for rejection.')
      return
    }

    setIsSubmitting(true)
    try {
      await updateEvent(selectedEvent.id, {
        status: 'rejected',
        rejectionReason: feedback,
        rejectedAt: new Date(),
      })

      const newEvents = events.filter((e) => e.id !== selectedEvent.id)
      setEvents(newEvents)
      if (newEvents.length > 0) {
        setSelectedEvent(newEvents[0])
      } else {
        setSelectedEvent(null)
      }
      setFeedback('')
    } catch (err) {
      console.error('Failed to reject event:', err)
      alert('Failed to reject event. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={32} className="text-primary" />
            <h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
          </div>
          <p className="text-slate-600 mb-6">Review submissions and manage approved events</p>
          
          {/* Tab Switcher */}
          <div className="flex gap-4 border-b border-slate-200 -mb-px">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Review ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'approved'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid3X3 size={16} />
              Approved Events by Category
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Pending Review Tab */}
        {activeTab === 'pending' && (
          <>
            {/* Stats */}
            <div className="grid md:grid-cols-1 gap-4 mb-8">
              <div className="card p-6">
                <p className="text-sm text-slate-600 mb-1">Pending Review</p>
                <p className="text-3xl font-bold text-primary">{stats.pending}</p>
              </div>
            </div>

            {isLoadingEvents ? (
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-slate-600">Loading pending events...</p>
                </div>
              </div>
            ) : events.length === 0 ? (
              <div className="card p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">All Clear!</h2>
                <p className="text-slate-600">No events pending review at this time.</p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
          {/* Queue List */}
          <div className="lg:col-span-1">
            <div className="card p-4">
              <h2 className="text-lg font-bold mb-4">Pending Events</h2>
              <div className="space-y-2">
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      selectedEvent?.id === event.id
                        ? 'border-cyan-600 bg-cyan-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold text-sm line-clamp-2">{event.title}</p>
                    <p className="text-xs text-slate-600 mt-1">{event.organizer || event.organizerId || 'Organizer'}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Review Details */}
          <div className="lg:col-span-2">
            {selectedEvent ? (
            <div className="card p-8">
              {/* Event Image */}
              {selectedEvent.image && (
                <img
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}
              {!selectedEvent.image && (
                <div className="w-full h-64 bg-gradient-to-br from-primary to-cyan-600 rounded-lg mb-6 flex items-center justify-center">
                  <p className="text-white text-center">No image provided</p>
                </div>
              )}

              {/* Event Title */}
              <h2 className="text-3xl font-bold text-slate-900 mb-6">{selectedEvent.title}</h2>

              {/* Event Details */}
              <div className="space-y-3 text-slate-700 mb-6 pb-6 border-b border-slate-200">
                <p>
                  <strong>Organizer:</strong> {selectedEvent.organizer || selectedEvent.organizerId || 'N/A'}
                </p>
                <p>
                  <strong>Date:</strong> {selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString() : 'N/A'}
                </p>
                <p>
                  <strong>Location:</strong> {selectedEvent.location || 'N/A'}
                </p>
                <p>
                  <strong>Capacity:</strong> {selectedEvent.capacity || 'N/A'}
                </p>
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-600 mb-2">Description</p>
                <p className="text-slate-700 whitespace-pre-wrap">{selectedEvent.description || 'No description provided'}</p>
              </div>

              {/* Feedback */}
              <div className="mb-6">
                <label htmlFor="feedback" className="input-label mb-2">
                  Feedback for Organizer
                </label>
                <textarea
                  id="feedback"
                  placeholder="Provide feedback, request changes, or explain rejection..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={18} />
                  Approve
                </button>

                <button
                  onClick={handleRequestChanges}
                  disabled={isSubmitting || !feedback}
                  className={`flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    !feedback ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary bg-cyan-600 hover:bg-cyan-700'
                  }`}
                >
                  <MessageSquare size={18} />
                  Request Changes
                </button>

                <button
                  onClick={handleReject}
                  disabled={isSubmitting || !feedback}
                  className={`flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    !feedback ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-danger'
                  }`}
                >
                  <XCircle size={18} />
                  Reject
                </button>
              </div>
            </div>
            ) : (
              <div className="card p-8 text-center">
                <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Select an event to review</p>
              </div>
            )}
          </div>
        </div>
            )}
          </>
        )}

        {/* Approved Events Tab */}
        {activeTab === 'approved' && (
          <>
            {isLoadingApproved ? (
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-slate-600">Loading approved events...</p>
                </div>
              </div>
            ) : Object.keys(approvedEvents).length === 0 ? (
              <div className="card p-8 text-center">
                <AlertCircle className="w-16 h-16 text-amber-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">No Approved Events</h2>
                <p className="text-slate-600">There are no approved events yet.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(approvedEvents).map(([category, categoryEvents]) => (
                  <div key={category}>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">{category}</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryEvents.map((event: any) => (
                        <div key={event.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
                          {/* Event Image */}
                          {event.image ? (
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-full h-48 object-cover"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center">
                              <p className="text-white text-center">No image</p>
                            </div>
                          )}
                          
                          {/* Event Info */}
                          <div className="p-4">
                            <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2">{event.title}</h3>
                            <p className="text-sm text-slate-600 mb-3 line-clamp-2">{event.description}</p>
                            
                            {/* Event Details */}
                            <div className="space-y-2 text-sm text-slate-700 mb-4 pb-4 border-b border-slate-200">
                              <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                              <p><strong>Location:</strong> {event.location}</p>
                              <p><strong>Organizer:</strong> {event.organizer || event.organizerId || 'N/A'}</p>
                              <p><strong>Attendees:</strong> {event.attendees || 0} / {event.capacity}</p>
                            </div>
                            
                            {/* View Button */}
                            <Link href={`/event/${event.id}`} className="w-full btn-primary text-center block">
                              View Event
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
