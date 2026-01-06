import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Forzar Node.js runtime en lugar de Edge Runtime
export const runtime = 'nodejs'

/**
 * Middleware de autenticación y autorización
 * 
 * Protege rutas y verifica permisos basados en roles
 */
export async function middleware(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/error',
  ]

  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/auth/'))

  // 1. Si no está autenticado y no es ruta pública, redirigir a login
  if (!session && !isPublicRoute) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // 2. Si está autenticado e intenta acceder a rutas de auth, redirigir a dashboard
  if (session && pathname.startsWith('/auth/') && pathname !== '/auth/signout') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 3. Verificar permisos de rol para rutas protegidas
  if (session) {
    const userRole = session.user.role
    
    // Rutas de admin - solo para super_admin y admin
    if (pathname.startsWith('/admin')) {
      if (!['super_admin', 'admin'].includes(userRole)) {
        console.warn(`⚠️ Acceso denegado a ${pathname} para rol ${userRole}`)
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    
    // Rutas de inventario - solo para super_admin, admin y manager
    if (pathname.startsWith('/inventory')) {
      if (!['super_admin', 'admin', 'manager'].includes(userRole)) {
        console.warn(`⚠️ Acceso denegado a ${pathname} para rol ${userRole}`)
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
