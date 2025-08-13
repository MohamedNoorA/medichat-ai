"use client"

import { Button } from "@/components/ui/button"
import { useDashboardStore } from "@/lib/store/dashboard-store"
import { MessageSquare, History, BarChart3, Settings, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const tabs = [
  { id: "chat" as const, label: "Chat", icon: MessageSquare },
  { id: "history" as const, label: "History", icon: History },
  { id: "mood" as const, label: "Mood", icon: BarChart3 },
  { id: "settings" as const, label: "Settings", icon: Settings },
]

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { activeTab, setActiveTab } = useDashboardStore()

  const handleTabSelect = (tabId: typeof activeTab) => {
    setActiveTab(tabId)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 md:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 z-50 md:hidden shadow-2xl"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-cyan-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-wide uppercase">Navigation</h2>
                  <Button variant="ghost" size="icon" onClick={onClose} className="text-white/90 hover:text-white">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Items */}
              <div className="flex-1 p-4">
                <div className="space-y-2">
                  {tabs.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "default" : "ghost"}
                      className={`w-full justify-start h-12 transition-colors ${
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-sm"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      onClick={() => handleTabSelect(tab.id)}
                    >
                      <tab.icon className="w-5 h-5 mr-3" />
                      {tab.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
