import { NextResponse } from "next/server"
import { testConnection, getDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    console.log("=== MongoDB Connection Test ===")
    console.log("MongoDB URI:", process.env.MONGODB_URI?.replace(/\/\/.*@/, "//***:***@"))
    console.log("Database Name:", process.env.MONGODB_DB)

    console.log("Testing MongoDB connection...")
    const isConnected = await testConnection()

    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to connect to MongoDB",
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      )
    }

    console.log("Testing database operations...")
    const db = await getDatabase()
    if (!db) {
      console.error("Database instance is undefined after getDatabase() in test-db route.")
      return NextResponse.json({ error: "Database connection error. Please try again later." }, { status: 500 })
    }
    const collections = await db.listCollections().toArray()

    console.log(
      "Available collections:",
      collections.map((col) => col.name),
    )

    return NextResponse.json({
      success: true,
      message: "MongoDB connection successful!",
      database: process.env.MONGODB_DB || "medichat-ai",
      collections: collections.map((col) => col.name),
      connectionString: process.env.MONGODB_URI?.replace(/\/\/.*@/, "//***:***@"),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database test error:", error)

    let errorMessage = "Unknown error"
    if (error instanceof Error) {
      errorMessage = error.message

      if (error.message.includes("ETIMEOUT")) {
        errorMessage = "Connection timeout - check your internet connection and MongoDB Atlas network settings"
      } else if (error.message.includes("ENOTFOUND")) {
        errorMessage = "MongoDB server not found - check your connection string"
      } else if (error.message.includes("Authentication failed")) {
        errorMessage = "Authentication failed - check your username and password"
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        originalError: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
