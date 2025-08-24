import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"
import { extractToken, verifyToken } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Mental health focused system prompt
const SYSTEM_PROMPT = `You are Medichat-AI, a compassionate and professional AI mental health companion created by Mohamed Noor Adan. Your role is to provide empathetic, supportive, and helpful responses to users seeking mental health support.

Guidelines for your responses:
- Always be empathetic, understanding, and non-judgmental
- Provide practical coping strategies and emotional support
- Keep responses conversational but professional
- If someone mentions crisis situations (suicide, self-harm), immediately provide crisis resources
- Encourage professional help when appropriate
- Remember you're an AI companion, not a replacement for professional therapy
- Keep responses between 50-200 words for better engagement
- Use a warm, caring tone that makes users feel heard and supported

Crisis Resources to provide when needed:
- National Suicide Prevention Lifeline: 988 (US)
- Crisis Text Line: Text HOME to 741741
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

Always prioritize user safety and well-being in your responses.`

// Enhanced emotion detection keywords with more nuanced patterns
const EMOTION_KEYWORDS = {
  happy: [
    "happy",
    "joy",
    "excited",
    "great",
    "wonderful",
    "amazing",
    "fantastic",
    "good",
    "cheerful",
    "delighted",
    "thrilled",
    "content",
    "pleased",
    "elated",
  ],
  sad: [
    "sad",
    "depressed",
    "down",
    "low",
    "unhappy",
    "miserable",
    "heartbroken",
    "devastated",
    "grief",
    "mourning",
    "melancholy",
    "blue",
    "dejected",
  ],
  anxious: [
    "anxious",
    "worried",
    "nervous",
    "panic",
    "stress",
    "overwhelmed",
    "scared",
    "fearful",
    "tense",
    "restless",
    "uneasy",
    "apprehensive",
    "frantic",
  ],
  angry: [
    "angry",
    "mad",
    "furious",
    "frustrated",
    "irritated",
    "annoyed",
    "rage",
    "livid",
    "outraged",
    "resentful",
    "bitter",
    "hostile",
  ],
  lonely: [
    "lonely",
    "alone",
    "isolated",
    "disconnected",
    "abandoned",
    "empty",
    "solitary",
    "withdrawn",
    "excluded",
    "rejected",
  ],
  confused: [
    "confused",
    "lost",
    "uncertain",
    "unclear",
    "mixed up",
    "bewildered",
    "puzzled",
    "disoriented",
    "perplexed",
  ],
  hopeful: [
    "hopeful",
    "optimistic",
    "positive",
    "confident",
    "motivated",
    "encouraged",
    "inspired",
    "uplifted",
    "determined",
  ],
  tired: ["tired", "exhausted", "drained", "weary", "burnt out", "fatigued", "worn out", "depleted", "spent"],
  excited: ["excited", "enthusiastic", "energetic", "pumped", "thrilled", "eager", "animated", "vibrant"],
  neutral: ["okay", "fine", "alright", "normal", "average", "so-so", "meh"],
}

// Function to detect emotion from text with improved accuracy
function detectEmotion(text: string): { emotion: string; confidence: number } {
  const lowerText = text.toLowerCase()
  const emotionScores: Record<string, number> = {}

  // Calculate weighted scores for each emotion
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    let score = 0
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi")
      const matches = lowerText.match(regex)
      if (matches) {
        // Weight longer keywords higher and account for frequency
        score += matches.length * (keyword.length > 4 ? 2 : 1)
      }
    }
    if (score > 0) {
      emotionScores[emotion] = score
    }
  }

  // Find the emotion with the highest score
  const sortedEmotions = Object.entries(emotionScores).sort(([, a], [, b]) => b - a)

  if (sortedEmotions.length === 0) {
    return { emotion: "neutral", confidence: 70 }
  }

  const [topEmotion, topScore] = sortedEmotions[0]
  const totalScore = Object.values(emotionScores).reduce((sum, score) => sum + score, 0)

  // Calculate confidence based on dominance of top emotion
  const confidence = Math.min(95, Math.max(75, Math.round((topScore / totalScore) * 100)))

  return { emotion: topEmotion, confidence }
}

// Enhanced crisis detection with more comprehensive patterns
function detectCrisis(text: string): boolean {
  const crisisKeywords = [
    "suicide",
    "kill myself",
    "end my life",
    "want to die",
    "self harm",
    "hurt myself",
    "no point living",
    "better off dead",
    "end it all",
    "take my own life",
    "can't go on",
    "want to disappear",
    "wish I was dead",
    "planning to die",
    "cutting myself",
    "overdose",
    "jump off",
    "hang myself",
  ]

  const lowerText = text.toLowerCase()
  return crisisKeywords.some((keyword) => lowerText.includes(keyword))
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== POST /api/chat ===")

    // Add authentication check
    const token = extractToken(request)
    if (!token) {
      console.log("No token provided in chat API")
      return NextResponse.json({ error: "No authentication token provided" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      console.log("Invalid token in chat API")
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    console.log("Chat request authenticated for user:", decoded.userId)

    // Parse request body
    const { message, conversationId } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required and must be a string" }, { status: 400 })
    }

    if (!conversationId || !ObjectId.isValid(conversationId)) {
      return NextResponse.json({ error: "Valid conversation ID is required" }, { status: 400 })
    }

    console.log("Processing chat message for conversation:", conversationId)

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error("Gemini API key not configured")
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    // Get database connection
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

    // Enhanced emotion and crisis detection
    const emotionAnalysis = detectEmotion(message)
    const isCrisis = detectCrisis(message)

    console.log("Enhanced emotion analysis:", emotionAnalysis)
    console.log("Crisis detected:", isCrisis)

    // Save user message to database with enhanced emotion data
    const userMessage = {
      conversationId: new ObjectId(conversationId),
      userId: new ObjectId(decoded.userId),
      content: message.trim(),
      sender: "user",
      timestamp: new Date(),
      emotion: {
        detected: emotionAnalysis.emotion,
        confidence: emotionAnalysis.confidence,
      },
    }

    console.log("Saving user message with emotion:", userMessage.emotion)
    await messagesCollection.insertOne(userMessage)

    // Get recent conversation history for better context
    const recentMessages = await messagesCollection
      .find({
        conversationId: new ObjectId(conversationId),
        userId: new ObjectId(decoded.userId),
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray()

    // Reverse to get chronological order
    const conversationHistory = recentMessages.reverse()

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Build enhanced conversation context
    let conversationContext = SYSTEM_PROMPT + "\n\n"

    // Add recent conversation history with emotion context
    if (conversationHistory.length > 1) {
      conversationContext += "Recent conversation context:\n"
      conversationHistory.slice(0, -1).forEach((msg: any) => {
        const emotionInfo = msg.emotion?.detected ? ` [Emotion: ${msg.emotion.detected}]` : ""
        conversationContext += `${msg.sender === "user" ? "User" : "AI"}: ${msg.content}${emotionInfo}\n`
      })
      conversationContext += "\n"
    }

    // Add enhanced emotion context
    if (emotionAnalysis.emotion !== "neutral") {
      conversationContext += `The user is currently feeling ${emotionAnalysis.emotion} with ${emotionAnalysis.confidence}% confidence. Please respond with appropriate empathy and support for this emotional state.\n\n`
    }

    // Add crisis context if detected
    if (isCrisis) {
      conversationContext += `CRITICAL: The user may be in crisis or expressing suicidal thoughts. Please provide immediate support, crisis resources, and encourage professional help. This is a priority response.\n\n`
    }

    // Add current user message with emotion context
    conversationContext += `Current user message [Emotion: ${emotionAnalysis.emotion}, Confidence: ${emotionAnalysis.confidence}%]: ${message}\n\nPlease respond as Medichat-AI with empathy and appropriate support:`

    console.log("Sending enhanced request to Gemini AI...")

    // Generate AI response
    const result = await model.generateContent(conversationContext)
    const response = await result.response
    const aiResponse = response.text()

    console.log("Received AI response:", aiResponse.substring(0, 100) + "...")

    // Save AI response to database with enhanced metadata
    const aiMessage = {
      conversationId: new ObjectId(conversationId),
      userId: new ObjectId(decoded.userId),
      content: aiResponse,
      sender: "ai",
      timestamp: new Date(),
      emotion: {
        detected: emotionAnalysis.emotion,
        confidence: emotionAnalysis.confidence,
      },
      aiResponse: {
        model: "gemini-1.5-flash",
        processingTime: Date.now(),
        isCrisis: isCrisis,
        userEmotionDetected: emotionAnalysis.emotion,
      },
    }

    await messagesCollection.insertOne(aiMessage)

    // Update conversation's updatedAt and messageCount
    await conversationsCollection.updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $set: { updatedAt: new Date() },
        $inc: { messageCount: 2 }, // Increment by 2 (user + AI message)
      },
    )

    // Update conversation title if it's still "New Chat" and message is suitable
    if (conversation.title === "New Chat" && message.length <= 50 && message.length > 5) {
      const title = message.length > 47 ? message.substring(0, 44) + "..." : message
      await conversationsCollection.updateOne({ _id: new ObjectId(conversationId) }, { $set: { title: title } })
    }

    // Return enhanced response with metadata
    return NextResponse.json({
      response: aiResponse,
      emotion: emotionAnalysis.emotion,
      confidence: emotionAnalysis.confidence,
      isCrisis: isCrisis,
      timestamp: new Date().toISOString(),
      aiMetadata: {
        model: "gemini-1.5-flash",
        emotionDetected: emotionAnalysis.emotion,
        confidenceLevel: emotionAnalysis.confidence,
        crisisDetected: isCrisis,
      },
    })
  } catch (error) {
    console.error("Gemini API Error:", error)

    // Return a fallback response with crisis resources if needed
    return NextResponse.json(
      {
        response:
          "I'm here to support you, but I'm having some technical difficulties right now. Please know that your feelings are valid and important. If you're in crisis, please reach out to a crisis helpline: call 988 for immediate support.",
        emotion: "neutral",
        confidence: 70,
        isCrisis: false,
        error: "AI service temporarily unavailable",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    )
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    {
      message: "Medichat-AI Chat API - Use POST to send messages",
      status: "operational",
      version: "2.0.0",
    },
    { status: 200 },
  )
}
