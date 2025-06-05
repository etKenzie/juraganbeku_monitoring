import type { Database } from '@/types/supabase';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  try {
    // Create a response object that we'll modify
    const res = NextResponse.next();

    // Create the Supabase client
    const supabase = createMiddlewareClient<Database>({ req, res });

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
      const redirectUrl = new URL('/auth/signin', req.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Refresh session if expired - this will update the session cookie if needed
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Middleware session error:', sessionError);
      // If there's a session error, redirect to signin
      const redirectUrl = new URL('/auth/signin', req.url);
      return NextResponse.redirect(redirectUrl);
    }

    if (!session && !isPublicRoute) {
      const redirectUrl = new URL('/auth/signin', req.url);
      return NextResponse.redirect(redirectUrl);
    }

    if (session && path.startsWith('/auth/')) {
      const redirectUrl = new URL('/', req.url);
      return NextResponse.redirect(redirectUrl);
    }

    return res;

  } catch (e) {
    console.error('Middleware error:', e);
    // On error, redirect to signin
    const redirectUrl = new URL('/auth/signin', req.url);
    return NextResponse.redirect(redirectUrl);
  }
}

// Specify which routes this middleware should run on
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