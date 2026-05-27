import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * Global Next.js proxy.
 * Refreshes Supabase session tokens, gates access to /dashboard/* routes,
 * and sets all security-related HTTP headers to conform with spec §11.9.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;

  // 1. Pure Path-Based Redirections (Zero network latency overhead)
  // Redirect legacy /dashboard paths to route group counterparts to prevent 404s
  if (pathname === "/dashboard") {
    const targetUrl = new URL("/", request.url);
    request.nextUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(targetUrl);
  }
  if (pathname.startsWith("/dashboard/")) {
    const targetUrl = new URL(pathname.replace("/dashboard", ""), request.url);
    request.nextUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(targetUrl);
  }

  // 2. Gate all protected dashboard UI paths in the route group if anonymous
  const protectedPaths = ["/", "/posts", "/strategy", "/analytics", "/accounts", "/billing", "/settings"];
  const isProtected = protectedPaths.includes(pathname) || pathname.startsWith("/posts/") || pathname.startsWith("/strategy/");

  if (isProtected) {
    // Initialize Supabase client ONLY for protected UI routes to prevent double auth queries on API/Webhook feeds
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set({ name, value, ...options });
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              });
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Refresh user session safely using getUser() (not getSession() as per spec §11.4)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Inject HTTP Security Headers (spec §11.9)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.vercel-insights.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.cdninstagram.com https://scontent.cdninstagram.com",
    "connect-src 'self' https://generativelanguage.googleapis.com https://api.deepseek.com https://api.stripe.com https://graph.instagram.com https://graph.facebook.com https://*.supabase.co wss://*.supabase.co",
    "frame-src 'self' https://js.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  response.headers.set("Content-Security-Policy", cspDirectives.join("; "));
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");

  return response;
}

/**
 * Configure matching routes.
 * Runs on all routes except static assets (js, css, images, fonts).
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
