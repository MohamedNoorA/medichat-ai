import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("=== Logout Request ===")

  const response = NextResponse.json(
    {
      message: "Logged out successfully",
      success: true,
    },
    { status: 200 },
  )

  // Clear the auth-token cookie with all possible configurations
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0, // Expire immediately
    path: "/",
  })

  // Also try to delete the cookie
  response.cookies.delete("auth-token")

  // Clear any other potential auth cookies
  response.cookies.set("next-auth.session-token", "", {
    maxAge: 0,
    path: "/",
  })

  console.log("Logout: Cookies cleared")
  return response
}

export async function POST(request: NextRequest) {
  // Support both GET and POST for logout
  return GET(request)
}
