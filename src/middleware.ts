import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr' // Needs manual npm install @supabase/ssr

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update request cookies for current processing
          request.cookies.set({ name, value, ...options })
          // Prepare response to set the cookie
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Session error in middleware:', error)
    }

    const user = session?.user
    const { pathname } = request.nextUrl

    console.log('Middleware - Path:', pathname, 'User:', user ? 'authenticated' : 'not authenticated')

    // Define protected routes that require login
    const isAppRoute = pathname.startsWith('/profile') || pathname.startsWith('/dashboard') || pathname.startsWith('/admin')
    const isAuthRoute = pathname.startsWith('/signin') || pathname.startsWith('/signup')

    // If user is not signed in and trying to access a protected app route
    if (!user && isAppRoute) {
      console.log('Redirecting to signin - no user for protected route')
      return NextResponse.redirect(new URL('/signin', request.url))
    }

    // If user is signed in, but tries to access auth pages like signin/signup, redirect to dashboard
    if (user && isAuthRoute) {
      console.log('Redirecting to dashboard - user already authenticated')
      const response = NextResponse.redirect(new URL('/dashboard', request.url), {
        status: 303, // See Other
      })
      response.headers.set('x-middleware-cache', 'no-cache')
      return response
    }

    // Admin route protection
    if (user && pathname.startsWith('/admin')) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error || !profile || profile.role !== 'admin') {
        // User is not an admin or profile fetch failed, redirect them.
        // Redirect to a general dashboard or a specific 'unauthorized' page.
        // Adding a query param for clarity on client-side if needed.
        return NextResponse.redirect(new URL('/dashboard?error=admin_unauthorized', request.url))
      }
    }

  } catch (error) {
    console.error('Middleware error:', error)
  }

  return response
}

export const config = {
  matcher: [
    // Comenta temporalmente para deshabilitar el middleware
    // '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
