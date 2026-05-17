import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['tr', 'en', 'ar'];
const defaultLocale = 'tr';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect Admin Routes (both /admin and /[lang]/admin)
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/') || locales.some(lang => pathname === `/${lang}/admin` || pathname.startsWith(`/${lang}/admin/`));
  const isLoginPath = pathname === '/admin/login' || locales.some(lang => pathname === `/${lang}/admin/login`);

  if (isAdminPath && !isLoginPath) {
    const authCookie = request.cookies.get('admin_session');
    if (authCookie?.value !== 'authenticated') {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Check if there is any supported locale in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;
  if (pathname.startsWith('/admin')) return;

  // Redirect if there is no locale
  request.nextUrl.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
