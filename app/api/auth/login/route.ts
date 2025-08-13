import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, testConnection } from "@/lib/mongodb"
import { verifyPassword, generateToken, isValidEmail } from "@/lib/auth"
import { sanitizeUser } from "@/lib/models/User"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("=== Login Attempt ===")
    console.log("Email:", email)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    console.log("Testing MongoDB connection...")
    const isConnected = await testConnection()
    if (!isConnected) {
      console.error("MongoDB connection failed during login")
      return NextResponse.json(
        {
          error: "Database connection failed. Please check your internet connection and try again later.",
        },
        { status: 503 },
      )
    }

    console.log("MongoDB connection successful, proceeding with login...")
    const db = await getDatabase()
    if (!db) {
      console.error("Database instance is undefined after getDatabase() in login route.")
      return NextResponse.json({ error: "Database connection error. Please try again later." }, { status: 500 })
    }
    const usersCollection = db.collection("users")

    console.log("Looking for user with email:", email.toLowerCase())
    const user = await usersCollection.findOne({ email: email.toLowerCase() })

    if (!user) {
      console.log("User not found")
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    console.log("User found, verifying password...")
    if (!user.password) {
      console.log("User has no password set")
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      console.log("Password verification failed")
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    console.log("Password verified, updating last login...")
    await usersCollection.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } })

    console.log("Generating token...")
    // Fix: Ensure user._id is converted to string properly
    const userId = user._id.toString()
    const token = await generateToken(userId)

    const userResponse = sanitizeUser(user)

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: userResponse,
        token,
      },
      { status: 200 },
    )

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    console.log("Login successful for user:", user.email)
    return response
  } catch (error) {
    console.error("Login error:", error)

    if (error instanceof Error) {
      if (error.message.includes("ETIMEOUT") || error.message.includes("ENOTFOUND")) {
        return NextResponse.json(
          { error: "Database connection failed. Please check your internet connection and try again." },
          { status: 503 },
        )
      } else if (error.message.includes("Authentication failed")) {
        return NextResponse.json({ error: "Database authentication failed. Please contact support." }, { status: 503 })
      }
    }

    return NextResponse.json({ error: "Internal server error. Please try again." }, { status: 500 })
  }
}
