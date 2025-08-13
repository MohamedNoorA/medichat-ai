import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  console.log(`Middleware: Processing request for pathname: ${pathname}`)

  // Skip middleware for static files and API routes (except auth routes)
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  // Get token from cookies
  const token = request.cookies.get("auth-token")?.value
  console.log(`Middleware: Token found in cookies: ${token ? "YES" : "NO"}`)

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register"]
  const isPublicRoute = publicRoutes.includes(pathname)

  if (!token) {
    if (isPublicRoute) {
      console.log("Middleware: Allowing request for public route")
      return NextResponse.next()
    } else {
      console.log("Middleware: No token, redirecting to login")
      const response = NextResponse.redirect(new URL("/login", request.url))
      // Clear any stale cookies
      response.cookies.delete("auth-token")
      return response
    }
  }

  // Verify token
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    const userId = payload.id
    console.log(`Middleware: Token verified successfully. User ID: ${userId}`)

    if (!userId) {
      console.log("Middleware: Invalid token payload, redirecting to login")
      const response = NextResponse.redirect(new URL("/login", request.url))
      response.cookies.delete("auth-token")
      return response
    }

    // If user is authenticated and trying to access auth routes, redirect to dashboard
    if (pathname === "/login" || pathname === "/register") {
      console.log("Middleware: Auth route and valid token. Redirecting to /dashboard.")
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    console.log(`Middleware: Allowing request for ${pathname}`)
    return NextResponse.next()
  } catch (error) {
    console.error("Middleware: Token verification failed:", error)

    // Clear invalid token
    const response = isPublicRoute ? NextResponse.next() : NextResponse.redirect(new URL("/login", request.url))

    response.cookies.delete("auth-token")
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
