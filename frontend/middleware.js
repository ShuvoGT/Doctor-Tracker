import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login'];
const PROTECTED_PREFIXES = ['/dashboard', '/doctors', '/patients'];

// Route guard based on the dt_token cookie: no token on a protected route goes
// to /login, and a logged-in user hitting /login goes to /dashboard.
export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('dt_token')?.value;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (PUBLIC_PATHS.includes(pathname) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/doctors/:path*', '/patients/:path*', '/login'],
};
