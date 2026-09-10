import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — DO NOT remove this getUser call
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // If the refresh token is missing or invalid, clear stale supabase auth cookies
      if (
        error.code === "refresh_token_not_found" ||
        error.status === 400 ||
        error.message?.toLowerCase().includes("refresh token")
      ) {
        request.cookies.getAll().forEach((cookie) => {
          if (cookie.name.startsWith("sb-")) {
            supabaseResponse.cookies.delete(cookie.name);
          }
        });
      }
    } else {
      user = data?.user ?? null;
    }
  } catch {
    user = null;
  }

  const { pathname } = request.nextUrl;

  // Helper to preserve cookies (including deletions) on redirects
  const createRedirectResponse = (url: URL) => {
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  };

  // Auth routes that don't need protection
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isApiRoute = pathname.startsWith("/api");

  // Redirect unauthenticated users to login (API routes handle their own auth and return JSON)
  if (!user && !isAuthRoute && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return createRedirectResponse(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute) {
    // Role-based redirect happens client-side after login
    // Middleware just prevents re-visiting auth pages
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return createRedirectResponse(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - api routes (handled by their own auth checks)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
