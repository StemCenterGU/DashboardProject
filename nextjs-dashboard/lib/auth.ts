/**
 * Authentication utilities
 * Uses Supabase Auth exclusively
 */

import { createServerClient } from './supabase-server'

export interface User {
  user_id: string
  email: string
  full_name?: string
  role?: string
  tutor_id?: string
}

/**
 * Get current authenticated user from Supabase Auth
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return null
    }

    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session?.user) {
      return null
    }

    // Get role from users table if available, otherwise use metadata
    let role = session.user.user_metadata?.role || 'tutor'
    
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('user_id', session.user.id)
        .single()
      
      if (userData?.role) {
        role = userData.role
      }
    } catch (error) {
      // Users table lookup failed, use metadata role
    }

    return {
      user_id: session.user.id,
      email: session.user.email || '',
      full_name: session.user.user_metadata?.full_name || session.user.email || '',
      role: role,
      tutor_id: session.user.user_metadata?.tutor_id
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

