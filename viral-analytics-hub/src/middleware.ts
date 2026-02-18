import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Define public paths that don't need authentication
  const isPublicPath = path === '/login' || path === '/signup' || path === '/public';

  // 2. Check for session token
  const token = request.cookies.get('JSESSIONID')?.value;

  // 3. Redirect logic
  // ONLY redirect to login if accessing a protected route without a token
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // We REMOVED the auto-redirect from /login -> /dashboard
  // because JSESSIONID might exist for unauthenticated users (anonymous sessions).
  // The client-side (Unprotected /login page) will handle the redirect 
  // if the user turns out to be truly authenticated (via useUser hook).
  
  return NextResponse.next();
}

// 4. Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
