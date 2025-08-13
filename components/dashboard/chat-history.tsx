"use client"

import { useState } from "react"
import { useDashboardStore } from "@/lib/store/dashboard-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Filter, Download, Trash2, MessageSquare, Calendar, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

interface ChatHistoryItem {
  _id: string
  title: string
  messageCount: number
  lastMessage: string
  createdAt: string
  updatedAt: string
  emotionTrends: Array<{
    emotion: string
    confidence: number
    timestamp: string
  }>
}

export function ChatHistory() {
  const { conversations, setConversations, setCurrentConversationId, setActiveTab } = useDashboardStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterBy, setFilterBy] = useState<"all" | "recent" | "archived">("all")
  const [sortBy, setSortBy] = useState<"date" | "messages" | "title">("date")
  const [isLoading, setIsLoading] = useState(false)

  const filteredAndSortedConversations = conversations
    .filter((conv) => {
      const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      switch (filterBy) {
        case "recent": {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return matchesSearch && new Date(conv.updatedAt) > weekAgo
        }
        case "archived":
          return matchesSearch && !conv.isActive
        default:
          return matchesSearch
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "messages":
          return (b.messageCount || 0) - (a.messageCount || 0)
        case "title":
          return a.title.localeCompare(b.title)
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })

  const handleExportChat = async (conversationId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/conversations/${conversationId}/export`, {
        credentials: "include",
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `chat-${conversationId}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Chat exported successfully")
      } else {
        toast.error("Failed to export chat")
      }
    } catch (error) {
      console.error("Error exporting chat:", error)
      toast.error("Failed to export chat")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteChat = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (response.ok) {
        const updatedConversations = conversations.filter((conv) => conv._id !== conversationId)
        setConversations(updatedConversations)
        toast.success("Chat deleted successfully")
      } else {
        toast.error("Failed to delete chat")
      }
    } catch (error) {
      console.error("Error deleting chat:", error)
      toast.error("Failed to delete chat")
    }
  }

  const handleViewChat = (conversationId: string) => {
    setCurrentConversationId(conversationId)
    setActiveTab("chat")
  }

  const getEmotionSummary = (emotionTrends: any[]) => {
    if (!emotionTrends || emotionTrends.length === 0) return null
    const emotions = emotionTrends.reduce(
      (acc, trend) => {
        acc[trend.emotion] = (acc[trend.emotion] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    const topEmotion = Object.entries(emotions).sort(([, a], [, b]) => (b as number) - (a as number))[0]
    return topEmotion ? topEmotion[0] : null
  }

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
      sad: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
      anxious: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
      angry: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
      neutral: "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200",
    }
    return colors[emotion] || colors.neutral
  }

  const getEmotionAccentBorder = (emotion: string | null) => {
    const map: Record<string, string> = {
      happy: "border-l-green-300 dark:border-l-green-700",
      sad: "border-l-blue-300 dark:border-l-blue-700",
      anxious: "border-l-yellow-300 dark:border-l-yellow-700",
      angry: "border-l-red-300 dark:border-l-red-700",
      neutral: "border-l-slate-300 dark:border-l-slate-700",
    }
    if (!emotion) return "border-l-slate-200 dark:border-l-slate-700"
    return map[emotion] || "border-l-slate-200 dark:border-l-slate-700"
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/50">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
            Chat History
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
              {filteredAndSortedConversations.length} conversations
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 bg-transparent">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter: {filterBy}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-48">
                <DropdownMenuItem onClick={() => setFilterBy("all")}>All Conversations</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("recent")}>Recent (7 days)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("archived")}>Archived</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 bg-transparent">
                  Sort: {sortBy}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-44">
                <DropdownMenuItem onClick={() => setSortBy("date")}>By Date</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("messages")}>By Messages</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("title")}>By Title</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {filteredAndSortedConversations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No conversations found</h3>
            <p className="text-slate-500 dark:text-slate-400">
              {searchQuery ? "Try adjusting your search terms" : "Start a new conversation to see it here"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAndSortedConversations.map((conversation) => {
              const topEmotion = getEmotionSummary(conversation.emotionTrends || [])
              return (
                <Card
                  key={conversation._id}
                  className={`transition-all duration-200 hover:shadow-lg card-hover border-l-[3px] ${getEmotionAccentBorder(
                    topEmotion,
                  )}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{conversation.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(conversation.updatedAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {conversation.messageCount || 0} messages
                          </div>
                          {topEmotion && (
                            <Badge className={`${getEmotionColor(topEmotion)} rounded-full`}>{topEmotion}</Badge>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-800">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewChat(conversation._id)}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View Chat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportChat(conversation._id)}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteChat(conversation._id)}
                            className="text-red-600 dark:text-red-400 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewChat(conversation._id)}
                          className="hover:border-cyan-300 dark:hover:border-cyan-700"
                        >
                          Open Chat
                        </Button>
                      </div>
                      <div className="text-xs text-slate-400">
                        Last updated:{" "}
                        {new Date(conversation.updatedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
