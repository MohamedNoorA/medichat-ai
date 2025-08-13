import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { extractToken, verifyToken, verifyPassword, hashPassword, isValidPassword } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest) {
  try {
    console.log("=== Change Password Request ===")

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

    const { currentPassword, newPassword } = await request.json()
    console.log("Password change request for user:", decoded.userId)

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
    }

    const passwordValidation = isValidPassword(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 })
    }

    const db = await getDatabase()
    if (!db) {
      console.error("Database connection failed")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    const usersCollection = db.collection("users")

    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) {
      console.log("User not found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.password) {
      console.log("User has no password set")
      return NextResponse.json({ error: "User has no password set" }, { status: 400 })
    }

    console.log("Verifying current password...")
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      console.log("Current password is incorrect")
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    console.log("Hashing new password...")
    const hashedNewPassword = await hashPassword(newPassword)

    console.log("Updating password in database...")
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(decoded.userId) },
      {
        $set: {
          password: hashedNewPassword,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      console.log("Failed to update password - no user matched")
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }

    console.log("Password changed successfully for user:", decoded.userId)
    return NextResponse.json({
      message: "Password changed successfully",
      success: true,
    })
  } catch (error) {
    console.error("Password change error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
