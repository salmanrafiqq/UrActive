'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, Home, Compass, Calendar, Plus, Settings, LogOut, Shield, User, Briefcase } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { subscribeToAuthChanges, logout } from '@/lib/auth'
import { getUserProfile } from '@/lib/database'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

export function Navigation() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<'student' | 'admin' | null>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setCurrentUser(user)
      if (user) {
        try {
          const profile = await getUserProfile(user.uid)
          setUserRole((profile as any)?.role || 'student')
          setUserAvatar((profile as any)?.avatar || null)
        } catch (err) {
          setUserRole('student')
          setUserAvatar(null)
        }
      } else {
        setUserRole(null)
        setUserAvatar(null)
      }
    })

    return unsubscribe
  }, [])

  // Handle clicks outside profile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu])

  // Navigation items shown only when authenticated
  const authenticatedNavItems: NavItem[] = [
    { href: '/discover', label: 'Discover', icon: <Compass size={18} /> },
    { href: '/my-events', label: 'My Events', icon: <Calendar size={18} /> },
    { href: '/organizer-dashboard', label: 'Organizer', icon: <Briefcase size={18} /> },
    { href: '/create-event', label: 'Create Event', icon: <Plus size={18} /> },
  ]

  const handleLogout = async () => {
    try {
      await logout()
      setCurrentUser(null)
      setUserRole(null)
      setShowProfileMenu(false)
      router.push('/')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <nav className="bg-white border-b border-slate-300 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-primary text-xl">
            <img 
              src="https://i.ibb.co/RkzwSRMb/Ur-Active-Logo.png" 
              alt="URActive Logo" 
              className="h-10 w-auto max-w-xs object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.textContent = 'UR';
              }}
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {currentUser && authenticatedNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors text-sm font-medium"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}

            {userRole === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center gap-2 bg-cyan-600 text-white px-3 py-1.5 rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium"
              >
                <Shield size={18} />
                Admin
              </Link>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt="User avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                      {currentUser.email?.[0].toUpperCase() || 'U'}
                    </div>
                  )}
                  {!showProfileMenu && (
                    <div className="text-left text-sm">
                      <p className="font-semibold text-slate-900">{currentUser.email?.split('@')[0]}</p>
                      <p className="text-xs text-slate-600 capitalize">{userRole || 'Student'}</p>
                    </div>
                  )}
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-50">
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="block px-4 py-2 text-slate-700 hover:bg-slate-100 text-sm font-medium flex items-center gap-2"
                    >
                      <User size={16} />
                      Profile Settings
                    </Link>
                    <div className="border-t border-slate-200 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 text-sm flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-primary hover:text-primary/80 font-medium text-sm">
                  Log In
                </Link>
                <Link href="/signup" className="btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-slate-200">
            {currentUser && authenticatedNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 py-3 px-2 text-slate-700 hover:bg-slate-100 rounded text-sm font-medium"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}

            {userRole === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center gap-2 py-3 px-2 text-slate-700 hover:bg-slate-100 rounded text-sm font-medium"
              >
                <Shield size={18} />
                Admin
              </Link>
            )}

            <div className="border-t border-slate-200 mt-4 pt-4">
              {currentUser ? (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 py-2 px-2 text-slate-700 hover:bg-slate-100 rounded text-sm font-medium"
                  >
                    <User size={18} />
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-2 py-2 text-slate-700 hover:bg-slate-100 text-sm font-medium flex items-center gap-2 rounded"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block py-2 px-2 text-slate-700 text-sm font-medium">
                    Log In
                  </Link>
                  <Link href="/signup" className="block py-2 px-2 btn-primary mt-2">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
