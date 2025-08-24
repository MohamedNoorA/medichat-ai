"use client"

import { useState, useEffect } from "react"
import { useDashboardStore } from "@/lib/store/dashboard-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  MessageSquare,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Edit3,
  History,
  Settings,
  Heart,
  X,
  Menu,
  Brain,
  Phone,
} from "lucide-react"
import { toast } from "sonner"

export function Sidebar() {
  const {
    activeTab,
    setActiveTab,
    conversations,
    currentConversationId,
    setCurrentConversationId,
    addConversation,
    updateConversation,
    setConversations,
    isSidebarOpen,
    setSidebarOpen,
  } = useDashboardStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  // Add keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === "b") {
        event.preventDefault()
        setSidebarOpen(!isSidebarOpen)
      }
      // Escape to close sidebar on mobile
      if (event.key === "Escape" && isSidebarOpen && window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isSidebarOpen, setSidebarOpen])

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleNewChat = async () => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        addConversation(data.conversation)
        setCurrentConversationId(data.conversation._id)
        setActiveTab("chat")
        toast.success("New chat created")
      } else {
        toast.error("Failed to create new chat")
      }
    } catch (error) {
      console.error("Error creating new chat:", error)
      toast.error("Failed to create new chat")
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
        if (currentConversationId === conversationId) setCurrentConversationId(null)
        toast.success("Chat deleted")
      } else {
        toast.error("Failed to delete chat")
      }
    } catch (error) {
      console.error("Error deleting chat:", error)
      toast.error("Failed to delete chat")
    }
  }

  const handleRenameChat = async (conversationId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: newTitle }),
      })
      if (response.ok) {
        updateConversation(conversationId, { title: newTitle })
        setEditingId(null)
        toast.success("Chat renamed")
      } else {
        toast.error("Failed to rename chat")
      }
    } catch (error) {
      console.error("Error renaming chat:", error)
      toast.error("Failed to rename chat")
    }
  }

  const startEditing = (conversation: any) => {
    setEditingId(conversation._id)
    setEditTitle(conversation.title)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditTitle("")
  }

  const saveEdit = (conversationId: string) => {
    if (editTitle.trim()) handleRenameChat(conversationId, editTitle.trim())
    else cancelEditing()
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-screen w-80
          bg-white/85 dark:bg-slate-900/80 backdrop-blur-md
          border-r border-slate-200/70 dark:border-slate-800
          z-50 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          flex flex-col
        `}
        style={{ willChange: "transform" }}
      >
        {/* Title / Menu (always visible) */}
        <div className="p-3 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600" />
            <span className="text-sm font-semibold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
              MediChat AI
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-300"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            title="Close sidebar (Ctrl+B)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Primary navigation */}
        <div className="p-3 border-b border-slate-200/70 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={activeTab === "chat" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("chat")}
              className={`justify-start transition-colors duration-300 ${activeTab === "chat" ? "bg-white dark:bg-slate-800 shadow-sm" : ""}`}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>
            <Button
              variant={activeTab === "insights" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("insights")}
              className={`justify-start transition-colors duration-300 ${activeTab === "insights" ? "bg-white dark:bg-slate-800 shadow-sm" : ""}`}
            >
              <Brain className="h-4 w-4 mr-2" />
              Insights
            </Button>
            <Button
              variant={activeTab === "history" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("history")}
              className={`justify-start transition-colors duration-300 ${activeTab === "history" ? "bg-white dark:bg-slate-800 shadow-sm" : ""}`}
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button
              variant={activeTab === "mood" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("mood")}
              className={`justify-start transition-colors duration-300 ${activeTab === "mood" ? "bg-white dark:bg-slate-800 shadow-sm" : ""}`}
            >
              <Heart className="h-4 w-4 mr-2" />
              Mood
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button
              variant={activeTab === "contacts" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("contacts")}
              className={`justify-start transition-colors duration-300 ${activeTab === "contacts" ? "bg-white dark:bg-slate-800 shadow-sm" : ""}`}
            >
              <Phone className="h-4 w-4 mr-2" />
              Contacts
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("settings")}
              className={`justify-start transition-colors duration-300 ${activeTab === "settings" ? "bg-white dark:bg-slate-800 shadow-sm" : ""}`}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* New chat */}
        <div className="p-3 border-b border-slate-200/70 dark:border-slate-800">
          <Button
            onClick={handleNewChat}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-sm transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-200/70 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 transition-colors duration-300"
              aria-label="Search conversations"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-3 space-y-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {searchQuery ? "No conversations found" : "No conversations yet"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className={`
                    group relative p-3 rounded-xl cursor-pointer transition-all duration-300
                    ring-1
                    ${
                      currentConversationId === conversation._id
                        ? "bg-cyan-50/70 dark:bg-cyan-900/20 ring-cyan-200 dark:ring-cyan-800"
                        : "bg-white/60 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 ring-slate-200/70 dark:ring-slate-700"
                    }
                  `}
                  onClick={() => {
                    setCurrentConversationId(conversation._id)
                    setActiveTab("chat")
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {editingId === conversation._id ? (
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => saveEdit(conversation._id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(conversation._id)
                            else if (e.key === "Escape") cancelEditing()
                          }}
                          className="h-7 text-sm"
                          autoFocus
                        />
                      ) : (
                        <h3 className="font-medium text-slate-900 dark:text-white text-sm truncate">
                          {conversation.title}
                        </h3>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {new Date(conversation.updatedAt).toLocaleDateString()}
                        </p>
                        {conversation.messageCount > 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 rounded-full">
                            {conversation.messageCount}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Conversation actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEditing(conversation)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteChat(conversation._id)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Hamburger toggle button - visible on all screen sizes */}
      {!isSidebarOpen && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-3 top-3 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-slate-200 dark:border-slate-700 shadow-lg transition-all duration-300"
          aria-label="Open sidebar"
          title="Open sidebar (Ctrl+B)"
        >
          <Menu className="w-4 h-4" />
        </Button>
      )}
    </>
  )
}
