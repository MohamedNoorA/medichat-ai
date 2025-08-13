import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { extractToken, verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { sanitizeConversation } from "@/lib/models/Conversation"

/**
 * DELETE /api/conversations/[id]
 * Deletes a specific conversation and all its messages
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("=== DELETE /api/conversations/[id] ===")

    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ error: "No authentication token provided" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const conversationId = params.id
    console.log("Deleting conversation:", conversationId)

    if (!conversationId || !ObjectId.isValid(conversationId)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 })
    }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }
    
    const conversationsCollection = db.collection("conversations")
    const messagesCollection = db.collection("messages")

    // Verify the conversation belongs to the user
    const conversation = await conversationsCollection.findOne({
      _id: new ObjectId(conversationId),
      userId: new ObjectId(decoded.userId),
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Delete all messages in this conversation first
    await messagesCollection.deleteMany({
      conversationId: new ObjectId(conversationId),
      userId: new ObjectId(decoded.userId),
    })

    // Delete the conversation
    const result = await conversationsCollection.deleteOne({
      _id: new ObjectId(conversationId),
      userId: new ObjectId(decoded.userId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 })
    }

    console.log("Conversation deleted successfully:", conversationId)

    return NextResponse.json({ message: "Conversation deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PUT /api/conversations/[id]
 * Updates a conversation (e.g., rename)
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("=== PUT /api/conversations/[id] ===")

    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ error: "No authentication token provided" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const conversationId = params.id
    const { title } = await request.json()

    console.log("Updating conversation:", conversationId, "with title:", title)

    if (!conversationId || !ObjectId.isValid(conversationId)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 })
    }

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }
    
    const conversationsCollection = db.collection("conversations")

    // Update the conversation
    const result = await conversationsCollection.updateOne(
      {
        _id: new ObjectId(conversationId),
        userId: new ObjectId(decoded.userId),
      },
      {
        $set: {
          title: title.trim(),
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const updatedConversation = await conversationsCollection.findOne({
      _id: new ObjectId(conversationId),
      userId: new ObjectId(decoded.userId),
    })

    if (!updatedConversation) {
      return NextResponse.json({ error: "Failed to fetch updated conversation" }, { status: 500 })
    }

    console.log("Conversation updated successfully:", conversationId)

    return NextResponse.json({ conversation: sanitizeConversation(updatedConversation) }, { status: 200 })
  } catch (error) {
    console.error("Error updating conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
