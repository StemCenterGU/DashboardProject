import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_ROLE, PAGE_ACCESS, canAccessPage, getHomePath, isValidRole } from '@/lib/roles'

// Pages that require sign-in (everything listed in PAGE_ACCESS)
function isProtectedPage(pathname: string): boolean {
  return PAGE_ACCESS.some((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`))
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Require Supabase configuration
  if (!supabaseUrl || !supabaseAnonKey) {
    // If Supabase is not configured, redirect dashboard routes to login
    if (isProtectedPage(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname
    const isAuthPage = pathname === '/login' || pathname === '/register'

    // Protect dashboard pages - require Supabase Auth user
    if (isProtectedPage(pathname) && !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user && (isProtectedPage(pathname) || isAuthPage)) {
      // Role comes from the users table (RLS lets users read their own row)
      const { data: row } = await supabase
        .from('users')
        .select('role, active')
        .eq('user_id', user.id)
        .single()
      // Deactivated users: let login/register render, keep them out of everything else
      if (row?.active === false) {
        return isAuthPage ? response : NextResponse.redirect(new URL('/login', request.url))
      }
      // No row yet (getCurrentUser() creates one on first page load) or unknown role: default role
      const role = row?.role && isValidRole(row.role) ? row.role : DEFAULT_ROLE

      // Redirect authenticated users away from login/register
      if (isAuthPage) {
        return NextResponse.redirect(new URL(getHomePath(role), request.url))
      }

      // Role-based page access: send users to their home page
      if (!canAccessPage(role, pathname)) {
        return NextResponse.redirect(new URL(getHomePath(role), request.url))
      }
    }
  } catch (error) {
    // If there's an error, just continue - let the page handle auth
    console.error('Proxy error:', error)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

