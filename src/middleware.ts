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
      path.includes('reset-password') ||
      path.includes('recovery') ||
      path === '/favicon.ico';

    // If we're on signin page and have a recovery token, redirect to reset password immediately
    if (path === '/auth/signin' && req.url.includes('access_token')) {
      const resetPasswordUrl = new URL('/auth/reset-password', req.url);
      // Preserve the hash fragment
      const hashPart = req.url.split('#')[1];
      if (hashPart) {
        resetPasswordUrl.hash = hashPart;
      }
      return NextResponse.redirect(resetPasswordUrl);
    }

    // Check if this is a reset password flow
    const hasRecoveryToken = req.url.includes('access_token') || req.nextUrl.searchParams.has('access_token');
    const isResetPasswordFlow = hasRecoveryToken || path.includes('reset-password') || path.includes('recovery');

    // If this is a reset password flow, allow access without session check
    if (isResetPasswordFlow) {
      return res;
    }

    // Handle sign-out explicitly
    if (path === '/auth/signout') {
      // Clear all cookies
      const response = NextResponse.redirect(new URL('/auth/signin', req.url));
      response.cookies.delete('sb-access-token');
      response.cookies.delete('sb-refresh-token');
      response.cookies.delete('sb-provider-token');
      response.cookies.delete('sb-auth-token');
      response.cookies.delete('sb-user-id');
      response.cookies.delete('sb-user-role');
      response.cookies.delete('sb-user-session');
      response.cookies.delete('token');
      response.cookies.delete('refresh_token');
      response.cookies.delete('brand_id');
      return response;
    }

    // Try to get the session with retries
    let session = null;
    let sessionError = null;
    const maxRetries = 3;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session refresh timeout')), TIMEOUT_DURATION);
        });

        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
        session = result.data.session;
        break;
      } catch (error: any) {
        sessionError = error;
        // If it's a refresh token error, break immediately
        if (error?.code === 'refresh_token_not_found') {
          break;
        }
        // For other errors, retry with exponential backoff
        if (i < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, i), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

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
      if (sessionError?.code === 'refresh_token_not_found') {
        redirectUrl.searchParams.set('error', 'session_expired');
      }
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
    '/auth/:path*',
  ],
}; 