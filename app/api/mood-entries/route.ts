import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { extractToken, verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

// Helper to normalize a date to UTC midnight
function normalizeToUtcMidnight(dateInput: string | Date) {
  const d = new Date(dateInput)
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0))
  return utc
}

function sanitizeMoodEntry(doc: any) {
  if (!doc) return null
  return {
    _id: doc._id?.toString() || "",
    userId: doc.userId?.toString() || "",
    date: doc.date,
    mood: doc.mood,
    intensity: doc.intensity,
    triggers: Array.isArray(doc.triggers) ? doc.triggers : [],
    activities: Array.isArray(doc.activities) ? doc.activities : [],
    notes: doc.notes || "",
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth via JWT cookie
    const token = extractToken(req)
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    const decoded = await verifyToken(token)
    if (!decoded?.userId) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 })
    }

    const body = await req.json()
    const { date, mood, intensity, triggers, activities, notes } = body || {}

    if (!date || !mood || typeof intensity !== "number") {
      return NextResponse.json({ message: "Missing required fields: date, mood, intensity" }, { status: 400 })
    }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database connection error" }, { status: 500 })
    }

    const entryDate = normalizeToUtcMidnight(date)
    const userId = new ObjectId(decoded.userId)
    const collection = db.collection("moodEntries")

    // Upsert (create or update) the entry for this user & date
    const updateRes = await collection.updateOne(
      { userId, date: entryDate },
      {
        $set: {
          mood,
          intensity,
          triggers: Array.isArray(triggers) ? triggers : [],
          activities: Array.isArray(activities) ? activities : [],
          notes: typeof notes === "string" ? notes : "",
        },
      },
      { upsert: true },
    )

    const wasCreated = (updateRes.upsertedCount ?? 0) > 0

    const doc = await collection.findOne({ userId, date: entryDate })
    if (!doc) {
      return NextResponse.json({ message: "Failed to upsert mood entry" }, { status: 500 })
    }

    const moodEntry = sanitizeMoodEntry(doc)
    return NextResponse.json(
      {
        message: wasCreated ? "Mood entry created successfully" : "Mood entry updated successfully",
        moodEntry,
      },
      { status: wasCreated ? 201 : 200 },
    )
  } catch (error: any) {
    console.error("MoodEntry POST error:", error)
    return NextResponse.json(
      { message: "Error creating/updating mood entry", error: error?.message || "Unknown error" },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    // Auth via JWT cookie
    const token = extractToken(req)
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    const decoded = await verifyToken(token)
    if (!decoded?.userId) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 })
    }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database connection error" }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const year = searchParams.get("year")
    const month = searchParams.get("month")

    const query: any = { userId: new ObjectId(decoded.userId) }

    // Optional date filtering
    if (year && month) {
      const y = Number.parseInt(year, 10)
      const mRaw = Number.parseInt(month, 10)
      const m = isNaN(mRaw) ? 0 : mRaw
      // Support 0-11 or 1-12
      const monthIndex = m > 11 ? m - 1 : m

      const start = new Date(Date.UTC(y, monthIndex, 1, 0, 0, 0, 0))
      const end = new Date(Date.UTC(y, monthIndex + 1, 0, 23, 59, 59, 999))
      query.date = { $gte: start, $lte: end }
    } else if (year) {
      const y = Number.parseInt(year, 10)
      const start = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0))
      const end = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999))
      query.date = { $gte: start, $lte: end }
    }

    const collection = db.collection("moodEntries")
    const moodEntries = await collection.find(query).sort({ date: 1 }).toArray()
    return NextResponse.json({ moodEntries: moodEntries.map(sanitizeMoodEntry) }, { status: 200 })
  } catch (error: any) {
    console.error("MoodEntry GET error:", error)
    return NextResponse.json(
      { message: "Error fetching mood entries", error: error?.message || "Unknown error" },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Auth via JWT cookie
    const token = extractToken(req)
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    const decoded = await verifyToken(token)
    if (!decoded?.userId) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Missing or invalid mood entry ID" }, { status: 400 })
    }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ message: "Database connection error" }, { status: 500 })
    }

    const collection = db.collection("moodEntries")
    const delRes = await collection.deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(decoded.userId),
    })

    if (delRes.deletedCount === 0) {
      return NextResponse.json({ message: "Mood entry not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ message: "Mood entry deleted successfully" }, { status: 200 })
  } catch (error: any) {
    console.error("MoodEntry DELETE error:", error)
    return NextResponse.json(
      { message: "Error deleting mood entry", error: error?.message || "Unknown error" },
      { status: 500 },
    )
  }
}
