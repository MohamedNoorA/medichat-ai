import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { extractToken, verifyToken, isValidEmail } from "@/lib/auth"
import { sanitizeUser } from "@/lib/models/User"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest) {
  try {
    console.log("=== Profile Update Request ===")

    const token = extractToken(request)
    if (!token) {
      console.log("No token provided")
      return NextResponse.json({ error: "No authentication token provided" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      console.log("Invalid token")
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const { name, email } = await request.json()
    console.log("Profile update request for user:", decoded.userId, "Name:", name, "Email:", email)

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    const db = await getDatabase()
    if (!db) {
      console.error("Database connection failed")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    const usersCollection = db.collection("users")

    // Check if email is being changed and if it already exists
    if (email) {
      const existingUser = await usersCollection.findOne({
        email: email.toLowerCase(),
        _id: { $ne: new ObjectId(decoded.userId) }, // Exclude current user
      })

      if (existingUser) {
        return NextResponse.json({ error: "Email address is already in use" }, { status: 409 })
      }
    }

    const updateData: any = {
      username: name.trim(),
      updatedAt: new Date(),
    }

    // Only update email if provided
    if (email) {
      updateData.email = email.toLowerCase()
    }

    console.log("Updating user profile...")
    const result = await usersCollection.updateOne({ _id: new ObjectId(decoded.userId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      console.log("User not found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("Fetching updated user data...")
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) })
    if (!updatedUser) {
      console.log("Failed to fetch updated user")
      return NextResponse.json({ error: "Failed to fetch updated user" }, { status: 500 })
    }

    console.log("Profile updated successfully for user:", decoded.userId)
    return NextResponse.json({
      message: "Profile updated successfully",
      user: sanitizeUser(updatedUser),
      success: true,
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
