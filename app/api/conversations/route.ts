import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { extractToken, verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { sanitizeConversation, type ConversationType } from "@/lib/models/Conversation"

/**
 * GET /api/conversations
 * Fetches all conversations for the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    console.log("=== GET /api/conversations ===")

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

    console.log("Fetching conversations for user:", decoded.userId)

    const db = await getDatabase()
    if (!db) {
      console.error("Database instance is undefined after getDatabase() in conversations GET route.")
      return NextResponse.json({ error: "Database connection error. Please try again later." }, { status: 500 })
    }
    const conversationsCollection = db.collection("conversations")

    const conversations = await conversationsCollection
      .find({ userId: new ObjectId(decoded.userId) })
      .sort({ updatedAt: -1 })
      .toArray()

    console.log("Found conversations:", conversations.length)

    const sanitizedConversations = conversations.map(sanitizeConversation)

    return NextResponse.json({ conversations: sanitizedConversations }, { status: 200 })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/conversations
 * Creates a new conversation for the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    console.log("=== POST /api/conversations ===")

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

    console.log("Creating new conversation for user:", decoded.userId)

    const db = await getDatabase()
    if (!db) {
      console.error("Database instance is undefined after getDatabase() in conversations POST route.")
      return NextResponse.json({ error: "Database connection error. Please try again later." }, { status: 500 })
    }
    const conversationsCollection = db.collection("conversations")

    // Create plain object for insertion
    const newConversation = {
      userId: new ObjectId(decoded.userId),
      title: "New Chat",
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      emotionTrends: [],
      messageCount: 0,
    }

    const result = await conversationsCollection.insertOne(newConversation)
    const createdConversation = await conversationsCollection.findOne({ _id: result.insertedId })

    if (!createdConversation) {
      console.log("Failed to create conversation")
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
    }

    console.log("Created conversation:", createdConversation._id)

    return NextResponse.json({ conversation: sanitizeConversation(createdConversation) }, { status: 201 })
  } catch (error) {
    console.error("Error creating conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
