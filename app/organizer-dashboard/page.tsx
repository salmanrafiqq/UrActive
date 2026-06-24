'use client'

import { useState, useEffect } from 'react'
import { Trash2, Eye, AlertCircle, Loader, Users, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getEventsByOrganizer, deleteEvent, getEventRegistrations, getUserProfile, updateEvent, getEventById } from '@/lib/database'
import { uploadEventImage } from '@/lib/cloudinary'

interface Event {
  id: string
  title: string
  date: string
  location: string
  capacity?: number
  status: 'approved' | 'pending' | 'rejected' | 'changes_requested'
  image?: string
  [key: string]: any
}

export default function OrganizerDashboardPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [viewingRegistrations, setViewingRegistrations] = useState<string | null>(null)
  const [registrations, setRegistrations] = useState<any[]>([])
  const [registrationsLoading, setRegistrationsLoading] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    capacity: '',
  })
  const [editImage, setEditImage] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const loadUserEvents = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) {
          router.push('/login')
          return
        }

        setCurrentUser(user)
        console.log('Loading events for organizer:', user.uid)
        const userEvents = await getEventsByOrganizer(user.uid)
        console.log('Loaded events:', userEvents.map((e: any) => ({ 
          id: e.id, 
          title: e.title, 
          hasImage: !!e.image,
          imageUrl: e.image ? `${e.image.substring(0, 50)}...` : 'null'
        })))
        setEvents(userEvents || [])
      } catch (err: any) {
        console.error('Failed to load events:', err)
        setError('Failed to load your events: ' + err.message)
        setEvents([])
      } finally {
        setIsLoading(false)
      }
    }

    loadUserEvents()
  }, [router])

  const handleDelete = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
      setEvents(events.filter((e: any) => e.id !== eventId))
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Failed to delete event:', err)
      alert('Failed to delete event')
    }
  }

  const handleViewRegistrations = async (eventId: string) => {
    setViewingRegistrations(eventId)
    setRegistrationsLoading(true)
    
    try {
      const eventRegs = await getEventRegistrations(eventId)
      
      // Fetch user profiles for each registration
      const regsWithProfiles = await Promise.all(
        eventRegs.map(async (reg: any) => {
          try {
            const profile = await getUserProfile(reg.userId)
            return {
              ...reg,
              userName: (profile as any)?.name || 'Unknown User',
              userEmail: (profile as any)?.email || 'N/A',
            }
          } catch (err) {
            return {
              ...reg,
              userName: 'Unknown User',
              userEmail: 'N/A',
            }
          }
        })
      )
      
      setRegistrations(regsWithProfiles)
    } catch (err: any) {
      console.error('Failed to load registrations:', err)
      setRegistrations([])
    } finally {
      setRegistrationsLoading(false)
    }
  }

  const handleEditClick = (event: Event) => {
    setEditingEvent(event)
    setEditFormData({
      title: event.title || '',
      description: event.description || '',
      date: event.date || '',
      time: event.time || '',
      location: event.location || '',
      capacity: event.capacity?.toString() || '',
    })
    setEditImage(null)
    setEditImagePreview(event.image || '')
  }

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEditImage(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setEditImagePreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleUpdateEvent = async () => {
    if (!editingEvent) return
    if (!editFormData.title.trim() || !editFormData.date || !editFormData.time || !editFormData.location.trim()) {
      alert('Please fill in all required fields')
      return
    }

    setIsUpdating(true)
    try {
      let imageUrl = editingEvent.image || ''
      
      // Upload new image if selected
      if (editImage) {
        imageUrl = await uploadEventImage(editImage, editFormData.title)
      }

      const updatedData = {
        title: editFormData.title,
        description: editFormData.description,
        date: editFormData.date,
        time: editFormData.time,
        location: editFormData.location,
        capacity: parseInt(editFormData.capacity) || 100,
        image: imageUrl,
        updatedAt: new Date(),
      }

      await updateEvent(editingEvent.id, updatedData)

      // Fetch the updated event from Firebase to ensure display is correct
      const updatedEvent = await getEventById(editingEvent.id)
      if (updatedEvent) {
        setEvents(events.map((e: any) => e.id === editingEvent.id ? updatedEvent : e))
      }

      setEditingEvent(null)
      setEditImage(null)
      setEditImagePreview('')
      alert('Event updated successfully!')
    } catch (err: any) {
      console.error('Failed to update event:', err)
      alert('Failed to update event: ' + err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingEvent(null)
    setEditImage(null)
    setEditImagePreview('')
  }

  const stats = {
    total: events.length,
    approved: events.filter((e: any) => e.status === 'approved').length,
    pending: events.filter((e: any) => e.status === 'pending' || e.status === 'changes_requested').length,
    registrations: events.reduce((sum: any, e: any) => sum + (e.attendees || 0), 0),
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-slate-600">Loading your events...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Organizer Dashboard</h1>
            <p className="text-slate-600">Manage your events and track attendance</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="card p-6 bg-red-50 border border-red-200">
            <div className="flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Organizer Dashboard</h1>
          <p className="text-slate-600">Manage your events and track attendance</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-6">
            <p className="text-sm text-slate-600 mb-2">Total Events</p>
            <p className="text-4xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-slate-600 mb-2">Approved Events</p>
            <p className="text-4xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-slate-600 mb-2">Pending Review</p>
            <p className="text-4xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-slate-600 mb-2">Total Registrations</p>
            <p className="text-4xl font-bold text-cyan-600">{stats.registrations}</p>
          </div>
        </div>

        {/* My Events Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">My Events</h2>
            <Link href="/create-event" className="btn-primary text-sm">
              + Create Event
            </Link>
          </div>

          {events.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div key={event.id} className="card overflow-hidden">
                  {/* Image */}
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        console.warn('Image failed to load:', event.image)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">No image</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-900 flex-1 pr-2 line-clamp-2">
                        {event.title}
                      </h3>
                      <span
                        className={`badge px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                          event.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : event.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : event.status === 'changes_requested'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {event.status === 'approved'
                          ? 'Approved'
                          : event.status === 'pending'
                          ? 'Pending Review'
                          : event.status === 'changes_requested'
                          ? 'Changes Needed'
                          : 'Rejected'}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 mb-1">{new Date(event.date).toLocaleDateString()}</p>
                    <p className="text-sm text-slate-600 mb-4">{event.location || 'TBA'}</p>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <Link
                        href={`/event/${event.id}`}
                        className="flex-1 btn-outline text-sm py-2 flex items-center justify-center gap-1"
                      >
                        <Eye size={16} />
                        View
                      </Link>
                      <button
                        onClick={() => handleEditClick(event)}
                        className="flex-1 btn-outline text-sm py-2 flex items-center justify-center gap-1 hover:bg-blue-50 hover:text-blue-600"
                        title="Edit this event"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleViewRegistrations(event.id)}
                        className="flex-1 btn-outline text-sm py-2 flex items-center justify-center gap-1 hover:bg-cyan-50 hover:text-cyan-600"
                        title="View who registered for this event"
                      >
                        <Users size={16} />
                        Registrations
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(event.id)}
                        className="flex-1 btn-outline text-sm py-2 flex items-center justify-center gap-1 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <p className="text-slate-600 text-lg mb-6">No events created yet</p>
              <Link href="/create-event" className="btn-primary text-sm px-8">
                Create Your First Event
              </Link>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="card p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Delete Event?</h3>
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete this event? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Registrations Modal */}
        {viewingRegistrations && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="card p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Event Registrations</h3>
                <button
                  onClick={() => setViewingRegistrations(null)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              {registrationsLoading ? (
                <div className="text-center py-8">
                  <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-slate-600">Loading registrations...</p>
                </div>
              ) : registrations.length > 0 ? (
                <div className="space-y-2">
                  {registrations.map((reg: any) => (
                    <div key={reg.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between hover:bg-slate-100 transition-colors">
                      <div>
                        <p className="font-medium text-slate-900">{reg.userName}</p>
                        <p className="text-sm text-slate-600">{reg.userEmail}</p>
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(reg.registeredAt.toDate?.() || reg.registeredAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-center py-8">No registrations yet</p>
              )}

              <div className="mt-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setViewingRegistrations(null)}
                  className="w-full btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Event Modal */}
        {editingEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Edit Event</h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div className="input-group">
                  <label htmlFor="edit-title" className="input-label">Event Title *</label>
                  <input
                    id="edit-title"
                    type="text"
                    name="title"
                    value={editFormData.title}
                    onChange={handleEditFormChange}
                    placeholder="Event title"
                    disabled={isUpdating}
                    className="w-full"
                  />
                </div>

                {/* Description */}
                <div className="input-group">
                  <label htmlFor="edit-description" className="input-label">Description</label>
                  <textarea
                    id="edit-description"
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditFormChange}
                    placeholder="Event description"
                    disabled={isUpdating}
                    rows={3}
                    className="w-full"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label htmlFor="edit-date" className="input-label">Date *</label>
                    <input
                      id="edit-date"
                      type="date"
                      name="date"
                      value={editFormData.date}
                      onChange={handleEditFormChange}
                      disabled={isUpdating}
                      className="w-full"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="edit-time" className="input-label">Time *</label>
                    <input
                      id="edit-time"
                      type="time"
                      name="time"
                      value={editFormData.time}
                      onChange={handleEditFormChange}
                      disabled={isUpdating}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Location & Capacity */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label htmlFor="edit-location" className="input-label">Location *</label>
                    <input
                      id="edit-location"
                      type="text"
                      name="location"
                      value={editFormData.location}
                      onChange={handleEditFormChange}
                      placeholder="Event location"
                      disabled={isUpdating}
                      className="w-full"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="edit-capacity" className="input-label">Capacity</label>
                    <input
                      id="edit-capacity"
                      type="number"
                      name="capacity"
                      value={editFormData.capacity}
                      onChange={handleEditFormChange}
                      placeholder="100"
                      disabled={isUpdating}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Image */}
                <div className="input-group">
                  <label className="input-label">Event Image</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageChange}
                      disabled={isUpdating}
                      className="hidden"
                      id="edit-image-input"
                    />
                    {editImagePreview && (
                      <div className="mb-3 relative inline-block">
                        <img
                          src={editImagePreview}
                          alt="Preview"
                          className="h-32 w-full object-cover rounded-lg"
                        />
                        {editImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditImage(null)
                              setEditImagePreview(editingEvent.image || '')
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                    <label
                      htmlFor="edit-image-input"
                      className="btn-outline w-full text-center cursor-pointer block"
                    >
                      {editImage ? 'Change Image' : 'Upload New Image'}
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateEvent}
                    disabled={isUpdating}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {isUpdating && <Loader size={16} className="animate-spin" />}
                    {isUpdating ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
