"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useDashboardStore } from "@/lib/store/dashboard-store"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const { user, setUser, clearAll } = useDashboardStore()

  const isAuthenticated = !!user

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setUser({
          _id: data.user._id,
          name: data.user.username || data.user.name,
          email: data.user.email,
          createdAt: data.user.createdAt,
          preferences: data.user.preferences,
        })
      } else {
        // Clear user data if auth check fails
        setUser(null)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser({
          _id: data.user._id,
          name: data.user.username || data.user.name,
          email: data.user.email,
          createdAt: data.user.createdAt,
          preferences: data.user.preferences,
        })
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Network error. Please try again." }
    }
  }

  const logout = () => {
    ;(async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
      } catch (e) {
        // ignore network errors; we’ll still clear client state
        console.error("Logout request failed:", e)
      } finally {
        clearAll()
        // Hard redirect to ensure all state is reset
        window.location.href = "/login"
      }
    })()
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
