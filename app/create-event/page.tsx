'use client'

import { useState } from 'react'
import { Upload, AlertCircle, Check, Loader, Download } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addEvent, getUserProfile } from '@/lib/database'
import { uploadEventImage } from '@/lib/cloudinary'
import { getCurrentUser } from '@/lib/auth'
import { getSuggestedImages, downloadImageFromUrl, type SuggestedImage } from '@/lib/images'
import { ProtectedRoute } from '@/components/protected-route'

export default function CreateEventPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    time: '',
    location: '',
    capacity: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [suggestedImages, setSuggestedImages] = useState<SuggestedImage[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState('')
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Fetch suggested images when title changes
    if (name === 'title' && value.length > 3) {
      fetchSuggestedImages(value)
    }
  }

  const fetchSuggestedImages = async (title: string) => {
    try {
      setLoadingSuggestions(true)
      const images = await getSuggestedImages(title)
      setSuggestedImages(images)
    } catch (err) {
      console.error('Failed to fetch suggestions:', err)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const useSuggestedImage = async (suggestion: SuggestedImage) => {
    try {
      setLoadingSuggestions(true)
      const file = await downloadImageFromUrl(suggestion.url)
      setImageFile(file)
      setImagePreview(suggestion.url)
      setSuggestedImages([])
    } catch (err) {
      console.error('Failed to use suggested image:', err)
      setError('Failed to use suggested image')
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file) // Store the actual file for upload
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string) // Store preview for UI
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitProgress('')
    setUploadStatus('idle')
    setIsSubmitting(true)

    try {
      // Step 1: Get current user
      setSubmitProgress('Verifying user...')
      const user = await getCurrentUser()
      if (!user) {
        setError('Please log in to create an event')
        setIsSubmitting(false)
        return
      }

      // Step 1b: Get user profile to get their name
      let organizerName = user.email || 'Unknown'
      try {
        console.log('Fetching user profile for:', user.uid)
        const userProfile = await getUserProfile(user.uid)
        console.log('User profile retrieved:', userProfile)
        if (userProfile && (userProfile as any).name) {
          organizerName = (userProfile as any).name
          console.log('✓ Using organizer name:', organizerName)
        } else {
          console.warn('No name in profile, falling back to email:', user.email)
        }
      } catch (profileError) {
        console.warn('Could not load user profile:', profileError)
        // Fall back to email if profile load fails
      }

      // Step 2: Validate form
      setSubmitProgress('Validating form...')
      if (!formData.title || !formData.description || !formData.date || !formData.location || !formData.capacity) {
        setError('Please fill in all required fields')
        setIsSubmitting(false)
        return
      }

      // Step 3: Upload image if provided (with optional skip if taking too long)
      let imageUrl: string | null = null
      if (imageFile) {
        try {
          setSubmitProgress('Uploading image...')
          setUploadStatus('uploading')
          console.log('Starting image upload...')
          
          // Set a timeout for image upload - if it takes more than 20 seconds, continue without image
          const uploadPromise = uploadEventImage(imageFile, formData.title)
          const timeoutPromise = new Promise<null>((resolve) => {
            setTimeout(() => {
              console.warn('Image upload taking too long, continuing without image')
              resolve(null)
            }, 20000)
          })
          
          imageUrl = await Promise.race([uploadPromise, timeoutPromise])
          
          if (imageUrl) {
            setUploadStatus('done')
            console.log('Image uploaded successfully')
          } else {
            setUploadStatus('error')
            console.warn('Image upload skipped - took too long')
          }
        } catch (imgError: any) {
          console.error('Image upload error:', imgError)
          setUploadStatus('error')
          // Continue without image rather than failing
          imageUrl = null
        }
      }

      // Step 4: Save event to Firebase
      setSubmitProgress('Creating event...')
      const eventData = {
        title: formData.title,
        description: formData.description,
        category: formData.category || 'Other',
        date: formData.date,
        time: formData.time,
        location: formData.location,
        capacity: parseInt(formData.capacity),
        image: imageUrl || null,
        organizerId: user.uid,
        organizer: organizerName,
        organizerEmail: user.email,
        status: 'pending',
      }

      console.log('� Event data to save:')
      console.log('  - organizer (name):', eventData.organizer)
      console.log('  - organizerEmail:', eventData.organizerEmail)
      console.log('  - organizerId:', eventData.organizerId)
      
      const eventId = await addEvent(eventData)
      console.log('✅ Event created successfully:', eventId)
      
      setSubmitProgress('')
      setSuccess(true)

      // Redirect after success
      setTimeout(() => {
        router.push('/organizer-dashboard')
      }, 2000)
    } catch (err: any) {
      console.error('Failed to create event:', err)
      setError(err.message || 'Failed to create event. Please try again.')
      setSubmitProgress('')
    } finally {
      setIsSubmitting(false)
      setUploadStatus('idle')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Event Created!</h2>
          <p className="text-slate-600 mb-6">Your event has been submitted for review. You'll see it in your dashboard shortly.</p>
          <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Create Event</h1>
          <p className="text-slate-600">Fill out the form to submit your event for review</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card p-8">
          {/* Alert Box */}
          <div className="mb-8 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg flex gap-3">
            <AlertCircle className="text-yellow-700 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-yellow-800 text-sm">
              Your event will need to be approved by our admin team before it goes live. We'll send
              you an email once your submission has been reviewed.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex gap-3">
              <AlertCircle className="text-red-700 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Progress Message */}
          {submitProgress && (
            <div className={`mb-8 p-4 border-2 rounded-lg flex gap-3 ${
              uploadStatus === 'error'
                ? 'bg-yellow-50 border-yellow-300'
                : 'bg-blue-50 border-blue-300'
            }`}>
              <Loader className={`flex-shrink-0 ${uploadStatus === 'error' ? 'text-yellow-700' : 'text-blue-700'} ${uploadStatus === 'uploading' ? 'animate-spin' : ''}`} size={20} />
              <div className="flex-1">
                <p className={uploadStatus === 'error' ? 'text-yellow-800 text-sm' : 'text-blue-800 text-sm'}>
                  {submitProgress}
                </p>
                {uploadStatus === 'error' && (
                  <p className="text-yellow-700 text-xs mt-1">If upload is slow, it will continue without image after 20 seconds</p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="input-group">
              <label htmlFor="title" className="input-label">
                Event Title
              </label>
              <input
                id="title"
                type="text"
                placeholder="Enter event title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Description */}
            <div className="input-group">
              <label htmlFor="description" className="input-label">
                Description
              </label>
              <textarea
                id="description"
                placeholder="Describe your event..."
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
              />
            </div>

            {/* Category and Date */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="input-group">
                <label htmlFor="category" className="input-label">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Academic">Academic</option>
                  <option value="Social">Social</option>
                  <option value="Sports & Recreation">Sports & Recreation</option>
                  <option value="Arts & Culture">Arts & Culture</option>
                  <option value="Technology">Technology</option>
                  <option value="Career Development">Career Development</option>
                  <option value="Wellness">Wellness</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="date" className="input-label">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Time and Location */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="input-group">
                <label htmlFor="time" className="input-label">
                  Time
                </label>
                <input
                  id="time"
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="location" className="input-label">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  placeholder="Event location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Capacity */}
            <div className="input-group">
              <label htmlFor="capacity" className="input-label">
                Expected Capacity
              </label>
              <input
                id="capacity"
                type="number"
                placeholder="Number of attendees"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                required
              />
            </div>

            {/* Image Upload */}
            <div className="input-group">
              <label htmlFor="image" className="input-label">
                Event Image (Optional)
              </label>
              <label
                htmlFor="image"
                className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors block"
              >
                <Upload className="mx-auto mb-3 text-slate-400" size={40} />
                <p className="font-semibold text-slate-700 mb-1">Click to upload an image</p>
                <p className="text-sm text-slate-600">JPG, PNG, GIF - max 10MB</p>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border border-slate-200"
                  />
                </div>
              )}

              {/* Suggested Images */}
              {suggestedImages.length > 0 && !imagePreview && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-slate-700 mb-3">💡 Suggested images for "{formData.title}":</p>
                  <div className="grid grid-cols-2 gap-3">
                    {suggestedImages.map((img, idx) => (
                      <div key={idx} className="relative group cursor-pointer">
                        <img
                          src={img.thumb}
                          alt={`Suggestion ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-slate-200 group-hover:border-primary transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => useSuggestedImage(img)}
                          disabled={loadingSuggestions}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                        >
                          <Download size={20} className="text-white" />
                        </button>
                        <p className="text-xs text-slate-500 mt-1">
                          by {img.photographer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loadingSuggestions && (
                <div className="mt-4 flex items-center gap-2 text-slate-600">
                  <Loader size={16} className="animate-spin" />
                  <p className="text-sm">Finding images for your event...</p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader size={18} className="animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}
