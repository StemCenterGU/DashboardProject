/**
 * Authentication Context Provider
 * Provides global access to user authentication state and role information
 *
 * Usage:
 * 1. Wrap your app with <AuthProvider> in layout.tsx
 * 2. Use useUser() hook to access user and role in components
 *
 * Example:
 * const { user, role, isLoading, error } = useUser()
 * if (isAdminLevel(role)) { // show admin UI }
 */

'use client'

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react'
import { createClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'
import type { Role } from '@/lib/roles'

// ============================================================================
// Context Types
// ============================================================================

interface AuthContextType {
  user: User | null
  role: Role | null
  isLoading: boolean
  error: Error | null
  refreshRole: () => Promise<void>
}

// ============================================================================
// Create Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================================================
// Provider Component
// ============================================================================

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch user's role from database
  const fetchRole = async (userId: string): Promise<void> => {
    try {
      const res = await fetch('/api/auth/get-role')
      if (res.ok) {
        const data = await res.json()
        setRole(data.role || null)
      } else {
        console.error('Failed to fetch role:', res.status)
        setRole(null)
      }
    } catch (err) {
      console.error('Error fetching role:', err)
      setRole(null)
    }
  }

  // Initialize user and role on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true)

        // Get current session first to check if user is logged in
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          // Session error is not critical - user might not be logged in
          console.log('No active session:', sessionError.message)
          setUser(null)
          setRole(null)
          return
        }

        if (!session?.user) {
          // No session - user is not logged in (this is normal)
          setUser(null)
          setRole(null)
          return
        }

        // User is logged in - set user and fetch role
        setUser(session.user)
        await fetchRole(session.user.id)

      } catch (err) {
        // Don't log or set error for missing session - it's expected when not logged in
        const errorMessage = err instanceof Error ? err.message : String(err)
        if (!errorMessage.includes('session missing') && !errorMessage.includes('Auth session missing')) {
          console.error('Error initializing auth:', err)
          setError(err as Error)
        }
        setUser(null)
        setRole(null)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // Listen for auth state changes (login/logout)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)

        setUser(session?.user ?? null)

        if (session?.user) {
          // User logged in - fetch their role
          await fetchRole(session.user.id)
        } else {
          // User logged out
          setRole(null)
        }

        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // ============================================================================
  // Real-time Role Sync (Hybrid Approach)
  // ============================================================================

  // Real-time subscription - instant updates when role changes in database
  useEffect(() => {
    if (!user) return

    console.log('Setting up real-time subscription for user:', user.id)

    // Subscribe to changes on the users table for this specific user
    const channel = supabase
      .channel('user-role-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users', // Your users table name
          filter: `user_id=eq.${user.id}`, // Only listen to this user's changes
        },
        (payload) => {
          console.log('Role changed in database (real-time):', payload)
          // Update role immediately when database changes
          if (payload.new && 'role' in payload.new && payload.new.role !== role) {
            console.log(`Role updated via real-time: ${role} → ${payload.new.role}`)
            setRole(payload.new.role as Role)
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status)
      })

    return () => {
      console.log('Cleaning up real-time subscription')
      supabase.removeChannel(channel)
    }
  }, [user, role])

  // Polling fallback - checks every 60 seconds (in case real-time fails)
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      console.log('Polling role update (fallback)...')
      fetchRole(user.id)
    }, 60000) // 60 seconds as fallback

    return () => {
      clearInterval(interval)
    }
  }, [user])

  // Manual role refresh function (useful after role updates)
  const refreshRole = async () => {
    if (user) {
      await fetchRole(user.id)
    }
  }

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user,
      role,
      isLoading,
      error,
      refreshRole,
    }),
    [user, role, isLoading, error]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * Hook to access authentication context
 * Must be used within an AuthProvider
 *
 * @example
 * const { user, role, isLoading } = useUser()
 * if (isAdminLevel(role)) {
 *   return <AdminPanel />
 * }
 */
export function useUser() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useUser must be used within an AuthProvider')
  }

  return context
}

// ============================================================================
// Convenience Hooks for Common Checks
// ============================================================================

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { user, isLoading } = useUser()
  return !isLoading && user !== null
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(allowedRoles: Role[]): boolean {
  const { role, isLoading } = useUser()
  return !isLoading && role !== null && allowedRoles.includes(role)
}

// ============================================================================
// Tutor Info Hook
// ============================================================================

export interface TutorInfo {
  tutor_id: string
  tutor_name: string
  username: string
  student_id?: string
  role?: string
  user_id?: string
}

/**
 * Hook to fetch and cache the current user's tutor information
 * Returns null if the user is not linked to a tutor
 *
 * @example
 * const { tutorInfo, isLoading, error } = useTutorInfo()
 * if (tutorInfo) {
 *   console.log('Tutor ID:', tutorInfo.tutor_id)
 * }
 */
export function useTutorInfo() {
  const { user } = useUser()
  const [tutorInfo, setTutorInfo] = useState<TutorInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchTutorInfo = async () => {
      if (!user) {
        setTutorInfo(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const supabase = createClient()

        // Strategy 1: Find by user_id
        const { data: tutorByUserId, error: error1 } = await supabase
          .from('tutors')
          .select('tutor_id, tutor_name, username, student_id, role, user_id')
          .eq('user_id', user.id)
          .single()

        if (!error1 && tutorByUserId) {
          setTutorInfo(tutorByUserId)
          setIsLoading(false)
          return
        }

        // Strategy 2: Fallback - extract username from email
        if (user.email) {
          const username = user.email.split('@')[0].toLowerCase()

          const { data: tutorByUsername, error: error2 } = await supabase
            .from('tutors')
            .select('tutor_id, tutor_name, username, student_id, role, user_id')
            .eq('username', username)
            .single()

          if (!error2 && tutorByUsername) {
            // Update the tutor record to link user_id for future lookups
            await supabase
              .from('tutors')
              .update({ user_id: user.id })
              .eq('tutor_id', tutorByUsername.tutor_id)

            setTutorInfo(tutorByUsername)
            setIsLoading(false)
            return
          }
        }

        // No tutor found
        setTutorInfo(null)
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching tutor info:', err)
        setError(err as Error)
        setTutorInfo(null)
        setIsLoading(false)
      }
    }

    fetchTutorInfo()
  }, [user])

  return { tutorInfo, isLoading, error }
}
