'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, LogOut, Mail, Shield, Calendar, ArrowLeft, Edit2, Save, X, Upload } from 'lucide-react'
import Link from 'next/link'
import { getCurrentUser, logout } from '@/lib/auth'
import { getUserProfile, updateUserProfile, createUserProfile } from '@/lib/database'
import { uploadAvatarImage } from '@/lib/cloudinary'

interface UserProfile {
  id: string
  uid: string
  email: string
  name?: string
  department?: string
  bio?: string
  avatar?: string
  role: 'student' | 'admin'
  createdAt?: any
}

export default function ProfilePage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editData, setEditData] = useState<Partial<UserProfile>>({})
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) {
          router.push('/login')
          return
        }

        setCurrentUser(user)

        const userProfile = await getUserProfile(user.uid)
        if (userProfile) {
          setProfile(userProfile as any)
          setEditData({
            name: (userProfile as any).name || '',
            department: (userProfile as any).department || '',
            bio: (userProfile as any).bio || '',
            avatar: (userProfile as any).avatar || '',
          })
        } else {
          // Create default profile if it doesn't exist
          const defaultProfile: UserProfile = {
            id: 'temp',
            uid: user.uid,
            email: user.email || '',
            name: '',
            department: '',
            bio: '',
            avatar: '',
            role: 'student',
          }
          
          // Save default profile to Firestore
          try {
            await createUserProfile(user.uid, {
              email: user.email || '',
              name: '',
              role: 'student',
              department: '',
              bio: '',
              avatar: '',
            })
          } catch (profileError) {
            console.warn('Could not auto-create profile:', profileError)
          }
          
          setProfile(defaultProfile)
          setEditData(defaultProfile)
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
        setError('Failed to load profile information')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserProfile()
  }, [router])

  // Debug effect: Log whenever profile changes
  useEffect(() => {
    if (profile) {
      console.log('Profile loaded:', (profile as any).avatar ? 'with avatar' : 'no avatar')
    }
  }, [profile])

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file is an image
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB')
        return
      }

      // Store file and create preview
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
        setError('')
      }
      reader.onerror = () => {
        setError('Failed to read file')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    if (!currentUser || !profile) return

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      let avatarUrl = editData.avatar || profile?.avatar
      
      // Upload avatar to Cloudinary if a new file was selected
      if (avatarFile) {
        console.log('Uploading avatar...')
        try {
          avatarUrl = await uploadAvatarImage(avatarFile, currentUser.uid)
          console.log('Avatar upload complete')
        } catch (uploadErr: any) {
          console.error('Avatar upload failed:', uploadErr)
          setError(`Avatar upload failed: ${uploadErr.message}`)
          setIsSaving(false)
          return
        }
      }

      const updates = {
        name: editData.name || '',
        department: editData.department || '',
        bio: editData.bio || '',
        ...(avatarUrl && { avatar: avatarUrl }),
      }

      console.log('Saving profile...')
      const updated = await updateUserProfile(currentUser.uid, updates)
      
      // Reload fresh profile from Firestore to ensure avatar is persisted
      const freshProfile = await getUserProfile(currentUser.uid)
      setProfile({ ...freshProfile } as any)
      
      // Update editData with fresh values
      setEditData({
        name: (freshProfile as any)?.name || '',
        department: (freshProfile as any)?.department || '',
        bio: (freshProfile as any)?.bio || '',
        avatar: (freshProfile as any)?.avatar || '',
      })
      
      setIsEditing(false)
      setSuccess('Profile updated successfully!')
      setAvatarPreview(null)
      setAvatarFile(null)
    } catch (err: any) {
      console.error('Failed to update profile:', err)
      setError(err.message || 'Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({
      name: profile?.name || '',
      department: profile?.department || '',
      bio: profile?.bio || '',
      avatar: profile?.avatar || '',
    })
    setAvatarPreview(null)
    setAvatarFile(null)
    setError('')
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      router.push('/')
    } catch (err) {
      console.error('Logout failed:', err)
      setError('Failed to logout. Please try again.')
      setIsLoggingOut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-xl font-bold">UR</span>
          </div>
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="card p-8 max-w-md w-full">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Error</h1>
          <p className="text-slate-600 mb-6">Unable to verify your account</p>
          <Link href="/" className="btn-primary block text-center">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const displayProfile = (profile as any) || { email: currentUser.email, role: 'student' }
  const getAvatarUrl = () => avatarPreview || editData.avatar || profile?.avatar

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => {
                if (isEditing) {
                  handleCancel()
                } else {
                  router.back()
                }
              }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
              <p className="text-slate-600">Manage your account and profile</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            ✓ {success}
          </div>
        )}

        {/* Profile Card */}
        <div className="card p-8 mb-6">
          {/* Avatar Section */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              {isEditing ? (
                <label className="relative group cursor-pointer">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden flex-shrink-0">
                    {getAvatarUrl() ? (
                      <img src={getAvatarUrl()} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      editData.name?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                    <Upload size={20} className="text-white" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={isSaving}
                  />
                </label>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden flex-shrink-0">
                  {(profile as any)?.avatar ? (
                    <img 
                      src={(profile as any).avatar} 
                      alt="Profile avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (profile as any)?.name?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{displayProfile.name || currentUser.email}</h2>
                <p className="text-slate-600 capitalize">{displayProfile.role === 'admin' ? 'Administrator' : 'Student'}</p>
                {displayProfile.department && <p className="text-sm text-slate-500">{displayProfile.department}</p>}
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                <Edit2 size={18} />
                Edit
              </button>
            )}
          </div>

          {isEditing && (
            <>
              {/* Edit Form */}
              <div className="space-y-6 pb-8 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Edit Profile</h3>

                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={editData.name || ''}
                    onChange={handleEditChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                    disabled={isSaving}
                  />
                </div>

                {/* Department */}
                <div>
                  <label htmlFor="department" className="block text-sm font-semibold text-slate-700 mb-2">
                    Department
                  </label>
                  <input
                    id="department"
                    type="text"
                    name="department"
                    value={editData.department || ''}
                    onChange={handleEditChange}
                    placeholder="e.g., Computer Science"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                    disabled={isSaving}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label htmlFor="bio" className="block text-sm font-semibold text-slate-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={editData.bio || ''}
                    onChange={handleEditChange}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary resize-none"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Edit Actions */}
              <div className="flex gap-3 pt-6">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <Save size={18} />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>
            </>
          )}

          {!isEditing && (
            <>
              {/* Account Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-slate-200">
                {/* Email */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mail size={18} className="text-primary" />
                    <label className="text-sm font-semibold text-slate-600">Email</label>
                  </div>
                  <p className="text-slate-900 font-medium break-all">{displayProfile.email}</p>
                </div>

                {/* Role */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={18} className="text-primary" />
                    <label className="text-sm font-semibold text-slate-600">Role</label>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    displayProfile.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {displayProfile.role === 'admin' ? 'Administrator' : 'Student'}
                  </span>
                </div>

                {/* Department */}
                {displayProfile.department && (
                  <div>
                    <label className="text-sm font-semibold text-slate-600 mb-2 block">Department</label>
                    <p className="text-slate-900 font-medium">{(displayProfile as any).department}</p>
                  </div>
                )}

                {/* Member Since */}
                {(displayProfile as any).createdAt && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={18} className="text-primary" />
                      <label className="text-sm font-semibold text-slate-600">Member Since</label>
                    </div>
                    <p className="text-slate-900 font-medium">
                      {new Date((displayProfile as any).createdAt.toDate?.() || (displayProfile as any).createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Bio */}
              {displayProfile.bio && (
                <div className="py-6 border-b border-slate-200">
                  <label className="text-sm font-semibold text-slate-600 mb-2 block">Bio</label>
                  <p className="text-slate-700 whitespace-pre-wrap">{displayProfile.bio}</p>
                </div>
              )}

              {/* Admin Section */}
              {(displayProfile as any).role === 'admin' && (
                <div className="py-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Admin Features</h3>
                  <Link
                    href="/admin"
                    className="inline-block px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                  >
                    Go to Admin Portal
                  </Link>
                </div>
              )}

              {/* Logout Section */}
              <div className="py-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Security</h3>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <LogOut size={18} />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
