import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  
  const response = NextResponse.json({ success: true })
  
  // Clear session cookies
  response.cookies.delete('sessionToken')
  response.cookies.delete('user')
  
  return response
}

