/**
 * Admin Layout
 * Protects all /admin routes - only accessible to admins
 */

'use client'

import { useUser } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { isAdminLevel } from '@/lib/roles'
import { Loader2 } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { role, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    // Redirect non-admin users
    if (!isLoading && !isAdminLevel(role)) {
      router.push('/dashboard')
    }
  }, [role, isLoading, router])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  // Don't render if not admin
  if (!isAdminLevel(role)) {
    return null
  }

  // Render admin content
  return <>{children}</>
}
