import mongoose, { Schema, models, type Document } from "mongoose"

export interface IUser extends Document {
  email: string
  password?: string
  username?: string
  createdAt: Date
  updatedAt: Date
  preferences?: {
    aiResponseStyle: string
    notifications: boolean
    privacyMode: boolean
  }
  profile?: {
    university: string
  }
  lastLogin?: Date
}

// Add User type for plain objects (without Mongoose Document properties)
export interface User {
  _id?: string
  email: string
  password?: string
  username?: string
  createdAt: Date
  updatedAt?: Date
  preferences?: {
    aiResponseStyle: string
    notifications: boolean
    privacyMode: boolean
  }
  profile?: {
    university: string
  }
  lastLogin?: Date
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false,
    },
    username: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    preferences: {
      aiResponseStyle: { type: String, default: "empathetic" },
      notifications: { type: Boolean, default: true },
      privacyMode: { type: Boolean, default: true },
    },
    profile: {
      university: { type: String, default: "" },
    },
    lastLogin: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true },
)

const UserModel = models.User || mongoose.model<IUser>("User", userSchema)

export function sanitizeUser(user: any) {
  const { password, ...sanitizedUser } = user
  return {
    ...sanitizedUser,
    _id: user._id?.toString() || user._id,
  }
}

export { UserModel }
