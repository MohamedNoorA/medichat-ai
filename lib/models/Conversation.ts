import mongoose, { Schema, models, type Document } from "mongoose"
import type { ObjectId } from "mongodb"

export interface IConversation extends Document {
  userId: ObjectId
  title: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  emotionTrends: { date: Date; emotion: string; score: number }[]
  messageCount: number
}

// Add ConversationResponse interface for API responses
export interface ConversationResponse {
  _id: string
  title: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  emotionTrends: { date: Date; emotion: string; score: number }[]
  messageCount: number
  userId: string
}

// Add ConversationType for plain objects (without Mongoose Document properties)
export interface ConversationType {
  _id?: ObjectId
  userId: ObjectId
  title: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  emotionTrends: { date: Date; emotion: string; score: number }[]
  messageCount: number
}

const conversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
      default: "New Chat",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emotionTrends: [
      {
        date: { type: Date, required: true },
        emotion: { type: String, required: true },
        score: { type: Number, required: true },
      },
    ],
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
)

const ConversationModel = models.Conversation || mongoose.model<IConversation>("Conversation", conversationSchema)

export function sanitizeConversation(conversation: any): ConversationResponse {
  const conv = conversation.toObject ? conversation.toObject({ getters: true, virtuals: false }) : conversation
  return {
    _id: conv._id?.toString() || '',
    title: conv.title,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    isActive: conv.isActive,
    emotionTrends: conv.emotionTrends,
    messageCount: conv.messageCount,
    userId: conv.userId?.toString() || '',
  }
}

export { ConversationModel as Conversation }
