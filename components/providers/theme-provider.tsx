"use client"

import type React from "react"

import { useEffect } from "react"
import { useDashboardStore } from "@/lib/store/dashboard-store"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useDashboardStore()

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  return <>{children}</>
}
