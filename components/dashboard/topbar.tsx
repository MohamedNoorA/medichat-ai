"use client"

import { Button } from "@/components/ui/button"
import { useDashboardStore } from "@/lib/store/dashboard-store"
import { Brain, Heart, Menu, Settings, LogOut, Moon, Sun, MessageSquare, History, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MobileNav } from "./mobile-nav"
import { useState } from "react"

const tabs = [
  { id: "chat" as const, label: "Chat", icon: MessageSquare },
  { id: "history" as const, label: "History", icon: History },
  { id: "mood" as const, label: "Mood", icon: BarChart3 },
  { id: "settings" as const, label: "Settings", icon: Settings },
]

export function Topbar() {
  const router = useRouter()
  const { user, activeTab, setActiveTab, isDarkMode, toggleDarkMode, isSidebarOpen, setSidebarOpen, clearAll } =
    useDashboardStore()

  const [showMobileNav, setShowMobileNav] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      localStorage.removeItem("user")
      clearAll()
      toast.success("Logged out successfully")
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
      toast.error("Logout failed")
      localStorage.removeItem("user")
      clearAll()
      router.push("/login")
    }
  }

  return (
    <header
      className="
        sticky top-0 z-50 h-16
        bg-white/70 dark:bg-slate-900/60 backdrop-blur-md
        border-b border-slate-200/70 dark:border-slate-800
        supports-[backdrop-filter]:bg-white/55 supports-[backdrop-filter]:dark:bg-slate-900/50
      "
    >
      <div className="mx-auto max-w-7xl h-full px-3 sm:px-4 lg:px-6 flex items-center justify-between">
        {/* Left: Brand + Mobile trigger */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="size-9 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 shadow-sm flex items-center justify-center">
                <Brain className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 size-3 rounded-full bg-gradient-to-br from-orange-400 to-rose-600 grid place-items-center">
                <Heart className="w-2 h-2 text-white" />
              </div>
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
                Medichat-AI
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Your mental wellness companion</div>
            </div>
          </div>
        </div>

        {/* Center: Tabs */}
        <nav
          className="
            hidden md:flex items-center gap-1
            rounded-xl p-1
            bg-slate-100/70 dark:bg-slate-800/70
            ring-1 ring-slate-200/70 dark:ring-slate-700/70
          "
          role="tablist"
          aria-label="Primary"
        >
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`
                flex items-center gap-2 px-3
                rounded-lg transition-all
                ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm"
                    : "hover:bg-white/70 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300"
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden lg:inline text-sm">{tab.label}</span>
            </Button>
          ))}
        </nav>

        {/* Right: Theme + User + Logout */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="hidden sm:flex"
            aria-label="Toggle theme"
            title={isDarkMode ? "Switch to light" : "Switch to dark"}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <span className="truncate max-w-[120px]">Hi, {user?.name?.split(" ")[0] || "User"}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="
              text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400
            "
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav isOpen={showMobileNav} onClose={() => setShowMobileNav(false)} />
    </header>
  )
}
