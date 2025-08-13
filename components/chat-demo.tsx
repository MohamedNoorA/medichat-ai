"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Heart, Brain, Loader2, AlertCircle } from "lucide-react"

interface Message {
  id: string
  text: string
  sender: "user" | "ai"
  timestamp: Date
  emotion?: string
  confidence?: number
}

const sampleResponses = [
  {
    triggers: ["hello", "hi", "hey"],
    response: "Hello! I'm here to support you. How are you feeling today? Feel free to share what's on your mind.",
    emotion: "Neutral",
    confidence: 85,
  },
  {
    triggers: ["sad", "depressed", "down", "low"],
    response:
      "I hear that you're feeling sad, and I want you to know that your feelings are valid. It's okay to feel this way sometimes. Can you tell me more about what's been weighing on your mind?",
    emotion: "Sad",
    confidence: 92,
  },
  {
    triggers: ["anxious", "worried", "stress", "panic"],
    response:
      "It sounds like you're experiencing anxiety, which can be really overwhelming. Let's take this one step at a time. Try taking a few deep breaths with me. What's causing you to feel this way?",
    emotion: "Anxious",
    confidence: 89,
  },
  {
    triggers: ["happy", "good", "great", "excited"],
    response:
      "I'm so glad to hear you're feeling positive! It's wonderful when we can recognize and appreciate these good moments. What's been going well for you?",
    emotion: "Happy",
    confidence: 94,
  },
  {
    triggers: ["angry", "mad", "frustrated", "upset"],
    response:
      "I can sense your frustration, and it's completely understandable to feel angry sometimes. These emotions are telling us something important. What's been triggering these feelings?",
    emotion: "Angry",
    confidence: 87,
  },
]

const emotionColors = {
  Neutral: "bg-gray-100 text-gray-800",
  Sad: "bg-blue-100 text-blue-800",
  Anxious: "bg-red-100 text-red-800",
  Happy: "bg-green-100 text-green-800",
  Angry: "bg-orange-100 text-orange-800",
}

export function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm Medichat-AI, your personal mental health companion created by Mohamed Noor Adan. I'm here to listen, understand, and support you through whatever you're experiencing. I use advanced AI to provide empathetic responses tailored to your emotional state. How are you feeling today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null)
  const [currentConfidence, setCurrentConfidence] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = inputText
    setInputText("")
    setIsTyping(true)

    try {
      // Call our Gemini API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          conversationHistory: messages.slice(-10), // Send last 10 messages for context
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      const data = await response.json()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: "ai",
        timestamp: new Date(),
        emotion: data.emotion,
        confidence: data.confidence,
      }

      setMessages((prev) => [...prev, aiMessage])
      setCurrentEmotion(data.emotion)
      setCurrentConfidence(data.confidence)

      // Show crisis alert if detected
      if (data.isCrisis) {
        alert(
          "🚨 Crisis Support Available\n\nIf you're having thoughts of self-harm, please reach out:\n• Call 988 (Suicide & Crisis Lifeline)\n• Text HOME to 741741 (Crisis Text Line)\n• Go to your nearest emergency room\n\nYou are not alone. Help is available.",
        )
      }
    } catch (error) {
      console.error("Error getting AI response:", error)

      // Fallback response if API fails
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please know that I'm here to support you. If this is urgent, please consider reaching out to a crisis helpline at 988.",
        sender: "ai",
        timestamp: new Date(),
        emotion: "neutral",
        confidence: 70,
      }

      setMessages((prev) => [...prev, fallbackMessage])
      setCurrentEmotion("neutral")
      setCurrentConfidence(70)
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <section id="chat-demo" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">Experience AI Mental Health Support</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Try our intelligent chatbot that understands your emotions and provides personalized therapeutic responses.
            This is a demo - the full version will have advanced AI capabilities.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-xl h-[600px] flex flex-col">
                <CardHeader className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-semibold">Medichat-AI</div>
                      <div className="text-sm opacity-90">Your AI Mental Health Companion</div>
                    </div>
                  </CardTitle>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.sender === "ai" && (
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}

                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ${
                          message.sender === "user"
                            ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
                            : "bg-white border border-slate-200"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <div className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>

                      {message.sender === "user" && (
                        <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white border border-slate-200 p-3 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
                          <span className="text-sm text-slate-600">
                            Medichat-AI is thinking and analyzing your emotions...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Input */}
                <div className="p-4 border-t border-slate-200">
                  <div className="flex gap-2">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Share what's on your mind..."
                      className="flex-1 p-3 border border-slate-200 rounded-xl resize-none focus:border-cyan-500 focus:outline-none"
                      rows={2}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputText.trim() || isTyping}
                      className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Analysis Panel */}
            <div className="space-y-6">
              {/* Emotion Analysis */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="w-5 h-5 text-purple-600" />
                    Emotion Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentEmotion ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-cyan-600" />
                        <div>
                          <Badge className={emotionColors[currentEmotion as keyof typeof emotionColors]}>
                            {currentEmotion}
                          </Badge>
                          <p className="text-sm text-slate-600 mt-1">Confidence: {currentConfidence}%</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-sm text-slate-700">
                          The AI detected <strong>{currentEmotion.toLowerCase()}</strong> emotions in your message and
                          tailored its response accordingly.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">Start a conversation to see real-time emotion analysis</p>
                  )}
                </CardContent>
              </Card>

              {/* Features */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">AI Capabilities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Real-time emotion detection</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Contextual responses</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Therapeutic conversation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Crisis detection (Backend needed)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Professional referrals (Backend needed)</span>
                  </div>
                </CardContent>
              </Card>

              {/* Demo Notice */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-800 mb-1">Demo Mode</h4>
                      <p className="text-sm text-orange-700">
                        This is a demonstration. The full version will include advanced AI models, persistent
                        conversations, and professional integration.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
