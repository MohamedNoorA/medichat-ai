"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Brain, Menu, X, Heart, User } from "lucide-react" // Removed Settings icon as it's now in dashboard

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // Removed showProfile and showSettings states as these modals are now handled within the dashboard
  // const [showProfile, setShowProfile] = useState(false)
  // const [showSettings, setShowSettings] = useState(false)

  const navigation = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    // { name: "Chat Demo", href: "#chat-demo" }, // Removed from landing page nav
    { name: "Resources", href: "#resources" },
    { name: "Testimonials", href: "#testimonials" },
  ]

  // Helper function for smooth scrolling to sections on the landing page
  const handleNavClick = (href: string) => {
    const element = document.getElementById(href.replace("#", ""))
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMenuOpen(false) // Close mobile menu after clicking
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                  <Heart className="w-2 h-2 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
                Medichat-AI
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className="text-slate-600 hover:text-cyan-600 transition-colors duration-200 font-medium cursor-pointer"
                >
                  {item.name}
                </button>
              ))}
            </nav>

            {/* Desktop Action Buttons (Login/Sign Up) */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = "/login")} // Direct link to login page
                className="flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Login
              </Button>
              <Button
                size="sm"
                onClick={() => (window.location.href = "/register")} // Direct link to register page
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
              >
                <Heart className="w-4 h-4" />
                Sign Up
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6 text-slate-600" /> : <Menu className="w-6 h-6 text-slate-600" />}
            </button>
          </div>

          {/* Mobile Menu Content */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-200">
              <nav className="flex flex-col gap-4">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item.href)}
                    className="text-slate-600 hover:text-cyan-600 transition-colors duration-200 font-medium py-2 text-left"
                  >
                    {item.name}
                  </button>
                ))}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = "/login")} // Direct link to login page
                    className="flex items-center gap-2 flex-1"
                  >
                    <User className="w-4 h-4" />
                    Login
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => (window.location.href = "/register")} // Direct link to register page
                    className="flex items-center gap-2 flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
                  >
                    <Heart className="w-4 h-4" />
                    Sign Up
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
      {/* Removed Profile and Settings Modals as they are now part of the dashboard */}
    </>
  )
}
