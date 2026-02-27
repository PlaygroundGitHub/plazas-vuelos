import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const session = request.cookies.get('vuelos-session');
    const isLoginPage = request.nextUrl.pathname === '/login';

    // Allow access to /login and static assets
    if (isLoginPage ||
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.includes('/api/auth') ||
        request.nextUrl.pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Redirect to login if no session
    if (!session) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
