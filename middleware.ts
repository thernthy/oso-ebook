import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

// Which roles can access which route prefixes
const ROUTE_ROLES: Record<string, string[]> = {
  '/dashboard/oso':     ['oso'],
  '/dashboard/partner': ['oso', 'partner'],
  '/dashboard/author':  ['oso', 'partner', 'author'],
  '/dashboard/reader':  ['oso', 'partner', 'author', 'reader'],
}

// Role -> default dashboard
const ROLE_HOME: Record<string, string> = {
  oso:     '/dashboard/oso',
  partner: '/dashboard/partner',
  author:  '/dashboard/author',
  reader:  '/dashboard/reader',
}

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  // Already logged in and hitting /auth/login → redirect to their dashboard
  if (pathname === '/auth/login' && token) {
    const home = ROLE_HOME[token.role as string] ?? '/dashboard/reader'
    return NextResponse.redirect(new URL(home, req.url))
  }

  // Check dashboard routes
  const matchedRoute = Object.keys(ROUTE_ROLES).find(route =>
    pathname.startsWith(route)
  )

  if (matchedRoute) {
    // Not logged in → send to login
    if (!token) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Wrong role → send to their own dashboard
    const allowed = ROUTE_ROLES[matchedRoute]
    if (!allowed.includes(token.role as string)) {
      const home = ROLE_HOME[token.role as string] ?? '/dashboard/reader'
      return NextResponse.redirect(new URL(home, req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/login'],
}
