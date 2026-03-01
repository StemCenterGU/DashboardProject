import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Navbar } from "@/components/navbar"

// Force dynamic rendering for all dashboard pages (authentication required)
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication using centralized auth utility
  const user = await getCurrentUser()

  // Redirect if not authenticated - middleware also handles this, but this is a fallback
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}

