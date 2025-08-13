"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Heart, MessageCircle, Brain, Bot } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-orange-500/10 pt-20 pb-16">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                <Heart className="w-3 h-3 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
              Medichat-AI
            </h1>
          </div>

          {/* Main Headline */}
          <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight">
            Your AI-Powered
            <span className="block bg-gradient-to-r from-cyan-500 via-purple-500 to-orange-500 bg-clip-text text-transparent">
              Mental Health Companion
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Experience personalized emotional support through intelligent conversations, real-time sentiment analysis,
            and professional therapeutic guidance - available 24/7 whenever you need it most.
          </p>

          {/* Creator Credit */}
          <div className="mb-8 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 inline-block">
            <p className="text-sm text-slate-600">
              Developed with ❤️ by <span className="font-semibold text-cyan-600">Mohamed Noor Adan</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Mount Kenya University • BIT/2023/39770</p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              size="lg"
              onClick={() => (window.location.href = "/register")}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <Bot className="mr-2 w-5 h-5" />
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => (window.location.href = "/login")}
              className="border-2 border-slate-300 hover:border-cyan-500 px-8 py-4 rounded-2xl transition-all duration-300 bg-transparent"
            >
              <MessageCircle className="mr-2 w-5 h-5" />
              Sign In
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600 mb-2">24/7</div>
              <div className="text-slate-600">AI Support</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">85%+</div>
              <div className="text-slate-600">Emotion Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">100%</div>
              <div className="text-slate-600">Private & Secure</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-purple-400/20 rounded-full blur-xl"></div>
    </section>
  )
}
