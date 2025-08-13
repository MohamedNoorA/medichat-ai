"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, TrendingUp, Calendar } from "lucide-react"

const moods = [
  { emoji: "😊", label: "Great", color: "bg-green-100 text-green-800", value: 5 },
  { emoji: "🙂", label: "Good", color: "bg-blue-100 text-blue-800", value: 4 },
  { emoji: "😐", label: "Okay", color: "bg-yellow-100 text-yellow-800", value: 3 },
  { emoji: "😔", label: "Low", color: "bg-orange-100 text-orange-800", value: 2 },
  { emoji: "😢", label: "Sad", color: "bg-red-100 text-red-800", value: 1 },
]

const activities = ["Exercise", "Meditation", "Reading", "Music", "Friends", "Nature", "Sleep", "Work"]

export function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [note, setNote] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleActivityToggle = (activity: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity],
    )
  }

  const handleSubmit = () => {
    if (selectedMood !== null) {
      // Store in localStorage for demo purposes
      const entry = {
        date: new Date().toISOString().split("T")[0],
        mood: selectedMood,
        activities: selectedActivities,
        note: note,
        timestamp: new Date().toISOString(),
      }

      const existingEntries = JSON.parse(localStorage.getItem("moodEntries") || "[]")
      existingEntries.push(entry)
      localStorage.setItem("moodEntries", JSON.stringify(existingEntries))

      setIsSubmitted(true)
      setTimeout(() => {
        setIsSubmitted(false)
        setSelectedMood(null)
        setSelectedActivities([])
        setNote("")
      }, 2000)
    }
  }

  return (
    <section id="mood-tracker" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">Daily Mood Tracker</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Take a moment to check in with yourself. Track your daily mood and activities to understand your patterns.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mood Selection */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-cyan-600" />
                  How are you feeling today?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-5 gap-3">
                  {moods.map((mood, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedMood(mood.value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedMood === mood.value
                          ? "border-cyan-500 bg-cyan-50 scale-105"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-3xl mb-2">{mood.emoji}</div>
                      <div className="text-xs font-medium text-slate-600">{mood.label}</div>
                    </button>
                  ))}
                </div>

                {selectedMood && (
                  <div className="text-center">
                    <Badge className={moods.find((m) => m.value === selectedMood)?.color}>
                      Feeling {moods.find((m) => m.value === selectedMood)?.label}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activities & Notes */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  What influenced your mood?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-3 block">
                    Activities (select all that apply):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {activities.map((activity) => (
                      <button
                        key={activity}
                        onClick={() => handleActivityToggle(activity)}
                        className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                          selectedActivities.includes(activity)
                            ? "bg-purple-100 text-purple-800 border-2 border-purple-300"
                            : "bg-slate-100 text-slate-600 border-2 border-transparent hover:border-slate-300"
                        }`}
                      >
                        {activity}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Notes (optional):</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="How was your day? Any thoughts you'd like to record..."
                    className="w-full p-3 border border-slate-200 rounded-lg resize-none h-20 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={selectedMood === null || isSubmitted}
                  className="w-full bg-gradient-to-r from-purple-500 to-cyan-600 hover:from-purple-600 hover:to-cyan-700 disabled:opacity-50"
                >
                  {isSubmitted ? (
                    <>✓ Mood Recorded!</>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Record Today's Mood
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
