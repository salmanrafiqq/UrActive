'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, User, Eye, EyeOff, UserPlus, Upload, Loader } from 'lucide-react'
import { signUp } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { uploadAvatarImage } from '@/lib/cloudinary'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [role, setRole] = useState<'student' | 'admin'>('student')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!formData.name.trim()) {
      setError('Full name is required')
      return
    }

    setIsLoading(true)

    try {
      // Create user with Firebase Auth and Firestore profile in one call
      let avatarUrl = ''
      
      // Upload avatar if provided
      if (avatarFile) {
        try {
          avatarUrl = await uploadAvatarImage(avatarFile, formData.email)
        } catch (imgErr: any) {
          console.error('Avatar upload failed:', imgErr)
          // Continue without avatar
        }
      }

      const user = await signUp(formData.email, formData.password, {
        name: formData.name,
        role: role,
        avatar: avatarUrl,
      })

      setSuccess(true)
      // Redirect based on role
      setTimeout(() => {
        if (role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/discover')
        }
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Create Account</h1>
            <p className="text-slate-600">Join the URActive community</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <span className="text-xl">✓</span>
              Account created successfully! Redirecting...
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selection */}
              <div className="input-group">
                <label className="input-label">Account Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="student"
                      checked={role === 'student'}
                      onChange={(e) => setRole('student')}
                      disabled={isLoading}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-slate-700">Student</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === 'admin'}
                      onChange={(e) => setRole('admin')}
                      disabled={isLoading}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-slate-700">Admin</span>
                  </label>
                </div>
              </div>

              {/* Avatar Upload */}
              <div className="input-group">
                <label className="input-label">Profile Picture (Optional)</label>
                <div className="flex flex-col gap-4">
                  {/* Avatar Preview */}
                  <div className="flex justify-center">
                    {avatarPreview ? (
                      <div className="relative">
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarFile(null)
                            setAvatarPreview(null)
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* File Input */}
                  <label className="flex flex-col items-center justify-center px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-600">Click to upload photo</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={isLoading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Full Name */}
              <div className="input-group">
                <label htmlFor="name" className="input-label">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="pl-10 w-full"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="input-group">
                <label htmlFor="email" className="input-label">
                  University Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    id="email"
                    type="email"
                    placeholder="your.name@uregina.ca"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="pl-10 w-full"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="input-group">
                <label htmlFor="password" className="input-label">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="pl-10 pr-10 w-full"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="input-group">
                <label htmlFor="confirmPassword" className="input-label">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="pl-10 pr-10 w-full"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>
            </form>
          )}

          {/* Login Link */}
          <p className="text-center text-slate-600 mt-6 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-cyan-600 font-semibold hover:text-cyan-700">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
