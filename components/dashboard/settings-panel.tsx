"use client"

import { useState } from "react"
import { useDashboardStore } from "@/lib/store/dashboard-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Lock,
  Palette,
  Download,
  Trash2,
  Shield,
  Moon,
  Sun,
  LogOut,
  Loader2,
  FileText,
  Brain,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function SettingsPanel() {
  const { user, isDarkMode, toggleDarkMode, clearAll, setUser } = useDashboardStore()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [preferences, setPreferences] = useState({
    aiResponseStyle: user?.preferences?.aiResponseStyle || "empathetic",
    notifications: user?.preferences?.notifications ?? true,
    privacyMode: user?.preferences?.privacyMode ?? false,
  })

  const [exportOptions, setExportOptions] = useState({
    includeAnalysis: true,
    includeRecommendations: true,
    includeEmotionalTrends: true,
  })

  const handleProfileUpdate = async () => {
    if (isUpdatingProfile) return

    setIsUpdatingProfile(true)
    try {
      console.log("Updating profile with data:", profileData)

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email,
        }),
      })

      const data = await response.json()
      console.log("Profile update response:", response.status, data)

      if (response.ok) {
        toast.success("Profile updated successfully")

        // Update the user in the store with the new data
        if (data.user) {
          setUser({
            _id: data.user._id,
            name: data.user.username || data.user.name,
            email: data.user.email,
            createdAt: data.user.createdAt,
            preferences: data.user.preferences,
          })
        }
      } else {
        throw new Error(data.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile"
      toast.error(errorMessage)
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handlePasswordChange = async () => {
    if (isChangingPassword) return

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match")
      return
    }

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error("Please fill in all password fields")
      return
    }

    setIsChangingPassword(true)
    try {
      console.log("Changing password...")

      const response = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()
      console.log("Password change response:", response.status, data)

      if (response.ok) {
        toast.success("Password changed successfully")
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        throw new Error(data.error || "Failed to change password")
      }
    } catch (error) {
      console.error("Error changing password:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to change password"
      toast.error(errorMessage)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleExportData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/user/export-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(exportOptions),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `medichat-mental-health-report-${new Date().toISOString().split("T")[0]}.docx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Mental health report exported successfully")
      } else {
        toast.error("Failed to export report")
      }
    } catch (error) {
      console.error("Error exporting report:", error)
      toast.error("Failed to export report")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return
    setIsLoading(true)
    try {
      const response = await fetch("/api/user/delete", { method: "DELETE", credentials: "include" })
      if (response.ok) {
        toast.success("Account deleted successfully")
        clearAll()
        router.push("/")
      } else {
        toast.error("Failed to delete account")
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error("Failed to delete account")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    console.log("=== Starting Logout Process ===")

    try {
      // 1. Clear client-side state immediately
      console.log("Clearing client-side state...")
      clearAll()

      // 2. Clear localStorage
      if (typeof window !== "undefined") {
        console.log("Clearing localStorage...")
        localStorage.removeItem("user")
        localStorage.removeItem("medichat-dashboard")
        localStorage.clear() // Clear everything to be safe
      }

      // 3. Clear sessionStorage
      if (typeof window !== "undefined") {
        console.log("Clearing sessionStorage...")
        sessionStorage.clear()
      }

      // 4. Call logout API to clear server-side cookies
      console.log("Calling logout API...")
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        console.warn("Logout API failed, but continuing with client-side logout")
      }

      // 5. Show success message
      toast.success("Logged out successfully")

      // 6. Force a hard redirect to clear any cached state
      console.log("Redirecting to login...")
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout error:", error)
      // Even if logout API fails, clear client state and redirect
      toast.success("Logged out successfully")
      window.location.href = "/login"
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="hover:border-red-300 bg-transparent"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </>
            )}
          </Button>
        </div>

        {/* Profile */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={isUpdatingProfile}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                  disabled={isUpdatingProfile}
                  placeholder="Enter your email address"
                />
              </div>
            </div>
            <Button
              onClick={handleProfileUpdate}
              disabled={isUpdatingProfile}
              className="bg-gradient-to-r from-cyan-600 to-purple-600 text-white"
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating Profile...
                </>
              ) : (
                "Update Profile"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Password */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                disabled={isChangingPassword}
                placeholder="Enter your current password"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                  disabled={isChangingPassword}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  disabled={isChangingPassword}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Password must be at least 8 characters with uppercase, lowercase, number, and special character.
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={isChangingPassword}
              className="bg-gradient-to-r from-cyan-600 to-purple-600 text-white"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing Password...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Dark Mode</Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">Toggle between light and dark themes</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDarkMode}
                className="flex items-center gap-2 bg-transparent"
                disabled={isLoading}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDarkMode ? "Light" : "Dark"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Preferences */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              AI Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>AI Response Style</Label>
              <Select
                value={preferences.aiResponseStyle}
                onValueChange={(value) => setPreferences((prev) => ({ ...prev, aiResponseStyle: value }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empathetic">Empathetic & Supportive</SelectItem>
                  <SelectItem value="clinical">Clinical & Professional</SelectItem>
                  <SelectItem value="casual">Casual & Friendly</SelectItem>
                  <SelectItem value="direct">Direct & Concise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Notifications</Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Receive notifications for mood check-ins and reminders
                </p>
              </div>
              <Switch
                checked={preferences.notifications}
                onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, notifications: checked }))}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Privacy Mode</Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enhanced privacy settings for sensitive conversations
                </p>
              </div>
              <Switch
                checked={preferences.privacyMode}
                onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, privacyMode: checked }))}
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Mental Health Report
                  </Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Generate a comprehensive Word document with AI analysis, conversation summaries, and therapy
                    recommendations
                  </p>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Report Options</h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm">AI Analysis & Summary</Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Include AI-powered analysis of your conversations and emotional patterns
                    </p>
                  </div>
                  <Switch
                    checked={exportOptions.includeAnalysis}
                    onCheckedChange={(checked) => setExportOptions((prev) => ({ ...prev, includeAnalysis: checked }))}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm">Therapy Recommendations</Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Get AI recommendations on whether professional therapy might be beneficial
                    </p>
                  </div>
                  <Switch
                    checked={exportOptions.includeRecommendations}
                    onCheckedChange={(checked) =>
                      setExportOptions((prev) => ({ ...prev, includeRecommendations: checked }))
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm">Emotional Trends</Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Include charts and analysis of your emotional patterns over time
                    </p>
                  </div>
                  <Switch
                    checked={exportOptions.includeEmotionalTrends}
                    onCheckedChange={(checked) =>
                      setExportOptions((prev) => ({ ...prev, includeEmotionalTrends: checked }))
                    }
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                onClick={handleExportData}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Mental Health Report
                  </>
                )}
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-red-600 dark:text-red-400">Delete Account</Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button onClick={handleDeleteAccount} disabled={isLoading} variant="destructive">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Account Type</span>
              <Badge variant="secondary" className="rounded-full">
                Free Plan
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Member Since</span>
              <span className="text-sm text-slate-900 dark:text-white">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Conversations</span>
              <span className="text-sm text-slate-900 dark:text-white">0</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
