import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const isAuthPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup');
  const isPublicPage = 
    request.nextUrl.pathname === '/' || 
    request.nextUrl.pathname.startsWith('/public');

  // 1. Redirect to login if NOT authenticated and trying to access PROTECTED route
  if (!user && !isAuthPage && !isPublicPage) {
    return Response.redirect(new URL('/login', request.url));
  }

  // 2. Redirect to home if authenticated and trying to access AUTH pages (login/signup)
  if (user && isAuthPage) {
    return Response.redirect(new URL('/', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (handled separately)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
