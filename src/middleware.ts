import type { Database } from '@/types/supabase';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const TIMEOUT_DURATION = 10000; // 10 seconds

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

    // Add timeout handling for session refresh
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Session refresh timeout')), TIMEOUT_DURATION);
    });

    const {
      data: { session },
      error: sessionError
    } = await Promise.race([sessionPromise, timeoutPromise]) as any;

    // If we're on a public route and have a session, redirect to home
    if (session && path.startsWith('/auth/')) {
      const redirectUrl = new URL('/', req.url);
      return NextResponse.redirect(redirectUrl);
    }

    // If we're not on a public route and don't have a session, redirect to signin
    if (!session && !isPublicRoute) {
      const redirectUrl = new URL('/auth/signin', req.url);
      // Add a timestamp to prevent caching
      redirectUrl.searchParams.set('t', Date.now().toString());
      return NextResponse.redirect(redirectUrl);
    }

    // Handle session errors
    if (sessionError) {
      console.error('Middleware session error:', sessionError);
      
      // If it's a timeout error, try to continue without session
      if (sessionError.message === 'Session refresh timeout') {
        console.warn('Session refresh timed out, continuing without session');
        if (!isPublicRoute) {
          const redirectUrl = new URL('/auth/signin', req.url);
          redirectUrl.searchParams.set('error', 'timeout');
          redirectUrl.searchParams.set('t', Date.now().toString());
          return NextResponse.redirect(redirectUrl);
        }
        return res;
      }

      // For other errors, redirect to signin
      const redirectUrl = new URL('/auth/signin', req.url);
      redirectUrl.searchParams.set('error', 'session_error');
      redirectUrl.searchParams.set('t', Date.now().toString());
      return NextResponse.redirect(redirectUrl);
    }

    return res;

  } catch (e) {
    console.error('Middleware error:', e);
    // On error, redirect to signin with error parameter
    const redirectUrl = new URL('/auth/signin', req.url);
    redirectUrl.searchParams.set('error', 'middleware_error');
    redirectUrl.searchParams.set('t', Date.now().toString());
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