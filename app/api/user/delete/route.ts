import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { extractToken, verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function DELETE(request: NextRequest) {
  try {
    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ error: "No authentication token provided" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }
    
    const userId = new ObjectId(decoded.userId)

    // Delete in order: messages, conversations, user
    await db.collection("messages").deleteMany({ userId })
    await db.collection("conversations").deleteMany({ userId })
    const userResult = await db.collection("users").deleteOne({ _id: userId })

    if (userResult.deletedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Clear the auth cookie
    const response = NextResponse.json({ message: "Account deleted successfully" })
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
