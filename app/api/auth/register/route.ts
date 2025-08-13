import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, testConnection } from "@/lib/mongodb"
import { hashPassword, generateToken, isValidEmail, isValidPassword } from "@/lib/auth"
import { sanitizeUser, type IUser } from "@/lib/models/User"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, confirmPassword } = await request.json()

    console.log("=== Registration Attempt ===")
    console.log("Name:", name)
    console.log("Email:", email)

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    const passwordValidation = isValidPassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
    }

    console.log("Testing MongoDB connection...")
    const isConnected = await testConnection()
    if (!isConnected) {
      console.error("MongoDB connection failed during registration")
      return NextResponse.json(
        {
          error: "Database connection failed. Please check your internet connection and try again later.",
        },
        { status: 503 },
      )
    }

    console.log("MongoDB connection successful, proceeding with registration...")
    const db = await getDatabase()
    if (!db) {
      console.error("Database instance is undefined after getDatabase() in register route.")
      return NextResponse.json({ error: "Database connection error. Please try again later." }, { status: 500 })
    }
    const usersCollection = db.collection("users")

    console.log("Checking if user exists with email:", email.toLowerCase())
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    console.log("Hashing password...")
    const hashedPassword = await hashPassword(password)

    // Create plain object for insertion (not using IUser interface)
    const newUser = {
      email: email.toLowerCase(),
      password: hashedPassword,
      username: name.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        aiResponseStyle: "empathetic",
        notifications: true,
        privacyMode: true,
      },
      profile: {
        university: "Mount Kenya University",
      },
    }

    console.log("Creating new user...")
    const result = await usersCollection.insertOne(newUser)
    const createdUser = await usersCollection.findOne({ _id: result.insertedId })

    if (!createdUser) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    console.log("Generating token...")
    // Fix: Properly handle ObjectId to string conversion
    const userId = createdUser._id.toString()
    const token = await generateToken(userId)

    const userResponse = sanitizeUser(createdUser)

    const response = NextResponse.json(
      {
        message: "User registered successfully",
        user: userResponse,
        token,
      },
      { status: 201 },
    )

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    console.log("Registration successful for user:", createdUser.email)
    return response
  } catch (error) {
    console.error("Registration error:", error)

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
