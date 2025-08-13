"use client"

import { Badge } from "@/components/ui/badge"
import { User, Bot, Heart } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  message: {
    _id: string
    content: string
    role: "user" | "assistant"
    timestamp: string
    emotion?: string | null
    confidence?: number | null
  }
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy:
        "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border border-green-200/60 dark:border-green-800/50",
      sad: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border border-blue-200/60 dark:border-blue-800/50",
      anxious:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 border border-yellow-200/60 dark:border-yellow-800/50",
      angry:
        "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 border border-red-200/60 dark:border-red-800/50",
      neutral:
        "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60",
    }
    return colors[emotion] || colors.neutral
  }

  return (
    <div
      className={cn(
        "flex gap-3 max-w-4xl w-full animate-fade-in",
        isUser ? "justify-end ml-12" : "justify-start mr-12",
      )}
    >
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-sm ring-1 ring-white/60 dark:ring-slate-900/40">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}

      {/* Message Content */}
      <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
        {/* Bubble */}
        <div
          className={cn(
            "px-4 py-3 rounded-2xl max-w-[min(80vw,740px)] break-words shadow-sm",
            isUser
              ? "text-white rounded-br-md bg-gradient-to-tr from-cyan-600 to-purple-600 ring-1 ring-white/10"
              : "text-slate-900 dark:text-white rounded-bl-md bg-white/80 dark:bg-slate-800/70 backdrop-blur border border-slate-200/70 dark:border-slate-700",
          )}
        >
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap selection:bg-cyan-200/50 dark:selection:bg-cyan-400/30">
            {message.content}
          </p>
        </div>

        {/* Metadata */}
        <div
          className={cn(
            "flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400",
            isUser ? "flex-row-reverse pr-1" : "flex-row pl-1",
          )}
        >
          <span className="tabular-nums">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>

          {/* Emotion Badge for AI messages */}
          {isAssistant && message.emotion && (
            <Badge
              className={cn(
                "text-[11px] px-2 py-0.5 gap-1.5 capitalize rounded-full",
                "shadow-sm",
                getEmotionColor(message.emotion),
              )}
            >
              <Heart className="h-3 w-3 opacity-80" />
              <span>{message.emotion}</span>
              {typeof message.confidence === "number" && (
                <span className="opacity-70">{`(${Math.round(message.confidence * 100)}%)`}</span>
              )}
            </Badge>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shadow-sm ring-1 ring-white/60 dark:ring-slate-900/40">
          <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        </div>
      )}
    </div>
  )
}
