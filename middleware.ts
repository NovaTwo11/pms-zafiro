import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que requieren autenticación
const protectedRoutes = ['/dashboard', '/reservas', '/habitaciones', '/huespedes', '/pos', '/reportes', '/settings']

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value
    const { pathname } = request.nextUrl

    // 1. Si intenta acceder a una ruta protegida y no tiene token
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    if (isProtectedRoute && !token) {
        const loginUrl = new URL('/login', request.url)
        // Redirigir al login
        return NextResponse.redirect(loginUrl)
    }

    // 2. Si ya tiene token e intenta ir al login, mandarlo al dashboard
    if (pathname === '/login' && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

// Configuración para que el middleware no corra en archivos estáticos
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}