import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { extractToken, verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import {
  aiInsights,
  type MentalHealthInsight,
  type CopingStrategy,
  type CrisisAssessment,
  type ProgressMetric,
} from "@/lib/ai-insights"

export async function GET(request: NextRequest) {
  try {
    console.log("=== AI Insights Request ===")

    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ error: "No authentication token provided" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "30" // days

    console.log(`Generating insights for user ${decoded.userId} with ${timeframe} day timeframe`)

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    const messagesCollection = db.collection("messages")
    const usersCollection = db.collection("users")

    // Get user preferences
    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) })

    // Calculate date ranges
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(timeframe))

    const previousEndDate = new Date(startDate)
    const previousStartDate = new Date(previousEndDate)
    previousStartDate.setDate(previousStartDate.getDate() - Number.parseInt(timeframe))

    console.log(`Current period: ${startDate.toISOString()} to ${endDate.toISOString()}`)
    console.log(`Previous period: ${previousStartDate.toISOString()} to ${previousEndDate.toISOString()}`)

    // Fetch current period messages
    const currentMessages = await messagesCollection
      .find({
        userId: new ObjectId(decoded.userId),
        timestamp: { $gte: startDate, $lte: endDate },
        sender: "user",
      })
      .sort({ timestamp: -1 })
      .limit(200)
      .toArray()

    console.log(`Found ${currentMessages.length} current messages`)

    // Fetch previous period messages for comparison
    const previousMessages = await messagesCollection
      .find({
        userId: new ObjectId(decoded.userId),
        timestamp: { $gte: previousStartDate, $lt: startDate },
        sender: "user",
      })
      .sort({ timestamp: -1 })
      .limit(200)
      .toArray()

    console.log(`Found ${previousMessages.length} previous messages`)

    // Transform current data for analysis - handle messages without emotion data
    const currentEmotionData = currentMessages.map((msg) => {
      // If no emotion data exists, try to detect it from content
      let emotion = msg.emotion?.detected || "neutral"
      let confidence = msg.emotion?.confidence || 70

      // Basic emotion detection if not present
      if (!msg.emotion?.detected && msg.content) {
        const content = msg.content.toLowerCase()
        if (content.includes("happy") || content.includes("good") || content.includes("great")) {
          emotion = "happy"
          confidence = 75
        } else if (content.includes("sad") || content.includes("down") || content.includes("depressed")) {
          emotion = "sad"
          confidence = 75
        } else if (content.includes("anxious") || content.includes("worried") || content.includes("stress")) {
          emotion = "anxious"
          confidence = 75
        } else if (content.includes("angry") || content.includes("mad") || content.includes("frustrated")) {
          emotion = "angry"
          confidence = 75
        }
      }

      return {
        date: msg.timestamp.toISOString().split("T")[0],
        emotion: emotion,
        confidence: confidence,
        content: msg.content,
      }
    })

    // Transform previous data for comparison - handle messages without emotion data
    const previousEmotionData = previousMessages.map((msg) => {
      let emotion = msg.emotion?.detected || "neutral"
      let confidence = msg.emotion?.confidence || 70

      // Basic emotion detection if not present
      if (!msg.emotion?.detected && msg.content) {
        const content = msg.content.toLowerCase()
        if (content.includes("happy") || content.includes("good") || content.includes("great")) {
          emotion = "happy"
          confidence = 75
        } else if (content.includes("sad") || content.includes("down") || content.includes("depressed")) {
          emotion = "sad"
          confidence = 75
        } else if (content.includes("anxious") || content.includes("worried") || content.includes("stress")) {
          emotion = "anxious"
          confidence = 75
        } else if (content.includes("angry") || content.includes("mad") || content.includes("frustrated")) {
          emotion = "angry"
          confidence = 75
        }
      }

      return {
        date: msg.timestamp.toISOString().split("T")[0],
        emotion: emotion,
        confidence: confidence,
        content: msg.content,
      }
    })

    console.log(`Processing ${currentEmotionData.length} current emotion data points`)
    console.log(`Processing ${previousEmotionData.length} previous emotion data points`)

    // Debug: Log sample emotion data
    if (currentEmotionData.length > 0) {
      console.log("Sample current emotion data:", currentEmotionData.slice(0, 3))
    } else {
      console.log("No current emotion data found - checking message structure...")
      if (currentMessages.length > 0) {
        console.log("Sample message structure:", {
          hasEmotion: !!currentMessages[0].emotion,
          emotionStructure: currentMessages[0].emotion,
          content: currentMessages[0].content?.substring(0, 50),
        })
      }
    }

    // Generate AI insights with error handling
    let insights: MentalHealthInsight[] = []
    let copingStrategies: CopingStrategy[] = []
    let crisisAssessment: CrisisAssessment | null = null
    let progressMetrics: ProgressMetric[] = []

    try {
      console.log("Generating emotional pattern insights...")
      insights = await aiInsights.analyzeEmotionalPatterns(currentEmotionData)
      console.log(`Generated ${insights.length} insights`)
    } catch (error) {
      console.error("Error generating insights:", error)
      insights = [
        {
          type: "neutral" as const,
          title: "Analysis in Progress",
          description: "We're still learning about your patterns. Keep chatting to get personalized insights!",
          recommendation: "Continue sharing your thoughts and feelings with MediChat-AI.",
          confidence: 80,
        },
      ]
    }

    try {
      console.log("Generating coping strategies...")
      copingStrategies = await aiInsights.generatePersonalizedCopingStrategies(
        currentEmotionData,
        user?.preferences || {},
      )
      console.log(`Generated ${copingStrategies.length} coping strategies`)
    } catch (error) {
      console.error("Error generating coping strategies:", error)
      copingStrategies = [] as CopingStrategy[]
    }

    try {
      console.log("Assessing crisis risk...")
      crisisAssessment = await aiInsights.assessCrisisRisk(currentMessages.slice(0, 20))
      console.log(`Crisis assessment: ${crisisAssessment.riskLevel} (score: ${crisisAssessment.score})`)
    } catch (error) {
      console.error("Error assessing crisis risk:", error)
      crisisAssessment = {
        riskLevel: "low" as const,
        factors: [],
        recommendations: ["Continue regular mental health check-ins"],
        urgency: false,
        score: 0,
      }
    }

    try {
      console.log("Generating progress metrics...")
      progressMetrics = await aiInsights.generateProgressMetrics(currentEmotionData, previousEmotionData)
      console.log(`Generated ${progressMetrics.length} progress metrics`)
    } catch (error) {
      console.error("Error generating progress metrics:", error)
      progressMetrics = [] as ProgressMetric[]
    }

    // Calculate comprehensive statistics
    const emotionCounts = currentEmotionData.reduce(
      (acc, item) => {
        acc[item.emotion] = (acc[item.emotion] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const averageConfidence =
      currentEmotionData.length > 0
        ? currentEmotionData.reduce((sum, item) => sum + item.confidence, 0) / currentEmotionData.length
        : 0

    // Prepare chart data (last 30 data points for visualization)
    const chartData = currentEmotionData.slice(-30).map((item, index) => ({
      date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      confidence: item.confidence,
      emotion: item.emotion,
      index: index,
    }))

    const responseData = {
      insights,
      copingStrategies,
      crisisAssessment,
      progressMetrics,
      statistics: {
        totalMessages: currentEmotionData.length,
        emotionDistribution: emotionCounts,
        averageConfidence: Math.round(averageConfidence),
        timeframe: Number.parseInt(timeframe),
        hasData: currentEmotionData.length > 0,
        previousPeriodMessages: previousEmotionData.length,
      },
      emotionData: chartData,
      rawEmotionData: currentEmotionData.slice(-50), // For detailed analysis
    }

    console.log("Insights generation completed successfully")
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error generating insights:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
