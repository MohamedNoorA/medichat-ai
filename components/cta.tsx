"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Shield, Clock, Heart, Bot } from "lucide-react"

export function CTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-cyan-500 via-purple-500 to-orange-500 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>

      <div className="container mx-auto px-4 relative z-10">
        <Card className="max-w-4xl mx-auto border-0 bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              Ready to Transform Your
              <span className="block bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
                Mental Health Journey?
              </span>
            </h2>

            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands who have found support, understanding, and healing through Medichat-AI's intelligent mental
              health conversations and personalized therapeutic guidance.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="flex items-center gap-3 justify-center">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-slate-700 font-medium">100% Private</span>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <span className="text-slate-700 font-medium">24/7 Available</span>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-slate-700 font-medium">AI-Powered Care</span>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              onClick={() => {
                document.getElementById("chat-demo")?.scrollIntoView({ behavior: "smooth" })
              }}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-12 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group text-lg"
            >
              <Bot className="mr-3 w-6 h-6" />
              Start AI Chat Session
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>

            <p className="text-sm text-slate-500 mt-4">No registration required • Try the demo now</p>

            {/* Creator Attribution */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Proudly developed by <span className="font-semibold text-cyan-600">Mohamed Noor Adan</span> •
                BIT/2023/39770 • Mount Kenya University
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Empowering mental wellness through AI innovation and evidence-based therapeutic approaches
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Background Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
    </section>
  )
}
