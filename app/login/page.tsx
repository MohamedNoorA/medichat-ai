"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Heart, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useDashboardStore } from "@/lib/store/dashboard-store"

export default function LoginPage() {
  const router = useRouter()
  const { clearAll } = useDashboardStore()
  const formRef = useRef<HTMLFormElement>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Automatic form clearing function
  const clearForm = () => {
    setFormData({
      email: "",
      password: "",
    })
    setShowPassword(false)
    setError("")
    setSuccess("")

    // Clear HTML form elements directly
    if (formRef.current) {
      formRef.current.reset()
    }

    // Clear any browser autofill or cached data
    const inputs = document.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]')
    inputs.forEach((input: any) => {
      input.value = ""
      input.defaultValue = ""
    })
  }

  // Clear all data and form when component mounts
  useEffect(() => {
    console.log("Login page mounted - clearing all user data and form")
    clearAll()

    // Clear localStorage completely
    if (typeof window !== "undefined") {
      localStorage.clear()
      sessionStorage.clear()
    }

    // Clear form immediately
    clearForm()

    // Additional clearing after a brief delay to ensure everything is cleared
    const timeoutId = setTimeout(() => {
      clearForm()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [clearAll])

  // Clear form when user navigates away and comes back
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        clearForm()
      }
    }

    const handleFocus = () => {
      clearForm()
    }

    const handleBeforeUnload = () => {
      clearForm()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  // Clear form when component unmounts
  useEffect(() => {
    return () => {
      clearForm()
    }
  }, [])

  // Auto-clear form periodically when idle
  useEffect(() => {
    let idleTimer: NodeJS.Timeout

    const resetIdleTimer = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        if (!isLoading && !formData.email && !formData.password) {
          clearForm()
        }
      }, 30000) // Clear after 30 seconds of inactivity if form is empty
    }

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"]
    events.forEach((event) => {
      document.addEventListener(event, resetIdleTimer, true)
    })

    resetIdleTimer()

    return () => {
      clearTimeout(idleTimer)
      events.forEach((event) => {
        document.removeEventListener(event, resetIdleTimer, true)
      })
    }
  }, [isLoading, formData.email, formData.password])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (error) setError("")
    if (success) setSuccess("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      console.log("Attempting login for:", formData.email)

      // Ensure we start with a clean slate
      clearAll()

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log("Login response:", response.status, data)

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      setSuccess("Login successful! Redirecting...")
      toast.success("Welcome back!")

      // Clear the form immediately after successful login
      clearForm()

      // Store user data in localStorage (only after successful login)
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(data.user))
      }

      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error) {
      console.error("Login error:", error)
      const errorMessage = error instanceof Error ? error.message : "Login failed"
      setError(errorMessage)
      toast.error(errorMessage)

      // Clear form on error to ensure fresh start for next attempt
      setTimeout(() => {
        clearForm()
      }, 3000)
    } finally {
      setIsLoading(false)
    }
  }

  // Clear form when user clicks on input fields
  const handleInputFocus = () => {
    if (error || success) {
      setError("")
      setSuccess("")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-orange-500/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                <Heart className="w-3 h-3 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
              Medichat-AI
            </h1>
          </div>
          <p className="text-slate-600">Welcome back! Sign in to continue your mental wellness journey</p>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-slate-800">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors"
                  placeholder="Enter your email"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    required
                    className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors"
                    placeholder="Enter your password"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white py-3 rounded-xl font-medium transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Register Link */}
              <div className="text-center pt-4">
                <p className="text-sm text-slate-600">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-cyan-600 hover:text-cyan-700 font-medium" onClick={clearForm}>
                    Create one here
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-400">Developed by Mohamed Noor Adan • Mount Kenya University</p>
        </div>
      </div>
    </div>
  )
}
