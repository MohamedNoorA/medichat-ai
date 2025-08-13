"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useDashboardStore } from "@/lib/store/dashboard-store"
import { Paperclip, Mic, Square, Sparkles, ImageIcon, Send, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import type { MessageResponse } from "@/lib/models/Message"

interface InputBarProps {
  value?: string
  onChange?: (value: string) => void
  onSend?: (messageText: string) => Promise<void>
  disabled?: boolean
  placeholder?: string
}

const HINT_CHIPS = [
  "Give me a quick grounding exercise",
  "Help me reframe a negative thought",
  "I feel overwhelmed—what can I do now?",
  "Suggest a mindful 2-minute break",
]

export function InputBar({
  value: externalValue,
  onChange: externalOnChange,
  onSend: externalOnSend,
  disabled: externalDisabled,
  placeholder: externalPlaceholder,
}: InputBarProps = {}) {
  const [internalInputText, setInternalInputText] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isExpanding, setIsExpanding] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const inputText = externalValue !== undefined ? externalValue : internalInputText
  const setInputText = externalOnChange || setInternalInputText
  const isDisabled = externalDisabled ?? false
  const placeholder = externalPlaceholder || "Message Medichat-AI…"

  const {
    currentConversationId,
    user,
    messages,
    addMessage,
    setMessages,
    isTyping,
    setIsTyping,
    setEmotion,
    updateConversation,
    addConversation,
    setCurrentConversationId,
  } = useDashboardStore()

  // Smooth autoresize
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "0px"
    const scrollHeight = textarea.scrollHeight
    const maxHeight = 240
    textarea.style.height = Math.min(scrollHeight, maxHeight) + "px"
    setIsExpanding(scrollHeight > maxHeight)
  }, [inputText])

  // Deep-link support for suggestedPrompt events
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<string>
      setInputText(custom.detail)
      textareaRef.current?.focus()
    }
    window.addEventListener("suggestedPrompt", handler as EventListener)
    return () => window.removeEventListener("suggestedPrompt", handler as EventListener)
  }, [setInputText])

  const createNewConversation = async (): Promise<string | null> => {
    setIsTyping(true)
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
      if (!res.ok) throw new Error((await res.json())?.error || "Failed to create chat")
      const data = await res.json()
      addConversation(data.conversation)
      setCurrentConversationId(data.conversation._id)
      setMessages([])
      return data.conversation._id
    } catch (e) {
      console.error(e)
      toast.error("Unable to start a new conversation")
      return null
    } finally {
      setIsTyping(false)
    }
  }

  const handleSend = async () => {
    if (!inputText.trim() || isTyping || isDisabled) return

    if (externalOnSend) {
      await externalOnSend(inputText.trim())
      return
    }

    let conversationId: string | null = currentConversationId
    if (!conversationId) {
      conversationId = await createNewConversation()
      if (!conversationId) return
    }

    const userMessage: MessageResponse = {
      _id: Date.now().toString(),
      content: inputText.trim(),
      sender: "user",
      timestamp: new Date(),
      conversationId,
      userId: user?._id || "",
    }

    addMessage(userMessage)
    const prompt = inputText
    setInputText("")
    setIsTyping(true)

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          conversationId,
          content: userMessage.content,
          sender: "user",
        }),
      })

      const aiRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: prompt,
          conversationHistory: messages.slice(-10),
        }),
      })

      if (!aiRes.ok) {
        if (aiRes.status === 401) {
          toast.error("Session expired. Please log in again.")
          return
        }
        throw new Error("Failed to get AI response")
      }

      const aiData = await aiRes.json()
      const aiMessage: MessageResponse = {
        _id: (Date.now() + 1).toString(),
        content: aiData.response,
        sender: "ai",
        timestamp: new Date(),
        conversationId,
        userId: user?._id || "",
        emotion: aiData.emotion ? { detected: aiData.emotion, confidence: aiData.confidence || 0 } : undefined,
        aiResponse: {
          model: "gemini-1.5-flash",
          processingTime: 0,
          isCrisis: aiData.isCrisis || false,
        },
      }

      addMessage(aiMessage)
      setEmotion(aiData.emotion, aiData.confidence)

      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          conversationId,
          content: aiMessage.content,
          sender: "ai",
          emotion: aiData.emotion,
          confidence: aiData.confidence,
          aiResponse: aiMessage.aiResponse,
        }),
      })

      updateConversation(conversationId, {
        updatedAt: new Date(),
        messageCount: messages.length + 2,
      })
    } catch (e) {
      console.error(e)
      toast.error("Failed to send message")
      addMessage({
        _id: (Date.now() + 2).toString(),
        content:
          "I'm having trouble responding right now. If you need urgent help, call 988 (Suicide & Crisis Lifeline).",
        sender: "ai",
        timestamp: new Date(),
        conversationId: currentConversationId || "",
        userId: user?._id || "",
        emotion: { detected: "neutral", confidence: 70 },
      })
      setEmotion("neutral", 70)
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const toggleRecording = () => setIsRecording((v) => !v)

  return (
    <div className="w-full flex justify-center px-4 pb-6">
      <div className="w-full max-w-4xl">
        {/* Hint chips (hide while typing) */}
        {inputText.trim().length === 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4 px-3">
            {HINT_CHIPS.map((hint) => (
              <button
                key={hint}
                type="button"
                onClick={() => setInputText(hint)}
                className="
                  text-xs md:text-sm rounded-full px-3 py-1.5
                  bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700
                  border border-slate-200 dark:border-slate-700
                  text-slate-700 dark:text-slate-200 transition-all duration-200
                  hover:shadow-sm hover:scale-105 active:scale-95
                "
                aria-label={`Use hint: ${hint}`}
              >
                <Sparkles className="inline-block w-3.5 h-3.5 mr-1 text-cyan-500" />
                {hint}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSend()
          }}
          className="w-full"
        >
          <div
            className="
              relative w-full max-w-3xl mx-auto
              rounded-3xl border border-slate-200 dark:border-slate-700
              bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm
              shadow-lg hover:shadow-xl focus-within:shadow-xl 
              transition-all duration-300
            "
          >
            {/* Utilities row */}
            <div className="flex items-center gap-1 px-4 pt-3 text-slate-500 dark:text-slate-400">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="New prompt section"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Insert image"
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
              <div className="ml-auto text-[11px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {inputText.length} chars
                {isExpanding && <span className="ml-1 opacity-70">(scroll)</span>}
              </div>
            </div>

            {/* Textarea + mic + send */}
            <div className="flex items-end gap-3 p-4 pt-2">
              <Textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={placeholder}
                disabled={isTyping || isDisabled}
                rows={1}
                className="
                  flex-1 min-h-[48px] max-h-[240px] resize-none border-0 bg-transparent
                  text-base leading-6 placeholder:text-slate-400 dark:placeholder:text-slate-500
                  focus-visible:ring-0 focus-visible:ring-offset-0 px-0
                  scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600
                "
                aria-label="Message input"
              />

              <div className="flex items-center gap-2 pb-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleRecording}
                  disabled={isTyping || isDisabled}
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
                  title={isRecording ? "Stop recording" : "Start recording"}
                  className={`h-10 w-10 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                    isRecording ? "text-rose-500" : ""
                  }`}
                >
                  {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>

                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputText.trim() || isTyping || isDisabled}
                  className="
                    h-11 w-11 rounded-full
                    bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700
                    disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-700 dark:disabled:to-slate-600
                    text-white shadow-lg hover:shadow-xl
                    transition-all duration-200 transform hover:scale-105 active:scale-95
                  "
                  aria-label="Send message"
                  title="Send message"
                >
                  {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-center text-slate-500 dark:text-slate-400 max-w-3xl mx-auto">
            Press{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-700">
              Enter
            </kbd>{" "}
            to send •{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-700 ml-1">
              Shift+Enter
            </kbd>{" "}
            for new line
          </div>
        </form>
      </div>
    </div>
  )
}
