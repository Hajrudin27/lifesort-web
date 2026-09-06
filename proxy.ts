import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { canAccessPath, isAdminRole } from '@/lib/admin-roles';
import { buildCsp } from '@/lib/csp';

export async function proxy(request: NextRequest) {
  /**
   * Nonce pr. request til admin-panelets CSP.
   *
   * Next.js læser nonce'en ud af den CSP vi sætter på REQUEST-headeren og påfører den sine
   * egne script-tags. Derfor skal politikken stå begge steder: på requesten så Next kan se
   * den, og på svaret så browseren håndhæver den.
   *
   * Proxy'en kører kun på /admin (se matcher), så det offentlige, statiske site berøres
   * ikke — dets CSP kommer fra next.config.ts.
   */
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const csp = buildCsp({ nonce, isDev: process.env.NODE_ENV !== 'production' });

  const withNonce = () => {
    const headers = new Headers(request.headers);
    headers.set('x-nonce', nonce);
    headers.set('content-security-policy', csp);
    const res = NextResponse.next({ request: { headers } });
    res.headers.set('content-security-policy', csp);
    return res;
  };

  let response = withNonce();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // Svaret bygges om her, så nonce og CSP skal sættes igen — ellers ville netop de
          // requests der fornyer sessionen ryge ud uden politik.
          response = withNonce();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname.startsWith('/admin/login');

  if (!user) {
    return isLoginRoute ? response : NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // At være logget ind er ikke nok. Alle app-brugere ligger i det samme Supabase-projekt,
  // så en helt almindelig LifeSort-bruger har en gyldig session på admin-domænet.
  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!adminRow || !isAdminRole(adminRow.role)) {
    if (isLoginRoute) return response;
    // Ryd sessionen, ellers ryger brugeren i et loop mellem login og redirect.
    await supabase.auth.signOut();
    const url = new URL('/admin/login', request.url);
    url.searchParams.set('error', 'no-access');
    return NextResponse.redirect(url);
  }

  if (isLoginRoute) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // Rollebaseret adgang til de enkelte sider. Databasen håndhæver det samme via RLS —
  // dette forhindrer blot at nogen lander på en side der alligevel ville være tom.
  if (!canAccessPath(adminRow.role, pathname)) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
