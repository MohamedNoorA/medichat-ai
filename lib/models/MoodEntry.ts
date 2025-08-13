import mongoose, { Schema, models, type Document } from "mongoose"
import type { ObjectId } from "mongodb"

export interface IMoodEntry extends Document {
  userId: ObjectId
  date: Date
  mood: string
  intensity: number
  triggers: string[]
  activities: string[]
  notes: string
}

const moodEntrySchema = new Schema<IMoodEntry>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  date: {
    type: Date,
    required: true,
  },
  mood: {
    type: String,
    required: true,
  },
  intensity: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  triggers: {
    type: [String],
    default: [],
  },
  activities: {
    type: [String],
    default: [],
  },
  notes: {
    type: String,
    default: "",
  },
})

const MoodEntryModel = models.MoodEntry || mongoose.model<IMoodEntry>("MoodEntry", moodEntrySchema)

export { MoodEntryModel as MoodEntry }
