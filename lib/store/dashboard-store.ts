import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ConversationResponse } from "@/lib/models/Conversation"
import type { MessageResponse } from "@/lib/models/Message"

interface UserData {
  _id: string
  name: string
  email: string
  createdAt: string
  preferences?: {
    aiResponseStyle: string
    notifications: boolean
    privacyMode: boolean
  }
}

interface DashboardState {
  // User state
  user: UserData | null
  setUser: (user: UserData | null) => void

  // Theme state
  isDarkMode: boolean
  toggleDarkMode: () => void

  // Navigation state
  activeTab: "chat" | "history" | "settings" | "mood" | "resources"
  setActiveTab: (tab: "chat" | "history" | "settings" | "mood" | "resources") => void

  // Chat state
  conversations: ConversationResponse[]
  setConversations: (conversations: ConversationResponse[]) => void
  addConversation: (conversation: ConversationResponse) => void
  updateConversation: (id: string, updates: Partial<ConversationResponse>) => void

  currentConversationId: string | null
  setCurrentConversationId: (id: string | null) => void

  messages: MessageResponse[]
  setMessages: (messages: MessageResponse[]) => void
  addMessage: (message: MessageResponse) => void

  // Emotion state
  currentEmotion: string | null
  currentConfidence: number | null
  setEmotion: (emotion: string | null, confidence: number | null) => void

  // UI state
  isTyping: boolean
  setIsTyping: (typing: boolean) => void

  isSidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Authentication state
  isAuthenticated: boolean

  // Clear all data (for logout)
  clearAll: () => void

  // Initialize user data
  initializeUser: () => Promise<void>
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // User state
      user: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      // Theme state
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      // Navigation state
      activeTab: "chat",
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Chat state
      conversations: [],
      setConversations: (conversations) => set({ conversations }),
      addConversation: (conversation) =>
        set((state) => ({
          conversations: [conversation, ...state.conversations],
        })),
      updateConversation: (id, updates) =>
        set((state) => ({
          conversations: state.conversations.map((conv) => (conv._id === id ? { ...conv, ...updates } : conv)),
        })),

      currentConversationId: null,
      setCurrentConversationId: (id) => set({ currentConversationId: id }),

      messages: [],
      setMessages: (messages) => set({ messages: Array.isArray(messages) ? messages : [] }),
      addMessage: (message) =>
        set((state) => ({
          messages: [...(Array.isArray(state.messages) ? state.messages : []), message],
        })),

      // Emotion state
      currentEmotion: null,
      currentConfidence: null,
      setEmotion: (emotion, confidence) =>
        set({
          currentEmotion: emotion,
          currentConfidence: confidence,
        }),

      // UI state
      isTyping: false,
      setIsTyping: (typing) => set({ isTyping: typing }),

      isSidebarOpen: true,
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),

      // Loading states
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),

      // Authentication state
      isAuthenticated: false,

      // Initialize user data
      initializeUser: async () => {
        const { user } = get()
        if (!user) {
          try {
            const response = await fetch("/api/auth/me", {
              credentials: "include",
            })

            if (response.ok) {
              const data = await response.json()
              set({
                user: {
                  _id: data.user._id,
                  name: data.user.username || data.user.name,
                  email: data.user.email,
                  createdAt: data.user.createdAt,
                  preferences: data.user.preferences,
                },
                isAuthenticated: true,
              })
            } else {
              // If auth check fails, clear everything
              console.log("Auth check failed, clearing state")
              get().clearAll()
            }
          } catch (error) {
            console.error("Failed to initialize user:", error)
            get().clearAll()
          }
        }
      },

      // Enhanced clear all data function
      clearAll: () => {
        console.log("Clearing all dashboard state")
        set({
          user: null,
          conversations: [],
          currentConversationId: null,
          messages: [],
          currentEmotion: null,
          currentConfidence: null,
          isTyping: false,
          isLoading: false,
          isAuthenticated: false,
          activeTab: "chat", // Reset to default tab
        })

        // Also clear localStorage to be extra sure
        if (typeof window !== "undefined") {
          localStorage.removeItem("user")
          localStorage.removeItem("medichat-dashboard")
        }
      },
    }),
    {
      name: "medichat-dashboard",
      partialize: (state) => ({
        // Only persist non-sensitive UI preferences
        isDarkMode: state.isDarkMode,
        isSidebarOpen: state.isSidebarOpen,
        // Don't persist user data or auth state to prevent stale data
      }),
      // Add version to force clear old data
      version: 2,
      migrate: (persistedState, version) => {
        // If version is old, return fresh state
        if (version < 2) {
          return {
            user: null,
            isDarkMode: false,
            activeTab: "chat",
            conversations: [],
            currentConversationId: null,
            messages: [],
            currentEmotion: null,
            currentConfidence: null,
            isTyping: false,
            isSidebarOpen: true,
            isLoading: false,
            isAuthenticated: false,
          }
        }
        return persistedState as DashboardState
      },
    },
  ),
)
