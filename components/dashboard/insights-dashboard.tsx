"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts"
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Lightbulb,
  Shield,
  Activity,
  Zap,
  CheckCircle,
  Loader2,
  RefreshCw,
  BarChart3,
  Heart,
  MessageSquare,
} from "lucide-react"
import { toast } from "sonner"

interface InsightData {
  insights: Array<{
    type: "positive" | "concern" | "neutral"
    title: string
    description: string
    recommendation: string
    confidence: number
  }>
  copingStrategies: Array<{
    id: string
    title: string
    description: string
    category: string
    effectiveness: number
    personalizedReason: string
  }>
  crisisAssessment: {
    riskLevel: "low" | "medium" | "high" | "critical"
    factors: string[]
    recommendations: string[]
    urgency: boolean
    score: number
  }
  progressMetrics: Array<{
    metric: string
    currentValue: number
    previousValue: number
    trend: "improving" | "stable" | "declining"
    insight: string
    changePercentage: number
  }>
  statistics: {
    totalMessages: number
    emotionDistribution: Record<string, number>
    averageConfidence: number
    timeframe: number
    hasData: boolean
    previousPeriodMessages: number
  }
  emotionData: Array<{
    date: string
    emotion: string
    confidence: number
    index: number
  }>
  rawEmotionData: Array<{
    date: string
    emotion: string
    confidence: number
    content: string
  }>
}

const EMOTION_COLORS = {
  happy: "#10B981",
  sad: "#3B82F6",
  anxious: "#F59E0B",
  angry: "#EF4444",
  neutral: "#6B7280",
  excited: "#8B5CF6",
  lonely: "#06B6D4",
  confused: "#84CC16",
  hopeful: "#EC4899",
  tired: "#64748B",
}

const RISK_COLORS = {
  low: "#10B981",
  medium: "#F59E0B",
  high: "#EF4444",
  critical: "#DC2626",
}

const CATEGORY_ICONS = {
  breathing: "🫁",
  mindfulness: "🧘",
  cognitive: "🧠",
  behavioral: "🏃",
  social: "👥",
}

export function InsightsDashboard() {
  const [data, setData] = useState<InsightData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeframe, setTimeframe] = useState("30")
  const [activeGoals, setActiveGoals] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInsights()
  }, [timeframe])

  const loadInsights = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      console.log(`Loading insights for ${timeframe} days...`)
      const response = await fetch(`/api/insights?timeframe=${timeframe}`, {
        credentials: "include",
        cache: "no-store",
      })

      if (response.ok) {
        const insightData = await response.json()
        console.log("Insights loaded:", insightData)
        setData(insightData)

        if (isRefresh) {
          toast.success("Insights refreshed successfully!")
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to load insights")
      }
    } catch (error) {
      console.error("Error loading insights:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load insights"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadInsights(true)
  }

  const handleGoalToggle = (strategyId: string) => {
    setActiveGoals((prev) =>
      prev.includes(strategyId) ? prev.filter((id) => id !== strategyId) : [...prev, strategyId],
    )
    toast.success("Goal updated!")
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-600" />
          <p className="text-slate-600 dark:text-slate-400">Analyzing your mental health patterns...</p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Unable to Load Insights</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <Button onClick={() => loadInsights()} className="bg-cyan-600 hover:bg-cyan-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!data || !data.statistics.hasData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Brain className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Start Your Mental Health Journey
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Begin chatting with MediChat-AI to unlock personalized insights about your mental wellness patterns.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <MessageSquare className="h-4 w-4" />
            <span>Share your thoughts to see your analysis here</span>
          </div>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const emotionChartData = Object.entries(data.statistics.emotionDistribution).map(([emotion, count]) => ({
    emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
    count,
    percentage: Math.round((count / data.statistics.totalMessages) * 100),
    fill: EMOTION_COLORS[emotion as keyof typeof EMOTION_COLORS] || "#6B7280",
  }))

  const emotionTrendData = data.emotionData.map((item) => ({
    date: item.date,
    confidence: item.confidence,
    emotion: item.emotion,
    index: item.index,
  }))

  // Prepare progress chart data
  const progressChartData = data.progressMetrics.map((metric) => ({
    metric: metric.metric.replace(/([A-Z])/g, " $1").trim(),
    current: metric.currentValue,
    previous: metric.previousValue,
    change: metric.currentValue - metric.previousValue,
  }))

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
              AI Mental Health Insights
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Personalized analysis of your mental wellness journey
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Crisis Assessment Alert */}
        {data.crisisAssessment.riskLevel !== "low" && (
          <Card
            className={`border-l-4 ${
              data.crisisAssessment.riskLevel === "critical"
                ? "border-l-red-600 bg-red-50 dark:bg-red-900/20"
                : data.crisisAssessment.riskLevel === "high"
                  ? "border-l-orange-600 bg-orange-50 dark:bg-orange-900/20"
                  : "border-l-yellow-600 bg-yellow-50 dark:bg-yellow-900/20"
            }`}
          >
            <CardHeader>
              <CardTitle
                className={`flex items-center gap-2 ${
                  data.crisisAssessment.riskLevel === "critical"
                    ? "text-red-700 dark:text-red-300"
                    : data.crisisAssessment.riskLevel === "high"
                      ? "text-orange-700 dark:text-orange-300"
                      : "text-yellow-700 dark:text-yellow-300"
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
                Mental Health Check-in Required
                {data.crisisAssessment.urgency && (
                  <Badge variant="destructive" className="ml-2">
                    URGENT
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`border-2 font-semibold ${
                      data.crisisAssessment.riskLevel === "critical"
                        ? "border-red-500 text-red-700 dark:text-red-300"
                        : data.crisisAssessment.riskLevel === "high"
                          ? "border-orange-500 text-orange-700 dark:text-orange-300"
                          : "border-yellow-500 text-yellow-700 dark:text-yellow-300"
                    }`}
                  >
                    {data.crisisAssessment.riskLevel.toUpperCase()} PRIORITY
                  </Badge>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Risk Score: {data.crisisAssessment.score}/100
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {data.crisisAssessment.factors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Areas of Concern:</h4>
                      <ul className="text-sm space-y-1">
                        {data.crisisAssessment.factors.map((factor, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-2">Recommended Actions:</h4>
                    <ul className="text-sm space-y-1">
                      {data.crisisAssessment.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {data.crisisAssessment.urgency && (
                  <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200 flex items-center gap-2">
                      <span className="text-lg">🚨</span>
                      <strong>Crisis Resources:</strong>
                    </p>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      <p>
                        • <strong>Emergency:</strong> Call 911
                      </p>
                      <p>
                        • <strong>Crisis Line:</strong> Call 988 (Suicide & Crisis Lifeline)
                      </p>
                      <p>
                        • <strong>Text Support:</strong> Text HOME to 741741
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Messages</p>
                  <p className="text-2xl font-bold">{data.statistics.totalMessages}</p>
                  <p className="text-xs text-slate-500 mt-1">Last {timeframe} days</p>
                </div>
                <Activity className="h-8 w-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Emotional Clarity</p>
                  <p className="text-2xl font-bold">{data.statistics.averageConfidence}%</p>
                  <p className="text-xs text-slate-500 mt-1">Average confidence</p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Active Goals</p>
                  <p className="text-2xl font-bold">{activeGoals.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Coping strategies</p>
                </div>
                <Zap className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Wellness Level</p>
                  <p className="text-2xl font-bold capitalize">{data.crisisAssessment.riskLevel}</p>
                  <p className="text-xs text-slate-500 mt-1">Risk assessment</p>
                </div>
                <Shield
                  className={`h-8 w-8`}
                  style={{
                    color: RISK_COLORS[data.crisisAssessment.riskLevel],
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="insights" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="strategies" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Coping Tools
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4">
              {data.insights.map((insight, idx) => (
                <Card
                  key={idx}
                  className={`border-l-4 hover:shadow-md transition-shadow ${
                    insight.type === "positive"
                      ? "border-l-green-500 bg-green-50/50 dark:bg-green-900/10"
                      : insight.type === "concern"
                        ? "border-l-red-500 bg-red-50/50 dark:bg-red-900/10"
                        : "border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {insight.type === "positive" ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : insight.type === "concern" ? (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      ) : (
                        <Brain className="h-5 w-5 text-blue-600" />
                      )}
                      {insight.title}
                      <Badge variant="outline" className="ml-auto">
                        {insight.confidence}% confidence
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 dark:text-slate-300 mb-3">{insight.description}</p>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border">
                      <p className="text-sm font-medium text-slate-900 dark:text-white mb-1 flex items-center gap-1">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Recommendation:
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{insight.recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            {/* Progress Overview Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-cyan-600" />
                  Progress Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={progressChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="previous" fill="#94A3B8" name="Previous Period" />
                    <Bar dataKey="current" fill="#06B6D4" name="Current Period" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Individual Progress Metrics */}
            <div className="grid gap-4">
              {data.progressMetrics.map((metric, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {metric.trend === "improving" ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : metric.trend === "declining" ? (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        ) : (
                          <Activity className="h-5 w-5 text-blue-600" />
                        )}
                        {metric.metric}
                      </span>
                      <Badge
                        variant={
                          metric.trend === "improving"
                            ? "default"
                            : metric.trend === "declining"
                              ? "destructive"
                              : "secondary"
                        }
                        className="flex items-center gap-1"
                      >
                        {metric.trend === "improving" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : metric.trend === "declining" ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <Activity className="h-3 w-3" />
                        )}
                        {metric.trend} {metric.changePercentage > 0 && `(+${metric.changePercentage}%)`}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Previous: {metric.previousValue}%</span>
                        <span>Current: {metric.currentValue}%</span>
                      </div>
                      <Progress value={metric.currentValue} className="h-3" />
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-sm text-slate-600 dark:text-slate-400">{metric.insight}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-4">
            <div className="grid gap-4">
              {data.copingStrategies.map((strategy) => (
                <Card key={strategy.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {CATEGORY_ICONS[strategy.category as keyof typeof CATEGORY_ICONS] || "🧠"}
                        </span>
                        <div>
                          <h3 className="font-semibold">{strategy.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {strategy.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={activeGoals.includes(strategy.id) ? "default" : "outline"}
                          onClick={() => handleGoalToggle(strategy.id)}
                          className="flex items-center gap-1"
                        >
                          {activeGoals.includes(strategy.id) ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Active Goal
                            </>
                          ) : (
                            <>
                              <Target className="h-4 w-4" />
                              Set as Goal
                            </>
                          )}
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-slate-700 dark:text-slate-300">{strategy.description}</p>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Effectiveness:</span>
                          <Progress value={strategy.effectiveness} className="w-24 h-2" />
                          <span className="text-sm font-medium">{strategy.effectiveness}%</span>
                        </div>
                      </div>

                      <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                        <p className="text-sm font-medium text-cyan-800 dark:text-cyan-200 mb-1 flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          Why this works for you:
                        </p>
                        <p className="text-sm text-cyan-700 dark:text-cyan-300">{strategy.personalizedReason}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Emotion Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-600" />
                    Emotion Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={emotionChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ emotion, percentage }) => `${emotion}: ${percentage}%`}
                      >
                        {emotionChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} messages`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Emotional Confidence Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Emotional Confidence Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={emotionTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        formatter={(value, name) => [`${value}%`, "Confidence"]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="confidence"
                        stroke="#06B6D4"
                        fill="#06B6D4"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Detailed Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Emotion Breakdown</h4>
                    <div className="space-y-2">
                      {emotionChartData.map((emotion) => (
                        <div key={emotion.emotion} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: emotion.fill }} />
                            <span className="text-sm">{emotion.emotion}</span>
                          </div>
                          <div className="text-sm font-medium">
                            {emotion.count} ({emotion.percentage}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Engagement Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Messages this period</span>
                        <span className="text-sm font-medium">{data.statistics.totalMessages}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Previous period</span>
                        <span className="text-sm font-medium">{data.statistics.previousPeriodMessages}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Change</span>
                        <span
                          className={`text-sm font-medium ${
                            data.statistics.totalMessages > data.statistics.previousPeriodMessages
                              ? "text-green-600"
                              : data.statistics.totalMessages < data.statistics.previousPeriodMessages
                                ? "text-red-600"
                                : "text-slate-600"
                          }`}
                        >
                          {data.statistics.totalMessages > data.statistics.previousPeriodMessages ? "+" : ""}
                          {data.statistics.totalMessages - data.statistics.previousPeriodMessages}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Wellness Indicators</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Risk Level</span>
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: RISK_COLORS[data.crisisAssessment.riskLevel],
                            color: RISK_COLORS[data.crisisAssessment.riskLevel],
                          }}
                        >
                          {data.crisisAssessment.riskLevel}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Active Goals</span>
                        <span className="text-sm font-medium">{activeGoals.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Timeframe</span>
                        <span className="text-sm font-medium">{timeframe} days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
