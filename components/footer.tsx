"use client"

import { Brain, Heart, Mail, MapPin, Phone } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                  <Heart className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Medichat-AI
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed mb-6 max-w-md">
              Empowering mental wellness through AI-powered emotional support, personalized therapeutic conversations,
              and professional guidance.
            </p>
            <div className="text-sm text-slate-400">
              <p className="mb-2">
                Developed with ❤️ by <span className="text-cyan-400 font-medium">Mohamed Noor Adan</span>
              </p>
              <p>Mount Kenya University • Department of Information Technology</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-slate-300 hover:text-cyan-400 transition-colors text-left"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-slate-300 hover:text-cyan-400 transition-colors text-left"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-slate-300 hover:text-cyan-400 transition-colors text-left"
                >
                  Demo
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById("testimonials")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-slate-300 hover:text-cyan-400 transition-colors text-left"
                >
                  Testimonials
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-slate-300">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span className="text-sm">moharizein09318@gmail.com</span>
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <Phone className="w-4 h-4 text-cyan-400" />
                <span className="text-sm">+254 725 803 061</span>
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="text-sm">Nairobi, Kenya</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">
              © 2024 Medichat-AI. All rights reserved. Built for mental wellness.
            </p>
            <div className="flex gap-6 text-sm">
              <button
                onClick={() => alert("Privacy Policy coming soon!")}
                className="text-slate-400 hover:text-cyan-400 transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => alert("Terms of Service coming soon!")}
                className="text-slate-400 hover:text-cyan-400 transition-colors"
              >
                Terms of Service
              </button>
              <button
                onClick={() => alert("Support: moharizein09318@gmail.com")}
                className="text-slate-400 hover:text-cyan-400 transition-colors"
              >
                Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
