import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { extractToken, verifyToken } from "@/lib/auth"
import { sanitizeUser } from "@/lib/models/User"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    console.log("=== GET /api/auth/me ===")
    
    const token = extractToken(request)
    console.log("Token extracted:", !!token)

    if (!token) {
      console.log("No token provided in /api/auth/me")
      return NextResponse.json({ error: "No authentication token provided" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    console.log("Token decoded:", !!decoded, decoded?.userId)
    
    if (!decoded || !decoded.userId) {
      console.log("Invalid token in /api/auth/me")
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const db = await getDatabase()
    if (!db) {
      console.error("Database instance is undefined after getDatabase() in me route.")
      return NextResponse.json({ error: "Database connection error. Please try again later." }, { status: 500 })
    }
    
    const usersCollection = db.collection("users")

    let userId: ObjectId
    try {
      userId = new ObjectId(decoded.userId)
    } catch (error) {
      console.error("Invalid user ID format:", decoded.userId)
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const user = await usersCollection.findOne({ _id: userId })
    if (!user) {
      console.log("User not found for ID:", decoded.userId)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userResponse = sanitizeUser(user)
    console.log("Successfully authenticated user:", userResponse.email)

    return NextResponse.json({ user: userResponse }, { status: 200 })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
