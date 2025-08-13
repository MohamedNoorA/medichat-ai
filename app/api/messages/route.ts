import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { extractToken, verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { sanitizeMessage } from "@/lib/models/Message"

/**
 * GET /api/messages?conversationId=xxx
 * Fetches all messages for a specific conversation
 */
export async function GET(request: NextRequest) {
  try {
    console.log("=== GET /api/messages ===")

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

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")

    if (!conversationId || !ObjectId.isValid(conversationId)) {
      return NextResponse.json({ error: "Valid conversation ID is required" }, { status: 400 })
    }

    console.log("Fetching messages for conversation:", conversationId, "user:", decoded.userId)

    const db = await getDatabase()
    if (!db) {
      console.error("Database connection failed")
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    const messagesCollection = db.collection("messages")
    const conversationsCollection = db.collection("conversations")

    // First verify the conversation belongs to the user
    const conversation = await conversationsCollection.findOne({
      _id: new ObjectId(conversationId),
      userId: new ObjectId(decoded.userId),
    })

    if (!conversation) {
      console.log("Conversation not found or doesn't belong to user")
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Fetch messages for this conversation
    const messages = await messagesCollection
      .find({
        conversationId: new ObjectId(conversationId),
        userId: new ObjectId(decoded.userId),
      })
      .sort({ timestamp: 1 }) // Sort by timestamp ascending (oldest first)
      .toArray()

    console.log("Found messages:", messages.length)

    const sanitizedMessages = messages.map(sanitizeMessage)

    return NextResponse.json({ messages: sanitizedMessages }, { status: 200 })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/messages
 * Creates a new message in a conversation
 */
export async function POST(request: NextRequest) {
  try {
    console.log("=== POST /api/messages ===")

    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ error: "No authentication token provided" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const { conversationId, content, sender, emotion } = await request.json()

    if (!conversationId || !ObjectId.isValid(conversationId)) {
      return NextResponse.json({ error: "Valid conversation ID is required" }, { status: 400 })
    }

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    if (!sender || !["user", "ai"].includes(sender)) {
      return NextResponse.json({ error: "Valid sender is required (user or ai)" }, { status: 400 })
    }

    console.log("Creating message for conversation:", conversationId, "sender:", sender)

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    const messagesCollection = db.collection("messages")
    const conversationsCollection = db.collection("conversations")

    // Verify conversation exists and belongs to user
    const conversation = await conversationsCollection.findOne({
      _id: new ObjectId(conversationId),
      userId: new ObjectId(decoded.userId),
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Create the message
    const newMessage = {
      conversationId: new ObjectId(conversationId),
      userId: new ObjectId(decoded.userId),
      content: content.trim(),
      sender,
      timestamp: new Date(),
      emotion: emotion || null,
    }

    const result = await messagesCollection.insertOne(newMessage)
    const createdMessage = await messagesCollection.findOne({ _id: result.insertedId })

    if (!createdMessage) {
      return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
    }

    // Update conversation's updatedAt and messageCount
    await conversationsCollection.updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $set: { updatedAt: new Date() },
        $inc: { messageCount: 1 },
      },
    )

    console.log("Message created successfully:", createdMessage._id)

    return NextResponse.json({ message: sanitizeMessage(createdMessage) }, { status: 201 })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
