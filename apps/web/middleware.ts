import { NextRequest, NextResponse } from 'next/server'

const LOGIN_PAGE = '/login'
const HOME_BY_ROLE: Record<string, string> = {
  admin: '/admin',
  therapist: '/therapist',
  patient: '/patient',
}
const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page))
  const isProtected =
    pathname.startsWith('/admin') || pathname.startsWith('/therapist') || pathname.startsWith('/patient')

  const session = request.cookies.get('kinetix-session')?.value
  const role = session ? session.split('.')[0] : undefined

  if (isProtected) {
    if (!role || !HOME_BY_ROLE[role]) {
      const url = request.nextUrl.clone()
      url.pathname = LOGIN_PAGE
      const portal = pathname.split('/')[1]
      if (portal && portal in HOME_BY_ROLE) {
        url.searchParams.set('role', portal)
      }
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
    if (pathname.split('/')[1] !== role) {
      const url = request.nextUrl.clone()
      url.pathname = HOME_BY_ROLE[role]
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  if (isAuthPage && role && HOME_BY_ROLE[role]) {
    const url = request.nextUrl.clone()
    url.pathname = HOME_BY_ROLE[role]
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/therapist/:path*',
    '/patient/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify',
  ],
}
