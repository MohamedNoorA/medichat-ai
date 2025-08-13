import mongoose, { Schema, models, type Document } from "mongoose"
import type { ObjectId } from "mongodb"

export interface IMessage extends Document {
  conversationId: ObjectId
  userId: ObjectId
  sender: "user" | "ai"
  content: string
  timestamp: Date
  emotion?: {
    detected: string
    confidence: number
  }
  aiResponse?: {
    model: string
    processingTime: number
    isCrisis: boolean
  }
  sentimentScore?: number
}

// Add MessageResponse interface for API responses
export interface MessageResponse {
  _id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  conversationId: string
  userId: string
  emotion?: {
    detected: string
    confidence: number
  }
  aiResponse?: {
    model: string
    processingTime: number
    isCrisis: boolean
  }
}

// Add Message type for plain objects (without Mongoose Document properties)
export interface MessageType {
  _id?: ObjectId
  conversationId: ObjectId
  userId: ObjectId
  sender: "user" | "ai"
  content: string
  timestamp: Date
  emotion?: {
    detected: string
    confidence: number
  }
  aiResponse?: {
    model: string
    processingTime: number
    isCrisis: boolean
  }
  sentimentScore?: number
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Conversation",
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    sender: {
      type: String,
      required: true,
      enum: ["user", "ai"],
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    emotion: {
      detected: { type: String, required: false },
      confidence: { type: Number, required: false },
    },
    aiResponse: {
      model: { type: String, required: false },
      processingTime: { type: Number, required: false },
      isCrisis: { type: Boolean, required: false },
    },
    sentimentScore: {
      type: Number,
      required: false,
    },
  },
  { timestamps: true },
)

const MessageModel = models.Message || mongoose.model<IMessage>("Message", messageSchema)

// Export sanitizeMessage function
export function sanitizeMessage(message: any): MessageResponse {
  return {
    _id: message._id?.toString() || '',
    content: message.content,
    sender: message.sender,
    timestamp: message.timestamp,
    conversationId: message.conversationId?.toString() || '',
    userId: message.userId?.toString() || '',
    emotion: message.emotion,
    aiResponse: message.aiResponse,
  }
}

export { MessageModel as Message }
