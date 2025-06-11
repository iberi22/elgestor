import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

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
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define protected routes (e.g., everything in an '(app)' group or specific paths)
  // For this milestone, let's protect '/profile' and a future '/dashboard'
  const protectedPaths = ['/profile', '/dashboard'] // Add more as needed
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin')

  // If user is not signed in and the current path is protected
  if (!user && protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  // If user is signed in, but tries to access auth pages like signin/signup, redirect to dashboard
  if (user && (request.nextUrl.pathname.startsWith('/signin') || request.nextUrl.pathname.startsWith('/signup'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url)) // Assuming '/dashboard' is the main page after login
  }

  // Role-based protection for admin routes (basic example)
  // This requires 'role' to be available in user's metadata or a separate 'profiles' table
  if (user && isAdminPath) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (error || !profile || profile.role !== 'admin') {
      // Redirect to a general access page or show an unauthorized message
      // For now, let's redirect to dashboard, or a specific 'unauthorized' page if it existed
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url))
    }
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
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth).*)', // Exclude /auth routes from initial check, handle them specifically
    '/signin', // Specifically match to redirect if logged in
    '/signup', // Specifically match to redirect if logged in
  ],
}
