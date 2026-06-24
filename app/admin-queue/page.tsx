'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, XCircle, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface PendingEvent {
  id: string
  title: string
  organizer: string
  date: string
  location: string
  description: string
  capacity: number
  image: string
  status: 'pending'
}

const mockPendingEvents: PendingEvent[] = [
  {
    id: '1',
    title: 'Tech Talk: AI in Education',
    organizer: 'Prof. Alan Turing',
    date: '2025-06-18',
    location: 'Tech Auditorium',
    description: 'Join us for an insightful discussion on how artificial intelligence is transforming education.',
    capacity: 150,
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop',
    status: 'pending',
  },
  {
    id: '2',
    title: 'Study Skills Workshop',
    organizer: 'Student Success Center',
    date: '2025-06-20',
    location: 'Library Room 301',
    description: 'Learn effective study techniques and time management strategies.',
    capacity: 50,
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop',
    status: 'pending',
  },
]

export default function AdminQueuePage() {
  const [events, setEvents] = useState(mockPendingEvents)
  const [selectedEvent, setSelectedEvent] = useState(events[0])
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const stats = {
    pending: events.length,
    approvedToday: 3,
    total: events.length + 5,
  }

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const newEvents = events.filter((e) => e.id !== selectedEvent.id)
      setEvents(newEvents)
      if (newEvents.length > 0) {
        setSelectedEvent(newEvents[0])
      }
      setFeedback('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestChanges = async () => {
    if (!feedback) {
      alert('Please provide feedback for requested changes.')
      return
    }
    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const newEvents = events.filter((e) => e.id !== selectedEvent.id)
      setEvents(newEvents)
      if (newEvents.length > 0) {
        setSelectedEvent(newEvents[0])
      }
      setFeedback('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!feedback) {
      alert('Please provide feedback for rejection.')
      return
    }
    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const newEvents = events.filter((e) => e.id !== selectedEvent.id)
      setEvents(newEvents)
      if (newEvents.length > 0) {
        setSelectedEvent(newEvents[0])
      }
      setFeedback('')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">Admin Review Queue</h1>
          <p className="text-slate-600 mb-8">All events have been reviewed</p>
          <div className="card p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">All Clear!</h2>
            <p className="text-slate-600">No events pending review at this time.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Admin Review Queue</h1>
          <p className="text-slate-600">Review and approve submitted events</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="card p-6">
            <p className="text-sm text-slate-600 mb-1">Pending Review</p>
            <p className="text-3xl font-bold text-primary">{stats.pending}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-slate-600 mb-1">Approved Today</p>
            <p className="text-3xl font-bold text-green-600">{stats.approvedToday}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-slate-600 mb-1">Total Events</p>
            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
          </div>
        </div>

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
                      selectedEvent.id === event.id
                        ? 'border-cyan-600 bg-cyan-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold text-sm line-clamp-2">{event.title}</p>
                    <p className="text-xs text-slate-600 mt-1">{event.organizer}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Review Details */}
          <div className="lg:col-span-2">
            <div className="card p-8">
              {/* Event Image */}
              <img
                src={selectedEvent.image}
                alt={selectedEvent.title}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />

              {/* Event Title */}
              <h2 className="text-3xl font-bold text-slate-900 mb-6">{selectedEvent.title}</h2>

              {/* Event Details */}
              <div className="space-y-3 text-slate-700 mb-6 pb-6 border-b border-slate-200">
                <p>
                  <strong>Organizer:</strong> {selectedEvent.organizer}
                </p>
                <p>
                  <strong>Date:</strong> {selectedEvent.date}
                </p>
                <p>
                  <strong>Location:</strong> {selectedEvent.location}
                </p>
                <p>
                  <strong>Capacity:</strong> {selectedEvent.capacity}
                </p>
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-600 mb-2">Description</p>
                <p className="text-slate-700">{selectedEvent.description}</p>
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
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Approve
                </button>

                <button
                  onClick={handleRequestChanges}
                  disabled={isSubmitting || !feedback}
                  className={`flex-1 flex items-center justify-center gap-2 ${
                    !feedback ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary bg-cyan-600 hover:bg-cyan-700'
                  }`}
                >
                  <MessageSquare size={18} />
                  Request Changes
                </button>

                <button
                  onClick={handleReject}
                  disabled={isSubmitting || !feedback}
                  className={`flex-1 flex items-center justify-center gap-2 ${
                    !feedback ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-danger'
                  }`}
                >
                  <XCircle size={18} />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
