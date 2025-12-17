import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { Navbar } from "@/components/navbar"
import { cookies } from "next/headers"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication - try Supabase Auth first
  let isAuthenticated = false
  
  try {
    const supabase = await createServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (session && !error) {
      isAuthenticated = true
    }
  } catch (error) {
    // Supabase check failed, try custom session
    // Silently continue to cookie check
  }

  // If no Supabase Auth session, check for custom session token
  if (!isAuthenticated) {
    try {
      const cookieStore = await cookies()
      const sessionToken = cookieStore.get("sessionToken")?.value
      const userCookie = cookieStore.get("user")?.value

      if (sessionToken || userCookie) {
        isAuthenticated = true
      }
    } catch (error) {
      // Cookie check failed - middleware will handle redirect
    }
  }

  // Redirect if not authenticated - but let middleware handle it first
  // This is a fallback
  if (!isAuthenticated) {
    try {
      redirect("/login")
    } catch {
      // Redirect already in progress or handled by middleware
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}

