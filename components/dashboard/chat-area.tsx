"use client"

import { useState, useRef, useEffect } from "react"
import { useDashboardStore } from "@/lib/store/dashboard-store"
import { MessageBubble } from "./message-bubble"
import { InputBar } from "./input-bar"
import { Button } from "@/components/ui/button"
import { MessageSquare, Heart, Brain, Lightbulb, Sparkles } from "lucide-react"
import { toast } from "sonner"
import type { MessageResponse } from "@/lib/models/Message"

const SUGGESTED = [
  { icon: Heart, title: "Quick grounding", prompt: "Guide me through a 60-second grounding exercise." },
  { icon: Brain, title: "Reframe a thought", prompt: "Help me reframe this negative thought I keep having." },
  { icon: Lightbulb, title: "Mood booster", prompt: "Suggest a 5-minute activity to lift my mood." },
  { icon: Sparkles, title: "Daily check-in", prompt: "Let's do a short mental health check-in." },
]

export function ChatArea() {
  const {
    currentConversationId,
    messages = [],
    setMessages,
    addMessage,
    isTyping,
    setIsTyping,
    setCurrentConversationId,
    addConversation,
    updateConversation,
    user,
    isSidebarOpen,
  } = useDashboardStore()

  const [input, setInput] = useState("")
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    if (currentConversationId) {
      console.log("Loading messages for conversation:", currentConversationId)
      void loadMessages()
    } else {
      console.log("No current conversation, clearing messages")
      setMessages([])
    }
  }, [currentConversationId, setMessages])

  const loadMessages = async () => {
    if (!currentConversationId) return

    setIsLoadingMessages(true)
    try {
      console.log("Fetching messages for conversation:", currentConversationId)
      const response = await fetch(`/api/messages?conversationId=${currentConversationId}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Loaded messages:", data.messages.length)
        setMessages(data.messages || [])
      } else {
        console.error("Failed to load messages:", response.status)
        toast.error("Failed to load conversation messages")
      }
    } catch (error) {
      console.error("Error loading messages:", error)
      toast.error("Failed to load conversation messages")
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return

    let conversationId = currentConversationId

    // Create new conversation if none exists
    if (!conversationId) {
      try {
        const response = await fetch("/api/conversations", { method: "POST", credentials: "include" })
        if (response.ok) {
          const data = await response.json()
          conversationId = data.conversation._id
          setCurrentConversationId(conversationId)
          addConversation(data.conversation)
        } else {
          toast.error("Failed to create conversation")
          return
        }
      } catch (error) {
        console.error("Error creating conversation:", error)
        toast.error("Failed to create conversation")
        return
      }
    }

    // Create user message for immediate display
    const userMessage: MessageResponse = {
      _id: Date.now().toString(),
      conversationId: conversationId || "",
      content: messageText,
      sender: "user",
      timestamp: new Date(),
      userId: user?._id || "",
    }

    addMessage(userMessage)
    setInput("")
    setIsTyping(true)

    try {
      console.log("Sending message to chat API...")
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: messageText, conversationId }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Received AI response")

        // Create AI message for display
        const aiMessage: MessageResponse = {
          _id: (Date.now() + 1).toString(),
          conversationId: conversationId || "",
          content: data.response,
          sender: "ai",
          timestamp: new Date(),
          userId: user?._id || "",
          emotion: data.emotion ? { detected: data.emotion, confidence: data.confidence || 0 } : undefined,
        }

        addMessage(aiMessage)

        // Update conversation title if it was auto-generated
        if (messageText.length <= 50) {
          updateConversation(conversationId || "", { title: messageText })
        }
      } else {
        console.error("Chat API error:", response.status)
        toast.error("Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setIsTyping(false)
    }
  }

  const EmptyState = () => (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className={`w-full text-center transition-all duration-300 ${!isSidebarOpen ? "max-w-4xl" : "max-w-3xl"}`}>
        <div className="mb-7">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome to MediChat-AI</h1>
          <p className="text-slate-600 dark:text-slate-400 text-base">
            Your compassionate AI companion for mental health support
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6">
          {SUGGESTED.map((it) => (
            <Button
              key={it.title}
              variant="outline"
              className="
                group p-5 h-auto text-left
                bg-white/70 dark:bg-slate-800/60 backdrop-blur
                hover:bg-white dark:hover:bg-slate-800
                border-slate-200/70 dark:border-slate-700
                rounded-2xl transition-all duration-300
                hover:shadow-sm hover:scale-[1.02]
              "
              onClick={() => handleSendMessage(it.prompt)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900">
                  <it.icon className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-1">{it.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{it.prompt}</p>
                </div>
              </div>
            </Button>
          ))}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">Or start typing your own message below</p>
      </div>
    </div>
  )

  const Background = () => (
    <div
      className="
        absolute inset-0 -z-10
        bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900
        transition-colors duration-300
      "
      aria-hidden="true"
    />
  )

  // Show empty state if no conversation is selected
  if (!currentConversationId) {
    return (
      <div className="relative flex-1 flex flex-col h-full">
        <Background />
        <EmptyState />
        <div className="sticky bottom-0 bg-white/70 dark:bg-slate-900/60 backdrop-blur border-t border-slate-200 dark:border-slate-800">
          <InputBar value={input} onChange={setInput} onSend={handleSendMessage} disabled={isTyping} />
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex-1 flex flex-col h-full">
      <Background />

      {/* Messages Container - Scrollable area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div
          className={`w-full space-y-4 transition-all duration-300 ${!isSidebarOpen ? "max-w-4xl mx-auto p-6" : "p-3 sm:p-4"}`}
        >
          {isLoadingMessages ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
              <span className="ml-2 text-slate-600 dark:text-slate-400">Loading messages...</span>
            </div>
          ) : (
            <>
              {Array.isArray(messages) &&
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`w-full ${!isSidebarOpen ? "max-w-3xl mx-auto" : ""} transition-all duration-300`}
                  >
                    <MessageBubble
                      message={{
                        _id: message._id,
                        content: message.content,
                        role: message.sender as "user" | "assistant",
                        timestamp:
                          message.timestamp instanceof Date
                            ? message.timestamp.toISOString()
                            : (message.timestamp as any),
                        emotion: message.emotion?.detected || null,
                        confidence: message.emotion?.confidence || null,
                      }}
                    />
                  </div>
                ))}

              {isTyping && (
                <div
                  className={`flex justify-start w-full ${
                    !isSidebarOpen ? "max-w-3xl mx-auto" : ""
                  } transition-all duration-300`}
                >
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3 max-w-xs">
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input Bar Container - Sticky bottom */}
      <div className="sticky bottom-0 bg-white/70 dark:bg-slate-900/60 backdrop-blur border-t border-slate-200 dark:border-slate-800">
        <InputBar value={input} onChange={setInput} onSend={handleSendMessage} disabled={isTyping} />
      </div>
    </div>
  )
}
