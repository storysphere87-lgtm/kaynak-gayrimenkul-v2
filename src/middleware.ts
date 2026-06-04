import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

const locales = ['tr', 'en', 'ar'];
const defaultLocale = 'tr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Identify Paths
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/') || locales.some(lang => pathname === `/${lang}/admin` || pathname.startsWith(`/${lang}/admin/`));
  const isLoginPath = pathname === '/admin/login' || locales.some(lang => pathname === `/${lang}/admin/login`);

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  let user = null;
  let supabase = null;

  // 2. Auth Guard & Session Update - ONLY run on Admin paths (Bypass login page to prevent Supabase network latency)
  if (isAdminPath && !isLoginPath) {
    const sessionData = await updateSession(request);
    supabaseResponse = sessionData.supabaseResponse;
    user = sessionData.user;
    supabase = sessionData.supabase;

    // Admin Only Restricted Paths (Agents cannot enter)
    const adminOnlyPaths = ['/kpi', '/settings'];
    const isRestrictedAdminPath = adminOnlyPaths.some(p => pathname.includes(p));

    // Auth Guard check
    if (!user) {
      // Not logged in -> Redirect to localized login page
      const loginUrl = new URL(`/${defaultLocale}/admin/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    // RBAC: Check role if trying to access restricted admin pages
    if (isRestrictedAdminPath && supabase) {
      const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

      if (profile?.role !== 'admin') {
        // Agent trying to access admin-only page -> Redirect to pipeline
        const fallbackUrl = new URL(`/${defaultLocale}/admin/pipeline`, request.url);
        return NextResponse.redirect(fallbackUrl);
      }
    }
  }


  // 3. Locale Routing Logic
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return supabaseResponse;
  
  // Dil öneki (locale) olmayan admin yollarını otomatik /tr/admin'e yönlendirelim (Çökmeleri tamamen engeller)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const localizedPath = `/${defaultLocale}${pathname}`;
    const redirectUrl = new URL(localizedPath, request.url);
    
    const redirectResponse = NextResponse.redirect(redirectUrl);
    // Supabase session çerezlerini kopyalayalım
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }
  
  if (pathname.startsWith('/api')) return supabaseResponse;

  // Redirect if there is no locale
  request.nextUrl.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`;
  
  const finalResponse = NextResponse.redirect(request.nextUrl);
  
  // Copy cookies from supabaseResponse to the final redirect response
  supabaseResponse.cookies.getAll().forEach(cookie => {
    finalResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return finalResponse;
}

export const config = {
  // Matcher ignoring `/_next/` and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
