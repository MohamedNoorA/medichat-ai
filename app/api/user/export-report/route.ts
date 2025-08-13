import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { extractToken, verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface ExportOptions {
  includeAnalysis: boolean
  includeRecommendations: boolean
  includeEmotionalTrends: boolean
}

interface ConversationData {
  _id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messageCount: number
  messages: Array<{
    content: string
    sender: "user" | "ai"
    timestamp: Date
    emotion?: { detected: string; confidence: number }
  }>
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== Export Mental Health Report Request ===")

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

    // Fetch conversations and messages
    const conversationsCollection = db.collection("conversations")
    const messagesCollection = db.collection("messages")

    const conversations = await conversationsCollection
      .find({ userId: new ObjectId(decoded.userId) })
      .sort({ createdAt: -1 })
      .toArray()

    const conversationData: ConversationData[] = []

    for (const conv of conversations) {
      const messages = await messagesCollection.find({ conversationId: conv._id }).sort({ timestamp: 1 }).toArray()

      conversationData.push({
        _id: conv._id.toString(),
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: conv.messageCount || 0,
        messages: messages.map((msg) => ({
          content: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp,
          emotion: msg.emotion,
        })),
      })
    }

    // Generate AI analysis if requested
    let aiAnalysis = ""
    let therapyRecommendation = ""
    let emotionalTrends = ""

    if (options.includeAnalysis || options.includeRecommendations || options.includeEmotionalTrends) {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      // Prepare conversation summary for AI analysis
      const conversationSummary = conversationData
        .map((conv) => {
          const userMessages = conv.messages.filter((m) => m.sender === "user")
          return {
            title: conv.title,
            date: conv.createdAt.toISOString().split("T")[0],
            userMessages: userMessages.map((m) => ({
              content: m.content,
              emotion: m.emotion?.detected || "neutral",
            })),
          }
        })
        .slice(0, 20) // Limit to recent 20 conversations

      if (options.includeAnalysis) {
        const analysisPrompt = `
          As a mental health professional, analyze the following conversation data from a user's mental health chat sessions:

          ${JSON.stringify(conversationSummary, null, 2)}

          Please provide:
          1. A comprehensive summary of the user's mental health journey
          2. Key themes and patterns in their conversations
          3. Emotional progression over time
          4. Coping strategies they've discussed
          5. Areas of concern or improvement

          Keep the analysis professional, empathetic, and constructive. Focus on patterns and insights that could be helpful for the user's self-reflection.
        `

        try {
          const result = await model.generateContent(analysisPrompt)
          aiAnalysis = result.response.text()
        } catch (error) {
          console.error("Error generating AI analysis:", error)
          aiAnalysis = "AI analysis temporarily unavailable. Please try again later."
        }
      }

      if (options.includeRecommendations) {
        const recommendationPrompt = `
          Based on the following mental health conversation data, provide professional recommendations:

          ${JSON.stringify(conversationSummary, null, 2)}

          Please provide:
          1. Whether professional therapy would be beneficial (Yes/No/Maybe) with reasoning
          2. Specific type of therapy that might help (CBT, DBT, etc.)
          3. Urgency level (Low/Medium/High)
          4. Self-care recommendations
          5. Warning signs to watch for
          6. Resources and next steps

          Be professional, supportive, and provide actionable recommendations. If there are any crisis indicators, emphasize the importance of immediate professional help.
        `

        try {
          const result = await model.generateContent(recommendationPrompt)
          therapyRecommendation = result.response.text()
        } catch (error) {
          console.error("Error generating therapy recommendations:", error)
          therapyRecommendation =
            "Therapy recommendations temporarily unavailable. Please consult with a mental health professional."
        }
      }

      if (options.includeEmotionalTrends) {
        const emotionData = conversationData.flatMap((conv) =>
          conv.messages
            .filter((m) => m.sender === "user" && m.emotion)
            .map((m) => ({
              date: m.timestamp.toISOString().split("T")[0],
              emotion: m.emotion!.detected,
              confidence: m.emotion!.confidence,
            })),
        )

        const trendsPrompt = `
          Analyze the following emotional data from user conversations:

          ${JSON.stringify(emotionData, null, 2)}

          Please provide:
          1. Overall emotional trends and patterns
          2. Most common emotions expressed
          3. Emotional stability over time
          4. Triggers or patterns in emotional changes
          5. Progress indicators (positive or concerning trends)

          Present this as a clear, easy-to-understand emotional wellness summary.
        `

        try {
          const result = await model.generateContent(trendsPrompt)
          emotionalTrends = result.response.text()
        } catch (error) {
          console.error("Error generating emotional trends:", error)
          emotionalTrends = "Emotional trends analysis temporarily unavailable."
        }
      }
    }

    // Create Word document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              children: [
                new TextRun({
                  text: "MediChat-AI Mental Health Report",
                  bold: true,
                  size: 32,
                  color: "2563EB",
                }),
              ],
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // User Information
            new Paragraph({
              children: [
                new TextRun({
                  text: "Personal Information",
                  bold: true,
                  size: 24,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Name: ", bold: true }),
                new TextRun({ text: user.username || "Not provided" }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [new TextRun({ text: "Email: ", bold: true }), new TextRun({ text: user.email })],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Member Since: ", bold: true }),
                new TextRun({ text: new Date(user.createdAt).toLocaleDateString() }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Report Generated: ", bold: true }),
                new TextRun({ text: new Date().toLocaleDateString() }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Total Conversations: ", bold: true }),
                new TextRun({ text: conversationData.length.toString() }),
              ],
              spacing: { after: 400 },
            }),

            // AI Analysis Section
            ...(options.includeAnalysis && aiAnalysis
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "AI-Powered Mental Health Analysis",
                        bold: true,
                        size: 24,
                      }),
                    ],
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 },
                  }),

                  new Paragraph({
                    children: [
                      new TextRun({
                        text: aiAnalysis,
                        size: 22,
                      }),
                    ],
                    spacing: { after: 400 },
                  }),
                ]
              : []),

            // Therapy Recommendations Section
            ...(options.includeRecommendations && therapyRecommendation
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Professional Therapy Recommendations",
                        bold: true,
                        size: 24,
                      }),
                    ],
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 },
                  }),

                  new Paragraph({
                    children: [
                      new TextRun({
                        text: therapyRecommendation,
                        size: 22,
                      }),
                    ],
                    spacing: { after: 400 },
                  }),
                ]
              : []),

            // Emotional Trends Section
            ...(options.includeEmotionalTrends && emotionalTrends
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Emotional Patterns & Trends",
                        bold: true,
                        size: 24,
                      }),
                    ],
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 },
                  }),

                  new Paragraph({
                    children: [
                      new TextRun({
                        text: emotionalTrends,
                        size: 22,
                      }),
                    ],
                    spacing: { after: 400 },
                  }),
                ]
              : []),

            // Conversation Summary
            new Paragraph({
              children: [
                new TextRun({
                  text: "Conversation History Summary",
                  bold: true,
                  size: 24,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),

            // Add conversation summaries
            ...conversationData.slice(0, 10).flatMap((conv) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${conv.title} (${new Date(conv.createdAt).toLocaleDateString()})`,
                    bold: true,
                    size: 20,
                  }),
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Messages: ${conv.messageCount} | Last Updated: ${new Date(conv.updatedAt).toLocaleDateString()}`,
                    italics: true,
                    size: 18,
                  }),
                ],
                spacing: { after: 100 },
              }),

              // Add first few user messages as preview
              ...conv.messages
                .filter((m) => m.sender === "user")
                .slice(0, 3)
                .map(
                  (msg) =>
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `"${msg.content.substring(0, 200)}${msg.content.length > 200 ? "..." : ""}"`,
                          size: 18,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                ),

              new Paragraph({
                children: [new TextRun({ text: "" })],
                spacing: { after: 200 },
              }),
            ]),

            // Footer
            new Paragraph({
              children: [
                new TextRun({
                  text: "Important Notice",
                  bold: true,
                  size: 20,
                }),
              ],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 600, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "This report is generated by MediChat-AI for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified mental health professionals with any questions you may have regarding your mental health. If you are experiencing a mental health crisis, please contact emergency services or a crisis hotline immediately.",
                  italics: true,
                  size: 18,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Crisis Resources:",
                  bold: true,
                  size: 18,
                }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "• National Suicide Prevention Lifeline: 988\n• Crisis Text Line: Text HOME to 741741\n• International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/",
                  size: 18,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Generated by MediChat-AI | Developed by Mohamed Noor Adan",
                  size: 16,
                  color: "666666",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 400 },
            }),
          ],
        },
      ],
    })

    // Generate the Word document buffer
    const buffer = await Packer.toBuffer(doc)

    console.log("Mental health report generated successfully")

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(buffer)

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="medichat-mental-health-report-${new Date().toISOString().split("T")[0]}.docx"`,
        "Content-Length": buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Error generating mental health report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
