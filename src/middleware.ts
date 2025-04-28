import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

export async function middleware(req: NextRequest) {
  try {
    // Create a response object that we'll modify
    const res = NextResponse.next();

    // Create the Supabase client
    const supabase = createMiddlewareClient<Database>({ req, res });

    // Refresh session if expired - this will update the session cookie if needed
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Get the pathname of the request
    const path = req.nextUrl.pathname;

    // Public routes that don't require authentication
    const isPublicRoute = 
      path.startsWith('/auth/') || 
      path.startsWith('/_next/') || 
      path.startsWith('/public/') ||
      path === '/favicon.ico';

    // Handle sign-out explicitly
    if (path === '/auth/signout') {
      // console.log('Middleware - Processing sign-out');
      return res;
    }

    if (!session && !isPublicRoute) {
      // console.log('Middleware - No session, redirecting to signin');
      const redirectUrl = new URL('/auth/signin', req.url);
      return NextResponse.redirect(redirectUrl);
    }

    if (session && path.startsWith('/auth/')) {
      // console.log('Middleware - Has session, redirecting to dashboard');
      const redirectUrl = new URL('/', req.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Update response headers to set cookie
    return res;

  } catch (e) {
    console.error('Middleware error:', e);
    // On error, allow the request to continue
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 