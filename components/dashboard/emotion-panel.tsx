"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDashboardStore } from "@/lib/store/dashboard-store"
import { Brain, Heart, Smile, Frown, Zap, Cloud, User, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"

const emotionColors: { [key: string]: string } = {
  neutral: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  sad: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  anxious: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  happy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  angry: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  stressed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  lonely: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  confused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  hopeful: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  tired: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
}

const emotionIcons: { [key: string]: React.ElementType } = {
  neutral: Smile,
  sad: Frown,
  anxious: Cloud,
  happy: Heart,
  angry: Zap,
  stressed: Brain,
  lonely: Frown,
  confused: Brain,
  hopeful: Smile,
  tired: Cloud,
}

export function EmotionPanel() {
  const { user, currentEmotion, currentConfidence } = useDashboardStore()

  const CurrentEmotionIcon = currentEmotion ? emotionIcons[currentEmotion] : Smile

  return (
    <div className="w-80 space-y-6 p-4">
      {/* User Profile */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        <Card className="border-0 shadow-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-cyan-600" />
              Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{user?.email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Member since {new Date(user?.createdAt || "").toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Emotion Analysis */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-0 shadow-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5 text-purple-600" />
              Current Emotion
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentEmotion ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${emotionColors[currentEmotion].replace("text-", "bg-").replace("800", "500")} flex items-center justify-center`}
                  >
                    {CurrentEmotionIcon && <CurrentEmotionIcon className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <Badge className={emotionColors[currentEmotion]}>
                      {currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)}
                    </Badge>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Confidence: {currentConfidence}%</p>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    The AI detected <strong>{currentEmotion}</strong> emotions and tailored its response accordingly.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Start chatting to see real-time emotion analysis
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-0 shadow-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start bg-transparent hover:bg-red-50 dark:hover:bg-red-950 text-red-600 border-red-200 dark:border-red-800"
              onClick={() => {
                toast.error("Crisis Support", {
                  description: "Call 988 for immediate help",
                  action: {
                    label: "Call Now",
                    onClick: () => window.open("tel:988"),
                  },
                })
              }}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Crisis Support
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => toast.info("Breathing exercise feature coming soon!")}
            >
              🫁 Breathing Exercise
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => toast.info("Mood tracking feature coming soon!")}
            >
              📊 Track Mood
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => toast.info("Resources feature coming soon!")}
            >
              📚 Mental Health Resources
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
