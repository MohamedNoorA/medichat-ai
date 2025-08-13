"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Smile, Frown, Heart, Zap, Cloud, Brain } from "lucide-react"

const emotionExamples = [
  {
    text: "I'm feeling really overwhelmed with work lately and can't seem to catch a break.",
    emotion: "Stressed",
    confidence: 92,
    color: "bg-red-100 text-red-800",
    icon: Cloud,
    response:
      "I understand you're feeling overwhelmed. Let's work together to break down what's causing this stress and find some coping strategies that can help you feel more in control.",
  },
  {
    text: "Today was amazing! I got promoted and I'm so excited about the new opportunities ahead.",
    emotion: "Happy",
    confidence: 95,
    color: "bg-yellow-100 text-yellow-800",
    icon: Smile,
    response:
      "That's wonderful news! Your excitement is contagious. Let's talk about how you can maintain this positive momentum and prepare for the exciting challenges ahead.",
  },
  {
    text: "I've been feeling really lonely lately, especially since moving to a new city.",
    emotion: "Sad",
    confidence: 88,
    color: "bg-blue-100 text-blue-800",
    icon: Frown,
    response:
      "Moving to a new place can be really challenging, and feeling lonely is completely normal. Let's explore some ways to build connections and create a sense of belonging in your new environment.",
  },
]

export function EmotionDemo() {
  const [selectedExample, setSelectedExample] = useState(0)
  const [userInput, setUserInput] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = () => {
    if (!userInput && !currentExample.text) {
      alert("Please enter some text or select an example first!")
      return
    }

    setIsAnalyzing(true)
    // Simulate API call
    setTimeout(() => {
      setIsAnalyzing(false)
      // You can add more functionality here when backend is ready
    }, 2000)
  }

  const currentExample = emotionExamples[selectedExample]

  return (
    <section id="demo" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">See Emotion Analysis in Action</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Experience how Medichat-AI understands and responds to different emotional states with our interactive
            demonstration.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-cyan-600" />
                  Share Your Thoughts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Try these examples or write your own:
                  </label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {emotionExamples.map((example, index) => (
                      <Button
                        key={index}
                        variant={selectedExample === index ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedExample(index)}
                        className="text-xs"
                      >
                        Example {index + 1}
                      </Button>
                    ))}
                  </div>
                </div>

                <Textarea
                  placeholder="Type how you're feeling or select an example above..."
                  value={userInput || currentExample.text}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="min-h-[120px] resize-none border-slate-200 focus:border-cyan-500"
                />

                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-pulse" />
                      Analyzing Emotions...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Analyze Emotion
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results Section */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Emotion Detection */}
                <div>
                  <h4 className="font-medium text-slate-700 mb-3">Detected Emotion</h4>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${currentExample.color.replace("text-", "bg-").replace("800", "500")} flex items-center justify-center`}
                    >
                      <currentExample.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <Badge className={currentExample.color}>{currentExample.emotion}</Badge>
                      <p className="text-sm text-slate-600 mt-1">Confidence: {currentExample.confidence}%</p>
                    </div>
                  </div>
                </div>

                {/* AI Response */}
                <div>
                  <h4 className="font-medium text-slate-700 mb-3">AI Response</h4>
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-slate-700 leading-relaxed">{currentExample.response}</p>
                  </div>
                </div>

                {/* Suggested Actions */}
                <div>
                  <h4 className="font-medium text-slate-700 mb-3">Suggested Actions</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-transparent"
                      onClick={() => alert("Coping strategies feature coming soon!")}
                    >
                      💭 Explore coping strategies
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-transparent"
                      onClick={() => alert("Mood tracking feature coming soon!")}
                    >
                      📊 Track this mood
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-transparent"
                      onClick={() => alert("Professional connection feature coming soon!")}
                    >
                      🤝 Connect with a professional
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
