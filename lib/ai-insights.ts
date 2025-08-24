import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export interface EmotionData {
  date: string
  emotion: string
  confidence: number
  content?: string
  triggers?: string[]
}

export interface ConversationPattern {
  timeOfDay: string
  frequency: number
  averageEmotion: string
  commonTopics: string[]
}

export interface MentalHealthInsight {
  type: "positive" | "concern" | "neutral"
  title: string
  description: string
  recommendation: string
  confidence: number
}

export interface CopingStrategy {
  id: string
  title: string
  description: string
  category: "breathing" | "mindfulness" | "cognitive" | "behavioral" | "social"
  effectiveness: number
  personalizedReason: string
}

export interface ProgressMetric {
  metric: string
  currentValue: number
  previousValue: number
  trend: "improving" | "stable" | "declining"
  insight: string
  changePercentage: number
}

export interface CrisisAssessment {
  riskLevel: "low" | "medium" | "high" | "critical"
  factors: string[]
  recommendations: string[]
  urgency: boolean
  score: number
}

export class AIInsightsEngine {
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  // Calculate basic emotion statistics
  calculateEmotionStats(emotionData: EmotionData[]) {
    if (emotionData.length === 0) return null

    const emotionCounts = emotionData.reduce(
      (acc, item) => {
        acc[item.emotion] = (acc[item.emotion] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const totalMessages = emotionData.length
    const averageConfidence = emotionData.reduce((sum, item) => sum + item.confidence, 0) / totalMessages

    // Calculate emotional diversity (how many different emotions)
    const emotionalDiversity = Object.keys(emotionCounts).length

    // Calculate emotional stability (consistency of emotions)
    const emotionVariance = this.calculateEmotionVariance(emotionData)

    return {
      totalMessages,
      averageConfidence: Math.round(averageConfidence),
      emotionalDiversity,
      emotionalStability: Math.max(0, 100 - emotionVariance),
      emotionDistribution: emotionCounts,
      dominantEmotion: Object.entries(emotionCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "neutral",
    }
  }

  private calculateEmotionVariance(emotionData: EmotionData[]): number {
    const emotions = [
      "happy",
      "sad",
      "anxious",
      "angry",
      "neutral",
      "excited",
      "lonely",
      "confused",
      "hopeful",
      "tired",
    ]
    const emotionScores = emotions.map((emotion, index) => {
      const count = emotionData.filter((d) => d.emotion === emotion).length
      return count * (index + 1) // Weight emotions
    })

    const mean = emotionScores.reduce((a, b) => a + b, 0) / emotionScores.length
    const variance = emotionScores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / emotionScores.length
    return Math.sqrt(variance)
  }

  async analyzeEmotionalPatterns(emotionData: EmotionData[]): Promise<MentalHealthInsight[]> {
    if (emotionData.length === 0) {
      return [
        {
          type: "neutral",
          title: "Getting Started",
          description: "Start chatting with MediChat-AI to begin building your mental health insights.",
          recommendation: "Share your thoughts and feelings to help us understand your emotional patterns.",
          confidence: 100,
        },
      ]
    }

    const stats = this.calculateEmotionStats(emotionData)
    if (!stats) return []

    // Create a comprehensive analysis prompt
    const recentEmotions = emotionData.slice(-10).map((d) => ({
      date: d.date,
      emotion: d.emotion,
      confidence: d.confidence,
      preview: d.content?.substring(0, 100) || "",
    }))

    const prompt = `
      Analyze this user's mental health data and provide 4-5 key insights:

      STATISTICS:
      - Total messages: ${stats.totalMessages}
      - Average confidence: ${stats.averageConfidence}%
      - Emotional diversity: ${stats.emotionalDiversity} different emotions
      - Emotional stability: ${stats.emotionalStability}%
      - Dominant emotion: ${stats.dominantEmotion}

      RECENT EMOTIONS (last 10):
      ${JSON.stringify(recentEmotions, null, 2)}

      EMOTION DISTRIBUTION:
      ${JSON.stringify(stats.emotionDistribution, null, 2)}

      Provide insights in this EXACT JSON format:
      {
        "insights": [
          {
            "type": "positive|concern|neutral",
            "title": "Brief insight title (max 50 chars)",
            "description": "Detailed analysis (100-200 chars)",
            "recommendation": "Specific actionable advice (100-200 chars)",
            "confidence": 75-95
          }
        ]
      }

      Focus on:
      1. Emotional patterns and trends
      2. Stability and consistency
      3. Areas of strength
      4. Areas needing attention
      5. Progress indicators

      Make insights specific, actionable, and encouraging.
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = result.response.text()

      // Clean the response to ensure valid JSON
      const cleanResponse = response.replace(/```json\n?|\n?```/g, "").trim()
      const parsed = JSON.parse(cleanResponse)

      return parsed.insights || []
    } catch (error) {
      console.error("Error analyzing emotional patterns:", error)

      // Fallback insights based on statistics
      return this.generateFallbackInsights(stats)
    }
  }

  private generateFallbackInsights(stats: any): MentalHealthInsight[] {
    const insights: MentalHealthInsight[] = []

    // Emotional stability insight
    if (stats.emotionalStability > 70) {
      insights.push({
        type: "positive",
        title: "Strong Emotional Stability",
        description: `Your emotional patterns show ${stats.emotionalStability}% stability, indicating good emotional regulation.`,
        recommendation: "Continue your current coping strategies and maintain this positive trend.",
        confidence: 85,
      })
    } else if (stats.emotionalStability < 40) {
      insights.push({
        type: "concern",
        title: "Emotional Variability",
        description: `Your emotions show high variability (${stats.emotionalStability}% stability). This might indicate stress.`,
        recommendation: "Consider practicing mindfulness or speaking with a mental health professional.",
        confidence: 80,
      })
    }

    // Engagement insight
    if (stats.totalMessages > 20) {
      insights.push({
        type: "positive",
        title: "Active Engagement",
        description: `You've shared ${stats.totalMessages} messages, showing commitment to your mental health journey.`,
        recommendation: "Keep up this excellent engagement with self-reflection and growth.",
        confidence: 90,
      })
    }

    // Confidence insight
    if (stats.averageConfidence > 80) {
      insights.push({
        type: "positive",
        title: "High Emotional Awareness",
        description: `Your ${stats.averageConfidence}% average confidence suggests strong emotional self-awareness.`,
        recommendation: "Use this self-awareness to continue building emotional intelligence.",
        confidence: 85,
      })
    }

    return insights
  }

  async generatePersonalizedCopingStrategies(
    emotionData: EmotionData[],
    userPreferences: any,
  ): Promise<CopingStrategy[]> {
    if (emotionData.length === 0) {
      return this.getDefaultCopingStrategies()
    }

    const stats = this.calculateEmotionStats(emotionData)
    if (!stats) return this.getDefaultCopingStrategies()

    const prompt = `
      Generate 5 personalized coping strategies based on this user's data:

      USER PROFILE:
      - Dominant emotion: ${stats.dominantEmotion}
      - Emotional stability: ${stats.emotionalStability}%
      - Total interactions: ${stats.totalMessages}
      - Emotional diversity: ${stats.emotionalDiversity}
      - Preferences: ${JSON.stringify(userPreferences, null, 2)}

      EMOTION PATTERNS:
      ${JSON.stringify(stats.emotionDistribution, null, 2)}

      Return EXACT JSON format:
      {
        "strategies": [
          {
            "id": "strategy-1",
            "title": "Strategy Name (max 40 chars)",
            "description": "Clear implementation steps (150-250 chars)",
            "category": "breathing|mindfulness|cognitive|behavioral|social",
            "effectiveness": 70-95,
            "personalizedReason": "Why this works for this user (100-200 chars)"
          }
        ]
      }

      Make strategies:
      - Specific to their emotional patterns
      - Practical and actionable
      - Evidence-based
      - Personalized to their needs
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = result.response.text()
      const cleanResponse = response.replace(/```json\n?|\n?```/g, "").trim()
      const parsed = JSON.parse(cleanResponse)

      return parsed.strategies || this.getDefaultCopingStrategies()
    } catch (error) {
      console.error("Error generating coping strategies:", error)
      return this.getPersonalizedFallbackStrategies(stats)
    }
  }

  private getDefaultCopingStrategies(): CopingStrategy[] {
    return [
      {
        id: "breathing-basic",
        title: "4-7-8 Breathing Technique",
        description:
          "Inhale for 4 counts, hold for 7, exhale for 8. Repeat 4 times to activate your parasympathetic nervous system and reduce anxiety.",
        category: "breathing",
        effectiveness: 85,
        personalizedReason:
          "Breathing exercises are universally effective for stress management and emotional regulation.",
      },
      {
        id: "mindfulness-present",
        title: "5-4-3-2-1 Grounding",
        description:
          "Notice 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. This brings you into the present moment.",
        category: "mindfulness",
        effectiveness: 80,
        personalizedReason: "Grounding techniques help manage overwhelming emotions by focusing on the present.",
      },
    ]
  }

  private getPersonalizedFallbackStrategies(stats: any): CopingStrategy[] {
    const strategies: CopingStrategy[] = []

    // Add strategies based on dominant emotion
    if (stats.dominantEmotion === "anxious") {
      strategies.push({
        id: "anxiety-breathing",
        title: "Box Breathing for Anxiety",
        description: "Breathe in for 4, hold for 4, out for 4, hold for 4. Repeat 5 times when feeling anxious.",
        category: "breathing",
        effectiveness: 90,
        personalizedReason: "Your anxiety patterns show this breathing technique would be particularly effective.",
      })
    }

    if (stats.dominantEmotion === "sad") {
      strategies.push({
        id: "mood-behavioral",
        title: "Gentle Movement Therapy",
        description: "Take a 10-minute walk or do light stretching. Physical movement can help lift mood naturally.",
        category: "behavioral",
        effectiveness: 85,
        personalizedReason: "Based on your mood patterns, gentle physical activity can help improve emotional state.",
      })
    }

    // Add default strategies
    strategies.push(...this.getDefaultCopingStrategies())

    return strategies.slice(0, 5)
  }

  async assessCrisisRisk(recentMessages: any[]): Promise<CrisisAssessment> {
    if (recentMessages.length === 0) {
      return {
        riskLevel: "low",
        factors: [],
        recommendations: ["Continue regular check-ins with MediChat-AI"],
        urgency: false,
        score: 10,
      }
    }

    // Analyze message content for crisis indicators
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
      "hopeless",
      "worthless",
      "can't go on",
      "give up",
    ]

    const concernKeywords = [
      "depressed",
      "overwhelmed",
      "can't cope",
      "breaking down",
      "falling apart",
      "lost",
      "alone",
      "isolated",
      "desperate",
    ]

    let crisisScore = 0
    const factors: string[] = []
    const recentContent = recentMessages.map((m) => m.content?.toLowerCase() || "").join(" ")

    // Check for crisis indicators
    crisisKeywords.forEach((keyword) => {
      if (recentContent.includes(keyword)) {
        crisisScore += 20
        factors.push(`Mentions of ${keyword}`)
      }
    })

    // Check for concern indicators
    concernKeywords.forEach((keyword) => {
      if (recentContent.includes(keyword)) {
        crisisScore += 5
        if (factors.length < 5) factors.push(`Expressions of ${keyword}`)
      }
    })

    // Analyze emotion patterns
    const negativeEmotions = recentMessages.filter((m) =>
      ["sad", "anxious", "angry", "lonely"].includes(m.emotion?.detected),
    )

    if (negativeEmotions.length > recentMessages.length * 0.8) {
      crisisScore += 15
      factors.push("Predominantly negative emotional patterns")
    }

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" | "critical"
    let recommendations: string[]
    let urgency = false

    if (crisisScore >= 40) {
      riskLevel = "critical"
      urgency = true
      recommendations = [
        "Contact emergency services (911) immediately",
        "Call National Suicide Prevention Lifeline: 988",
        "Reach out to a trusted friend or family member",
        "Go to your nearest emergency room",
      ]
    } else if (crisisScore >= 25) {
      riskLevel = "high"
      recommendations = [
        "Contact a mental health professional today",
        "Call National Suicide Prevention Lifeline: 988",
        "Reach out to trusted support network",
        "Consider crisis counseling services",
      ]
    } else if (crisisScore >= 15) {
      riskLevel = "medium"
      recommendations = [
        "Schedule appointment with mental health professional",
        "Practice coping strategies regularly",
        "Maintain connection with support network",
        "Monitor mood and seek help if worsening",
      ]
    } else {
      riskLevel = "low"
      recommendations = [
        "Continue regular self-care practices",
        "Maintain healthy routines",
        "Stay connected with support network",
        "Keep using MediChat-AI for ongoing support",
      ]
    }

    return {
      riskLevel,
      factors,
      recommendations,
      urgency,
      score: crisisScore,
    }
  }

  async generateProgressMetrics(currentData: EmotionData[], previousData: EmotionData[]): Promise<ProgressMetric[]> {
    const currentStats = this.calculateEmotionStats(currentData)
    const previousStats = this.calculateEmotionStats(previousData)

    if (!currentStats || !previousStats) {
      return [
        {
          metric: "Getting Started",
          currentValue: 50,
          previousValue: 0,
          trend: "improving",
          insight: "Begin your mental health journey by sharing more with MediChat-AI.",
          changePercentage: 0,
        },
      ]
    }

    const metrics: ProgressMetric[] = []

    // Emotional Stability
    const stabilityChange = currentStats.emotionalStability - previousStats.emotionalStability
    metrics.push({
      metric: "Emotional Stability",
      currentValue: currentStats.emotionalStability,
      previousValue: previousStats.emotionalStability,
      trend: stabilityChange > 5 ? "improving" : stabilityChange < -5 ? "declining" : "stable",
      insight:
        stabilityChange > 5
          ? "Your emotional stability has improved, showing better emotional regulation."
          : stabilityChange < -5
            ? "Your emotional stability has decreased. Consider focusing on stress management."
            : "Your emotional stability remains consistent.",
      changePercentage: Math.round(Math.abs(stabilityChange)),
    })

    // Emotional Awareness (confidence)
    const confidenceChange = currentStats.averageConfidence - previousStats.averageConfidence
    metrics.push({
      metric: "Emotional Awareness",
      currentValue: currentStats.averageConfidence,
      previousValue: previousStats.averageConfidence,
      trend: confidenceChange > 3 ? "improving" : confidenceChange < -3 ? "declining" : "stable",
      insight:
        confidenceChange > 3
          ? "Your emotional self-awareness has increased significantly."
          : confidenceChange < -3
            ? "Your emotional clarity may need attention. Consider mindfulness practices."
            : "Your emotional awareness remains steady.",
      changePercentage: Math.round(Math.abs(confidenceChange)),
    })

    // Engagement Level
    const engagementChange = currentData.length - previousData.length
    const engagementValue = Math.min(100, (currentData.length / 30) * 100) // Normalize to 30 messages = 100%
    const previousEngagementValue = Math.min(100, (previousData.length / 30) * 100)

    metrics.push({
      metric: "Engagement Level",
      currentValue: Math.round(engagementValue),
      previousValue: Math.round(previousEngagementValue),
      trend: engagementChange > 2 ? "improving" : engagementChange < -2 ? "declining" : "stable",
      insight:
        engagementChange > 2
          ? "Increased engagement shows commitment to your mental health journey."
          : engagementChange < -2
            ? "Consider maintaining regular check-ins for better mental health tracking."
            : "You're maintaining consistent engagement with your mental health.",
      changePercentage: Math.round(Math.abs(engagementValue - previousEngagementValue)),
    })

    // Emotional Diversity
    const diversityChange = currentStats.emotionalDiversity - previousStats.emotionalDiversity
    const diversityValue = Math.min(100, (currentStats.emotionalDiversity / 8) * 100) // 8 emotions = 100%
    const previousDiversityValue = Math.min(100, (previousStats.emotionalDiversity / 8) * 100)

    metrics.push({
      metric: "Emotional Range",
      currentValue: Math.round(diversityValue),
      previousValue: Math.round(previousDiversityValue),
      trend: diversityChange > 0 ? "improving" : diversityChange < 0 ? "declining" : "stable",
      insight:
        diversityChange > 0
          ? "You're experiencing a wider range of emotions, which is healthy."
          : diversityChange < 0
            ? "Your emotional range has narrowed. This might indicate mood patterns to explore."
            : "Your emotional range remains consistent.",
      changePercentage: Math.round(Math.abs(diversityValue - previousDiversityValue)),
    })

    return metrics
  }
}

export const aiInsights = new AIInsightsEngine()
