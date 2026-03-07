// frontend/middleware.ts

import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/admin/login',
  '/stats',
  '/',
  '/chat',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Solo protege rutas /admin (excepto /admin/login)
  if (!pathname.startsWith('/admin') || pathname === '/admin/login') {
    return NextResponse.next()
  }

  // Verifica cookie de sesión
  const sessionToken = request.cookies.get('admin_session')?.value

  if (!sessionToken) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
