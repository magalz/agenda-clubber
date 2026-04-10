import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const isAuthPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup');
  const isOnboardingPage = request.nextUrl.pathname.startsWith('/onboarding');

  // 1. Redirect to login if not authenticated and trying to access protected route
  if (!user && !isAuthPage && !request.nextUrl.pathname.startsWith('/public')) {
    // Check if it's the home page, maybe allow public view
    if (request.nextUrl.pathname !== '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 2. If authenticated, check for profile completeness
  if (user && !isOnboardingPage && !isAuthPage) {
    // We need to check if user has a profile in the 'profiles' table.
    const { createServerClient, parseCookieHeader } = await import('@supabase/ssr');
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookies = parseCookieHeader(request.headers.get('Cookie') ?? '');
            return cookies.map((cookie) => ({
              name: cookie.name,
              value: cookie.value ?? '',
            }));
          },
        },
      }
    );

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile && !isOnboardingPage) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
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
