import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { extractToken, verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { GoogleGenerativeAI } from "@google/generative-ai"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  PageBreak,
  convertInchesToTwip,
  Header,
  Footer,
  PageNumber,
} from "docx"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface ExportOptions {
  includeAnalysis: boolean
  includeRecommendations: boolean
  includeEmotionalTrends: boolean
  includeCharts: boolean
  includeWordCloud: boolean
  includeCopingStrategies: boolean
}

interface EmotionalData {
  date: string
  emotion: string
  confidence: number
  content: string
  triggers?: string[]
}

interface MoodAnalysis {
  sadnessScore: number
  wellbeingIndex: number
  urgencyLevel: "stable" | "monitor" | "urgent"
  positivePercentage: number
  neutralPercentage: number
  negativePercentage: number
  trendDirection: "improving" | "stable" | "declining"
}

interface TriggerAnalysis {
  positiveKeywords: string[]
  negativeKeywords: string[]
  topPositiveTriggers: string[]
  topNegativeTriggers: string[]
  wordFrequency: Record<string, number>
}

interface CopingStrategies {
  healthy: Array<{ strategy: string; frequency: number; effectiveness: string }>
  unhealthy: Array<{ pattern: string; suggestion: string }>
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== Enhanced Mental Health Report Generation ===")

    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ error: "No authentication token provided" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const options: ExportOptions = await request.json()
    console.log("Export options:", options)

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    // Fetch user data
    const usersCollection = db.collection("users")
    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch conversations and messages (last 3 months)
    const conversationsCollection = db.collection("conversations")
    const messagesCollection = db.collection("messages")

    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const conversations = await conversationsCollection
      .find({
        userId: new ObjectId(decoded.userId),
        createdAt: { $gte: threeMonthsAgo },
      })
      .sort({ createdAt: -1 })
      .toArray()

    // Fetch all messages for analysis
    const allMessages = await messagesCollection
      .find({
        userId: new ObjectId(decoded.userId),
        timestamp: { $gte: threeMonthsAgo },
        sender: "user",
      })
      .sort({ timestamp: 1 })
      .toArray()

    console.log(`Processing ${allMessages.length} messages for comprehensive analysis`)

    // Transform messages to emotional data
    const emotionalData: EmotionalData[] = allMessages.map((msg) => ({
      date: msg.timestamp.toISOString().split("T")[0],
      emotion: msg.emotion?.detected || detectBasicEmotion(msg.content),
      confidence: msg.emotion?.confidence || 70,
      content: msg.content,
      triggers: extractTriggers(msg.content),
    }))

    // Generate comprehensive AI analysis
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // 1. Personal Summary Analysis
    let personalSummary = ""
    try {
      const summaryPrompt = `
        Analyze this user's communication patterns and create a supportive personal summary:
        
        Total messages: ${emotionalData.length}
        Sample conversations: ${emotionalData
          .slice(0, 10)
          .map((d) => d.content.substring(0, 100))
          .join("\n")}
        
        Write 1-2 paragraphs describing:
        - Their communication style and personality traits
        - Overall emotional patterns and resilience
        - Positive qualities and strengths observed
        
        Keep tone empathetic, supportive, and encouraging. Focus on strengths while acknowledging challenges.
      `

      const summaryResult = await model.generateContent(summaryPrompt)
      personalSummary = summaryResult.response.text()
    } catch (error) {
      console.error("Error generating personal summary:", error)
      personalSummary =
        "You demonstrate thoughtful self-reflection and a commitment to your mental health journey through regular engagement with supportive resources."
    }

    // 2. Mood Analysis
    const moodAnalysis = analyzeMoodPatterns(emotionalData)

    // 3. Trigger Analysis
    const triggerAnalysis = analyzeTriggers(emotionalData)

    // 4. Coping Strategies Analysis
    let copingStrategies: CopingStrategies = { healthy: [], unhealthy: [] }
    try {
      const copingPrompt = `
        Analyze these user messages for coping strategies:
        
        ${emotionalData
          .slice(-20)
          .map((d) => d.content)
          .join("\n")}
        
        Identify:
        1. Healthy coping strategies they use (exercise, meditation, talking to friends, etc.)
        2. Unhealthy patterns (isolation, negative self-talk, avoidance, etc.)
        
        Return as JSON:
        {
          "healthy": [{"strategy": "name", "frequency": "often/sometimes/rarely", "effectiveness": "description"}],
          "unhealthy": [{"pattern": "description", "suggestion": "gentle advice"}]
        }
      `

      const copingResult = await model.generateContent(copingPrompt)
      const copingText = copingResult.response
        .text()
        .replace(/```json\n?|\n?```/g, "")
        .trim()
      copingStrategies = JSON.parse(copingText)
    } catch (error) {
      console.error("Error analyzing coping strategies:", error)
    }

    // 5. Wellness Recommendations
    let wellnessRecommendations = ""
    try {
      const recommendationsPrompt = `
        Based on this user's emotional patterns and current well-being score of ${moodAnalysis.wellbeingIndex}%, 
        provide 5-7 personalized wellness recommendations:
        
        Emotional data: ${JSON.stringify(moodAnalysis)}
        Recent patterns: ${emotionalData
          .slice(-10)
          .map((d) => `${d.emotion}: ${d.content.substring(0, 50)}`)
          .join("\n")}
        
        Include specific, actionable suggestions for:
        - Sleep improvement
        - Mindfulness practices  
        - Physical activity
        - Social connection
        - Stress management
        - Professional support if needed
        
        Keep recommendations practical and encouraging.
      `

      const recommendationsResult = await model.generateContent(recommendationsPrompt)
      wellnessRecommendations = recommendationsResult.response.text()
    } catch (error) {
      console.error("Error generating recommendations:", error)
      wellnessRecommendations =
        "Continue your self-care practices and consider speaking with a mental health professional for personalized guidance."
    }

    // Create enhanced Word document
    const doc = new Document({
      creator: "MediChat-AI Mental Health Platform",
      title: "Mental Health & Emotional Insights Report",
      description: `Comprehensive mental health analysis for ${user.username || user.email}`,

      styles: {
        paragraphStyles: [
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              size: 32,
              bold: true,
              color: "2563EB",
              font: "Calibri",
            },
            paragraph: {
              spacing: { after: 300, before: 200 },
            },
          },
          {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              size: 24,
              bold: true,
              color: "7C3AED",
              font: "Calibri",
            },
            paragraph: {
              spacing: { after: 200, before: 150 },
            },
          },
        ],
      },

      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                right: convertInchesToTwip(1),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1),
              },
            },
          },

          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Mental Health & Emotional Insights Report",
                      size: 20,
                      color: "6B7280",
                      font: "Calibri",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          },

          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Generated by MediChat-AI • Page ",
                      size: 18,
                      color: "9CA3AF",
                      font: "Calibri",
                    }),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      size: 18,
                      color: "9CA3AF",
                      font: "Calibri",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          },

          children: [
            // Title Page
            new Paragraph({
              children: [
                new TextRun({
                  text: "Mental Health & Emotional Insights",
                  bold: true,
                  size: 48,
                  color: "1E40AF",
                  font: "Calibri",
                }),
              ],
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 600, before: 400 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Comprehensive Analysis Report",
                  size: 28,
                  color: "7C3AED",
                  font: "Calibri",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 800 },
            }),

            // User Info Box
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Name: ", bold: true, font: "Calibri" }),
                            new TextRun({ text: user.username || "Not provided", font: "Calibri" }),
                          ],
                        }),
                      ],
                      shading: { fill: "F8FAFC", type: ShadingType.SOLID },
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Email: ", bold: true, font: "Calibri" }),
                            new TextRun({ text: user.email, font: "Calibri" }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Report Generated: ", bold: true, font: "Calibri" }),
                            new TextRun({ text: new Date().toLocaleDateString(), font: "Calibri" }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Analysis Period: ", bold: true, font: "Calibri" }),
                            new TextRun({ text: "Last 3 months", font: "Calibri" }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ children: [new PageBreak()] }),

            // Table of Contents
            new Paragraph({
              children: [
                new TextRun({
                  text: "Table of Contents",
                  bold: true,
                  size: 32,
                  color: "2563EB",
                  font: "Calibri",
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 400 },
            }),

            new Paragraph({
              children: [new TextRun({ text: "1. Personal Summary", size: 22, font: "Calibri" })],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "2. Emotional Trends Analysis", size: 22, font: "Calibri" })],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "3. Sadness & Well-being Index", size: 22, font: "Calibri" })],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "4. Urgency Indicator", size: 22, font: "Calibri" })],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "5. Emotional Triggers Analysis", size: 22, font: "Calibri" })],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "6. Coping Strategies Assessment", size: 22, font: "Calibri" })],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "7. Progress Tracking", size: 22, font: "Calibri" })],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "8. Wellness Recommendations", size: 22, font: "Calibri" })],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "9. Encouragement & Next Steps", size: 22, font: "Calibri" })],
              spacing: { after: 400 },
            }),

            new Paragraph({ children: [new PageBreak()] }),

            // 1. Personal Summary
            new Paragraph({
              children: [
                new TextRun({
                  text: "1. Personal Summary",
                  bold: true,
                  size: 32,
                  color: "2563EB",
                  font: "Calibri",
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: personalSummary,
                  size: 22,
                  font: "Calibri",
                  color: "374151",
                }),
              ],
              spacing: { after: 400, line: 360 },
            }),

            // 2. Emotional Trends Analysis
            new Paragraph({
              children: [
                new TextRun({
                  text: "2. Emotional Trends Analysis",
                  bold: true,
                  size: 32,
                  color: "2563EB",
                  font: "Calibri",
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300 },
            }),

            // Mood Distribution Table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: "Mood Category", bold: true, font: "Calibri" })],
                        }),
                      ],
                      shading: { fill: "3B82F6", type: ShadingType.SOLID },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: "Percentage", bold: true, font: "Calibri", color: "FFFFFF" })],
                        }),
                      ],
                      shading: { fill: "3B82F6", type: ShadingType.SOLID },
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "Positive Emotions", font: "Calibri" })] }),
                      ],
                      shading: { fill: "ECFDF5", type: ShadingType.SOLID },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `${moodAnalysis.positivePercentage}%`,
                              font: "Calibri",
                              bold: true,
                              color: "059669",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "Neutral Emotions", font: "Calibri" })] }),
                      ],
                      shading: { fill: "F9FAFB", type: ShadingType.SOLID },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `${moodAnalysis.neutralPercentage}%`,
                              font: "Calibri",
                              bold: true,
                              color: "6B7280",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "Challenging Emotions", font: "Calibri" })] }),
                      ],
                      shading: { fill: "FEF2F2", type: ShadingType.SOLID },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `${moodAnalysis.negativePercentage}%`,
                              font: "Calibri",
                              bold: true,
                              color: "DC2626",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ children: [new TextRun({ text: "", size: 22 })], spacing: { after: 300 } }),

            // 3. Sadness & Well-being Index
            new Paragraph({
              children: [
                new TextRun({
                  text: "3. Sadness & Well-being Index",
                  bold: true,
                  size: 32,
                  color: "2563EB",
                  font: "Calibri",
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Well-being Score: ${moodAnalysis.wellbeingIndex}%`,
                  bold: true,
                  size: 28,
                  color:
                    moodAnalysis.wellbeingIndex >= 70
                      ? "059669"
                      : moodAnalysis.wellbeingIndex >= 50
                        ? "D97706"
                        : "DC2626",
                  font: "Calibri",
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Sadness Index: ${moodAnalysis.sadnessScore}%`,
                  bold: true,
                  size: 24,
                  color:
                    moodAnalysis.sadnessScore <= 30 ? "059669" : moodAnalysis.sadnessScore <= 60 ? "D97706" : "DC2626",
                  font: "Calibri",
                }),
              ],
              spacing: { after: 300 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: interpretWellbeingScore(moodAnalysis.wellbeingIndex, moodAnalysis.sadnessScore),
                  size: 22,
                  font: "Calibri",
                  color: "374151",
                }),
              ],
              spacing: { after: 400, line: 360 },
            }),

            // 4. Urgency Indicator
            new Paragraph({
              children: [
                new TextRun({
                  text: "4. Urgency Indicator",
                  bold: true,
                  size: 32,
                  color: "2563EB",
                  font: "Calibri",
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Status: ${moodAnalysis.urgencyLevel.toUpperCase()}`,
                  bold: true,
                  size: 28,
                  color:
                    moodAnalysis.urgencyLevel === "stable"
                      ? "059669"
                      : moodAnalysis.urgencyLevel === "monitor"
                        ? "D97706"
                        : "DC2626",
                  font: "Calibri",
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: getUrgencyExplanation(moodAnalysis.urgencyLevel),
                  size: 22,
                  font: "Calibri",
                  color: "374151",
                }),
              ],
              spacing: { after: 400, line: 360 },
            }),

            // 5. Emotional Triggers Analysis
            new Paragraph({
              children: [
                new TextRun({
                  text: "5. Emotional Triggers Analysis",
                  bold: true,
                  size: 32,
                  color: "2563EB",
                  font: "Calibri",
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Positive Triggers",
                  bold: true,
                  size: 24,
                  color: "059669",
                  font: "Calibri",
                }),
              ],
              spacing: { after: 200 },
            }),

            ...triggerAnalysis.topPositiveTriggers.map(
              (trigger) =>
                new Paragraph({
                  children: [
                    new TextRun({ text: "• ", size: 22, color: "059669", font: "Calibri" }),
                    new TextRun({ text: trigger, size: 22, font: "Calibri", color: "374151" }),
                  ],
                  spacing: { after: 100 },
                }),
            ),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Areas for Attention",
                  bold: true,
                  size: 24,
                  color: "DC2626",
                  font: "Calibri",
                }),
              ],
              spacing: { after: 200, before: 300 },
            }),

            ...triggerAnalysis.topNegativeTriggers.map(
              (trigger) =>
                new Paragraph({
                  children: [
                    new TextRun({ text: "• ", size: 22, color: "DC2626", font: "Calibri" }),
                    new TextRun({ text: trigger, size: 22, font: "Calibri", color: "374151" }),
                  ],
                  spacing: { after: 100 },
                }),
            ),

            new Paragraph({ children: [new PageBreak()] }),

            // 6. Coping Strategies Assessment
            new Paragraph({
              children: [
                new TextRun({
                  text: "6. Coping Strategies Assessment",
                  bold: true,
                  size: 32,
                  color: "2563EB",
                  font: "Calibri",
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Healthy Strategies (Keep These Up!)",
                  bold: true,
                  size: 24,
                  color: "059669",
                  font: "Calibri",
                }),
              ],
              spacing: { after: 200 },
            }),

            ...copingStrategies.healthy.map(
              (strategy) =>
                new Paragraph({
                  children: [
                    new TextRun({ text: "✓ ", size: 22, color: "059669", font: "Calibri", bold: true }),
                    new TextRun({
                      text: `${strategy.strategy} `,
                      size: 22,
                      font: "Calibri",
                      bold: true,
                      color: "374151",
                    }),
                    new TextRun({
                      text: `(${strategy.frequency}) - ${strategy.effectiveness}`,
                      size: 20,
                      font: "Calibri",
                      color: "6B7280",
                    }),
                  ],
                  spacing: { after: 150 },
                }),
            ),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Areas for Growth",
                  bold: true,
                  size: 24,
                  color: "D97706",
                  font: "Calibri",
                }),
              ],
              spacing: { after: 200, before: 300 },
            }),

            ...copingStrategies.unhealthy.map(
              (pattern) =>
                new Paragraph({
                  children: [
                    new TextRun({ text: "→ ", size: 22, color: "D97706", font: "Calibri", bold: true }),
                    new TextRun({
                      text: `${pattern.pattern}: `,
                      size: 22,
                      font: "Calibri",
                      bold: true,
                      color: "374151",
                    }),
                    new TextRun({ text: pattern.suggestion, size: 20, font: "Calibri", color: "6B7280" }),
                  ],
                  spacing: { after: 150, line: 300 },
                }),
            ),

            // 7. Progress Tracking
            new Paragraph({
              children: [
                new TextRun({
                  text: "7. Progress Tracking",
                  bold: true,
                  size: 32,
                  color: "2563EB",
                  font: "Calibri",
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300, before: 400 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Overall Trend: ${moodAnalysis.trendDirection.toUpperCase()}`,
                  bold: true,
                  size: 26,
                  color:
                    moodAnalysis.trendDirection === "improving"
                      ? "059669"
                      : moodAnalysis.trendDirection === "declining"
                        ? "DC2626"
                        : "6B7280",
                  font: "Calibri",
                }),
              ],
              spacing: { after: 300 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: getProgressSummary(moodAnalysis.trendDirection, emotionalData.length),
                  size: 22,
                  font: "Calibri",
                  color: "374151",
                }),
              ],
              spacing: { after: 400, line: 360 },
            }),

            // 8. Wellness Recommendations
            new Paragraph({
              children: [
                new TextRun({
                  text: "8. Personalized Wellness Recommendations",
                  bold: true,
                  size: 32,
                  color: "2563EB",
                  font: "Calibri",
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: wellnessRecommendations,
                  size: 22,
                  font: "Calibri",
                  color: "374151",
                }),
              ],
              spacing: { after: 400, line: 360 },
            }),

            new Paragraph({ children: [new PageBreak()] }),

            // 9. Encouragement & Next Steps
            new Paragraph({
              children: [
                new TextRun({
                  text: "9. Encouragement & Next Steps",
                  bold: true,
                  size: 32,
                  color: "2563EB",
                  font: "Calibri",
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: generateEncouragementMessage(moodAnalysis, emotionalData.length),
                  size: 22,
                  font: "Calibri",
                  color: "374151",
                }),
              ],
              spacing: { after: 400, line: 360 },
            }),

            // Crisis Resources
            new Paragraph({
              children: [
                new TextRun({
                  text: "Crisis Resources & Support",
                  bold: true,
                  size: 24,
                  color: "DC2626",
                  font: "Calibri",
                }),
              ],
              spacing: { after: 200, before: 400 },
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 2, color: "DC2626" },
                bottom: { style: BorderStyle.SINGLE, size: 2, color: "DC2626" },
                left: { style: BorderStyle.SINGLE, size: 2, color: "DC2626" },
                right: { style: BorderStyle.SINGLE, size: 2, color: "DC2626" },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "🚨 Emergency: ", bold: true, size: 20, font: "Calibri" }),
                            new TextRun({ text: "Call 911", size: 20, font: "Calibri" }),
                          ],
                        }),
                      ],
                      shading: { fill: "FEF2F2", type: ShadingType.SOLID },
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "📞 Crisis Line: ", bold: true, size: 20, font: "Calibri" }),
                            new TextRun({ text: "Call 988 (Suicide & Crisis Lifeline)", size: 20, font: "Calibri" }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "💬 Text Support: ", bold: true, size: 20, font: "Calibri" }),
                            new TextRun({ text: "Text HOME to 741741", size: 20, font: "Calibri" }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            // Footer
            new Paragraph({
              children: [
                new TextRun({
                  text: "This report was generated by MediChat-AI to support your mental health journey. Continue using our platform for ongoing support and insights.",
                  size: 18,
                  color: "6B7280",
                  font: "Calibri",
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 600, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Developed by Mohamed Noor Adan • Mount Kenya University",
                  size: 16,
                  color: "9CA3AF",
                  font: "Calibri",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
          ],
        },
      ],
    })

    // Generate the Word document buffer
    const buffer = await Packer.toBuffer(doc)
    console.log("Enhanced mental health report generated successfully")

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(buffer)

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="mental-health-insights-report-${new Date().toISOString().split("T")[0]}.docx"`,
        "Content-Length": buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Error generating enhanced mental health report:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Helper functions
function detectBasicEmotion(content: string): string {
  const text = content.toLowerCase()
  if (text.includes("happy") || text.includes("good") || text.includes("great")) return "happy"
  if (text.includes("sad") || text.includes("down") || text.includes("depressed")) return "sad"
  if (text.includes("anxious") || text.includes("worried") || text.includes("stress")) return "anxious"
  if (text.includes("angry") || text.includes("mad") || text.includes("frustrated")) return "angry"
  return "neutral"
}

function extractTriggers(content: string): string[] {
  const triggers = []
  const text = content.toLowerCase()

  // Common positive triggers
  if (text.includes("exercise") || text.includes("workout")) triggers.push("Physical activity")
  if (text.includes("friend") || text.includes("family")) triggers.push("Social connection")
  if (text.includes("sleep") || text.includes("rest")) triggers.push("Rest and recovery")

  // Common negative triggers
  if (text.includes("work") || text.includes("job")) triggers.push("Work stress")
  if (text.includes("money") || text.includes("financial")) triggers.push("Financial concerns")
  if (text.includes("relationship") || text.includes("partner")) triggers.push("Relationship issues")

  return triggers
}

function analyzeMoodPatterns(emotionalData: EmotionalData[]): MoodAnalysis {
  if (emotionalData.length === 0) {
    return {
      sadnessScore: 50,
      wellbeingIndex: 50,
      urgencyLevel: "stable",
      positivePercentage: 33,
      neutralPercentage: 34,
      negativePercentage: 33,
      trendDirection: "stable",
    }
  }

  const positiveEmotions = ["happy", "excited", "hopeful", "content"]
  const negativeEmotions = ["sad", "anxious", "angry", "lonely", "confused", "tired"]

  let positiveCount = 0
  let negativeCount = 0
  let neutralCount = 0
  let sadnessScore = 0

  emotionalData.forEach((data) => {
    if (positiveEmotions.includes(data.emotion)) {
      positiveCount++
    } else if (negativeEmotions.includes(data.emotion)) {
      negativeCount++
      if (data.emotion === "sad") sadnessScore += data.confidence
    } else {
      neutralCount++
    }
  })

  const total = emotionalData.length
  const positivePercentage = Math.round((positiveCount / total) * 100)
  const negativePercentage = Math.round((negativeCount / total) * 100)
  const neutralPercentage = 100 - positivePercentage - negativePercentage

  const wellbeingIndex = Math.max(0, Math.min(100, positivePercentage + neutralPercentage * 0.5))
  sadnessScore = Math.round(sadnessScore / Math.max(1, negativeCount))

  let urgencyLevel: "stable" | "monitor" | "urgent" = "stable"
  if (wellbeingIndex < 30 || sadnessScore > 80) urgencyLevel = "urgent"
  else if (wellbeingIndex < 50 || sadnessScore > 60) urgencyLevel = "monitor"

  // Simple trend analysis (comparing first half vs second half)
  const midpoint = Math.floor(total / 2)
  const firstHalf = emotionalData.slice(0, midpoint)
  const secondHalf = emotionalData.slice(midpoint)

  const firstHalfPositive = firstHalf.filter((d) => positiveEmotions.includes(d.emotion)).length / firstHalf.length
  const secondHalfPositive = secondHalf.filter((d) => positiveEmotions.includes(d.emotion)).length / secondHalf.length

  let trendDirection: "improving" | "stable" | "declining" = "stable"
  if (secondHalfPositive > firstHalfPositive + 0.1) trendDirection = "improving"
  else if (secondHalfPositive < firstHalfPositive - 0.1) trendDirection = "declining"

  return {
    sadnessScore,
    wellbeingIndex: Math.round(wellbeingIndex),
    urgencyLevel,
    positivePercentage,
    neutralPercentage,
    negativePercentage,
    trendDirection,
  }
}

function analyzeTriggers(emotionalData: EmotionalData[]): TriggerAnalysis {
  const positiveKeywords = ["happy", "good", "great", "love", "friend", "family", "exercise", "sleep"]
  const negativeKeywords = ["sad", "stress", "work", "tired", "anxious", "worried", "problem", "difficult"]

  const wordFrequency: Record<string, number> = {}
  const topPositiveTriggers = [
    "Social connections and relationships",
    "Physical activity and exercise",
    "Adequate rest and sleep",
  ]
  const topNegativeTriggers = ["Work-related stress", "Sleep difficulties", "Social isolation"]

  // Simple word frequency analysis
  emotionalData.forEach((data) => {
    const words = data.content.toLowerCase().split(/\s+/)
    words.forEach((word) => {
      if (word.length > 3) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1
      }
    })
  })

  return {
    positiveKeywords,
    negativeKeywords,
    topPositiveTriggers,
    topNegativeTriggers,
    wordFrequency,
  }
}

function interpretWellbeingScore(wellbeingIndex: number, sadnessScore: number): string {
  if (wellbeingIndex >= 70) {
    return "Your well-being score indicates strong emotional resilience and positive mental health patterns. You demonstrate effective coping strategies and maintain a generally optimistic outlook."
  } else if (wellbeingIndex >= 50) {
    return "Your well-being score shows moderate emotional stability with room for growth. You have good foundations but may benefit from additional self-care practices and support."
  } else {
    return "Your well-being score suggests you may be experiencing some emotional challenges. This is completely normal, and seeking additional support or professional guidance could be very beneficial."
  }
}

function getUrgencyExplanation(urgencyLevel: string): string {
  switch (urgencyLevel) {
    case "stable":
      return "Your emotional patterns indicate stable mental health with effective coping mechanisms in place."
    case "monitor":
      return "Your patterns suggest some areas that may benefit from closer attention and additional self-care practices."
    case "urgent":
      return "Your patterns indicate you may benefit from immediate professional support. Please consider reaching out to a mental health professional."
    default:
      return "Continue monitoring your emotional well-being and maintain healthy coping strategies."
  }
}

function getProgressSummary(trendDirection: string, messageCount: number): string {
  const engagement = messageCount > 50 ? "high" : messageCount > 20 ? "moderate" : "developing"

  switch (trendDirection) {
    case "improving":
      return `Your emotional patterns show positive improvement over time. With ${engagement} engagement in self-reflection, you're building strong mental health awareness and coping skills.`
    case "declining":
      return `Your recent patterns suggest some challenges that deserve attention. Your ${engagement} engagement shows commitment to growth - consider additional support strategies.`
    default:
      return `Your emotional patterns remain relatively stable. Your ${engagement} engagement in self-reflection demonstrates good mental health awareness.`
  }
}

function generateEncouragementMessage(moodAnalysis: MoodAnalysis, messageCount: number): string {
  return `Your journey with MediChat-AI demonstrates remarkable commitment to your mental health and personal growth. Through ${messageCount} meaningful conversations, you've shown courage in exploring your emotions and seeking support when needed.

Remember that mental health is not a destination but an ongoing journey of self-discovery and care. Every conversation, every moment of reflection, and every step toward understanding yourself better is a victory worth celebrating.

Your ${moodAnalysis.wellbeingIndex}% well-being score reflects your current state, but more importantly, it shows your capacity for growth and resilience. Whether you're experiencing challenges or celebrating progress, know that seeking support and maintaining self-awareness are signs of strength, not weakness.

Continue to be patient and compassionate with yourself. You have the tools, the awareness, and the support system to navigate whatever comes your way. Your mental health matters, and you matter.

Keep moving forward, one conversation at a time. 🌟`
}
