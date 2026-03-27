"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User, Settings, Code2, Users, CalendarClock } from "lucide-react"

export function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          // Always fetch from API so role comes from users table (e.g. developer)
          const response = await fetch("/api/user-info")
          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
          } else {
            setUser({
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || session.user.email,
              role: session.user.user_metadata?.role || 'tutor',
            })
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Error fetching user info:", error)
      }
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUser()
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    try {
      // Sign out from Supabase Auth
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error("Logout error:", error)
      }

      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("user")
      }

      // Redirect to login
      router.push("/login")
      router.refresh()
    } catch (err) {
      console.error("Logout error:", err)
      // Still redirect even if logout fails
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="text-xl font-bold">
            📋 Tutor Dashboard
          </Link>
          <div className="hidden md:flex space-x-4">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/scheduling" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Scheduling
            </Link>
            <Link href="/charts" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Analytics
            </Link>
            <Link href="/calendar" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Calendar
            </Link>
            <Link href="/tutor-schedules" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
              <CalendarClock className="h-4 w-4" />
              Tutor Schedules
            </Link>
            {(user?.role === "admin" || user?.role === "manager") && (
              <Link href="/users" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Users className="h-4 w-4" />
                Users
              </Link>
            )}
            {user?.role === "developer" && (
              <Link href="/replica" className="text-sm font-medium text-foreground hover:text-foreground flex items-center gap-1">
                <Code2 className="h-4 w-4" />
                Replica
                <span className="text-[10px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">New</span>
              </Link>
            )}
          </div>
        </div>

        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {(user?.full_name || user?.user_metadata?.full_name || user?.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.full_name || user?.user_metadata?.full_name || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" className="relative h-8 w-8 rounded-full" disabled>
            <Avatar className="h-8 w-8">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </Button>
        )}
      </div>
    </nav>
  )
}

