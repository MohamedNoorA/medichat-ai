"use client"

import { useEffect, useState } from "react"
import { useDashboardStore } from "@/lib/store/dashboard-store"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ChatArea } from "@/components/dashboard/chat-area"
import { ChatHistory } from "@/components/dashboard/chat-history"
import { SettingsPanel } from "@/components/dashboard/settings-panel"
import { MoodTracking } from "@/components/dashboard/mood-tracking"
import { InsightsDashboard } from "@/components/dashboard/insights-dashboard"
import { ContactsPanel } from "@/components/dashboard/contacts-panel"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { user, setUser, activeTab, setConversations, clearAll, isDarkMode, isSidebarOpen } = useDashboardStore()
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("Dashboard: Initializing...")

        // First, check authentication
        const authResponse = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store", // Prevent caching
        })

        if (!authResponse.ok) {
          console.log("Dashboard: Authentication failed, redirecting to login")
          toast.error("Please log in to access the dashboard")
          clearAll()
          router.push("/login")
          return
        }

        const userData = await authResponse.json()
        console.log("Dashboard: User authenticated:", userData.user.email)

        // Set user data
        setUser({
          _id: userData.user._id,
          name: userData.user.username || userData.user.name,
          email: userData.user.email,
          createdAt: userData.user.createdAt,
          preferences: userData.user.preferences,
        })

        // Load conversations
        try {
          const conversationsResponse = await fetch("/api/conversations", {
            credentials: "include",
            cache: "no-store",
          })
          if (conversationsResponse.ok) {
            const data = await conversationsResponse.json()
            setConversations(data.conversations)
          }
        } catch (convError) {
          console.warn("Failed to load conversations:", convError)
          // Don't fail the whole initialization for this
        }
      } catch (error) {
        console.error("Dashboard init error:", error)
        toast.error("Failed to load dashboard data")
        clearAll()
        router.push("/login")
      } finally {
        setIsInitializing(false)
      }
    }

    initialize()
  }, [setUser, setConversations, router, clearAll])

  const renderTab = () => {
    switch (activeTab) {
      case "chat":
        return <ChatArea />
      case "insights":
        return <InsightsDashboard />
      case "history":
        return <ChatHistory />
      case "settings":
        return <SettingsPanel />
      case "mood":
        return <MoodTracking />
      case "contacts":
        return <ContactsPanel />
      default:
        return <ChatArea />
    }
  }

  // Show loading state during initialization
  if (isInitializing || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors duration-300">
      {/* Sidebar (fixed) */}
      <Sidebar />

      {/* Main area with conditional padding */}
      <div className={`flex-1 flex flex-col ${isSidebarOpen ? "md:pl-80" : "md:pl-0"} transition-all duration-300`}>
        <main className="flex-1 overflow-hidden">{renderTab()}</main>
      </div>
    </div>
  )
}
