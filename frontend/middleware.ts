import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only apply middleware to admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // In a real app, you'd verify the JWT token here
    // For now, we'll rely on client-side protection
    // since we're using localStorage for auth state
    
    // You could add additional server-side checks here
    // like verifying a session cookie or JWT token
    
    return NextResponse.next()
  }

  return NextResponse.next()
}

// Configure which paths trigger middleware
export const config = {
  matcher: [
    '/admin/:path*',
  ]
}
