import { NextRequest, NextResponse } from "next/server";

// ── Routes configuration ────────────────────────────────
// Routes that require the user to be logged IN
const PROTECTED_ROUTES = [
  "/dashboard",
  "/profile",
  "/chat",
  "/documents",
  "/settings",
];

// Routes only for guests (logged-out users)
// If a logged-in user visits these, redirect them to dashboard
const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/resetpassword",
];

// Routes that are always public (no redirect either way)
// const PUBLIC_ROUTES = ["/", "/about", "/pricing"];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Read the auth token from cookies
  // Adjust "token" to match whatever cookie name your /api/auth/login sets
  const token = req.cookies.get("token")?.value;

  const isLoggedIn = Boolean(token);

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // 1️⃣  Not logged in → trying to access a protected page → send to login
  if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL("/login", req.url);
    // Preserve the page they were trying to reach so we can redirect after login
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2️⃣  Already logged in → trying to access login/signup/etc. → send to dashboard
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 3️⃣  All other cases → allow through
  return NextResponse.next();
}

export const config = {
  /*
   * Match every route EXCEPT:
   *  - Next.js internals (_next/static, _next/image)
   *  - Public files (favicon.ico, images, fonts, etc.)
   *  - API routes (handled by their own auth checks)
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$|api/).*)",
  ],
};