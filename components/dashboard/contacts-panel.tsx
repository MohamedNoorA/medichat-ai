"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Heart,
  Shield,
  User,
  Building2,
  Stethoscope,
  MessageCircle,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertTriangle,
  Users,
  Globe,
} from "lucide-react"
import { toast } from "sonner"

export function ContactsPanel() {
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [emailForm, setEmailForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    urgency: "normal",
  })

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label)
      toast.success(`${label} copied to clipboard`)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailForm),
      })
      if (res.ok) {
        toast.success("✅ Message sent successfully!")
        setEmailForm({ name: "", email: "", phone: "", message: "", urgency: "normal" })
      } else {
        toast.error("❌ Failed to send message. Please try again.")
      }
    } catch (err) {
      console.error(err)
      toast.error("❌ Something went wrong.")
    }
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Mental Health Support Contacts
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Professional support and resources available in Kenya</p>
        </div>

        {/* Emergency Contacts */}
        <Card className="border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-5 w-5" />
              Emergency Crisis Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium">Emergency Services</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Police, Fire, Medical</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">999</Badge>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard("999", "Emergency number")}>
                      {copiedText === "Emergency number" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Crisis Text Line</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">24/7 Text Support</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Text HELLO to 741741</Badge>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard("741741", "Crisis text number")}>
                      {copiedText === "Crisis text number" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-pink-600" />
                    <div>
                      <p className="font-medium">Suicide Prevention</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">24/7 Helpline</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">0800 723 253</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard("0800723253", "Suicide prevention hotline")}
                    >
                      {copiedText === "Suicide prevention hotline" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Befrienders Kenya</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Emotional Support</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">0722 178 177</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard("0722178177", "Befrienders Kenya")}
                    >
                      {copiedText === "Befrienders Kenya" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kenyatta National Hospital */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Building2 className="h-5 w-5" />
              Kenyatta National Hospital (KNH)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Hospital Road, Upper Hill
                      <br />
                      P.O. Box 20723-00202
                      <br />
                      Nairobi, Kenya
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium">Contact Numbers</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Main: +254 20 2726300</span>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard("+254202726300", "KNH Main")}>
                          {copiedText === "KNH Main" ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Emergency: +254 20 2726450</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard("+254202726450", "KNH Emergency")}
                        >
                          {copiedText === "KNH Emergency" ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Stethoscope className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium">Mental Health Services</p>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <li>• Psychiatric Consultation</li>
                      <li>• Crisis Intervention</li>
                      <li>• Inpatient Mental Health Care</li>
                      <li>• Outpatient Counseling</li>
                      <li>• Substance Abuse Treatment</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium">Operating Hours</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      24/7 Emergency Services
                      <br />
                      Outpatient: Mon-Fri 8:00 AM - 5:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Therapists */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Users className="h-5 w-5" />
              Professional Therapists & Counselors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  Kenya Association of Professional Counsellors (KAPC)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-green-600" />
                    <span>+254 20 2213820</span>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard("+254202213820", "KAPC")}>
                      {copiedText === "KAPC" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-green-600" />
                    <span>info@kapc.or.ke</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-600" />
                    <a
                      href="https://kapc.or.ke"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline"
                    >
                      www.kapc.or.ke
                      <ExternalLink className="h-3 w-3 inline ml-1" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Chiromo Lane Medical Centre</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span>+254 20 2720000</span>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard("+254202720000", "Chiromo Lane")}>
                      {copiedText === "Chiromo Lane" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span>Chiromo Lane, Westlands</span>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Specialized mental health services</p>
                </div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Nairobi Hospital</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-purple-600" />
                    <span>+254 20 2845000</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard("+254202845000", "Nairobi Hospital")}
                    >
                      {copiedText === "Nairobi Hospital" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    <span>Argwings Kodhek Road</span>
                  </div>
                  <p className="text-xs text-purple-700 dark:text-purple-300">Psychiatric & counseling services</p>
                </div>
              </div>

              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">Mater Hospital</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-orange-600" />
                    <span>+254 20 2531199</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard("+254202531199", "Mater Hospital")}
                    >
                      {copiedText === "Mater Hospital" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    <span>Dunga Road, South B</span>
                  </div>
                  <p className="text-xs text-orange-700 dark:text-orange-300">Mental health & wellness center</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Guidance */}
        <Card className="border-l-4 border-l-cyan-500 bg-gradient-to-r from-cyan-50/50 to-purple-50/50 dark:from-cyan-900/10 dark:to-purple-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
              <User className="h-5 w-5" />
              Personal Guidance & Therapist Referrals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-lg border">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Mohamed Noor Adan</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                MediChat-AI Developer & Mental Health Advocate
                <br />
                Mount Kenya University
              </p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Mail className="h-4 w-4 text-cyan-600" />
                <span className="text-sm font-mono">moharizein09318@gmail.com</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard("moharizein09318@gmail.com", "Developer email")}
                >
                  {copiedText === "Developer email" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Get personalized guidance and help finding the right therapist for your needs. I'm here to support your
                mental health journey.
              </p>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Your Name *
                  </label>
                  <Input
                    required
                    value={emailForm.name}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    required
                    value={emailForm.email}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <Input
                    value={emailForm.phone}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+254 7XX XXX XXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Urgency Level
                  </label>
                  <select
                    value={emailForm.urgency}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, urgency: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
                  >
                    <option value="normal">Normal - General guidance</option>
                    <option value="urgent">Urgent - Need immediate help</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Message *</label>
                <Textarea
                  required
                  rows={4}
                  value={emailForm.message}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Describe your situation and what kind of help you're looking for..."
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Message for Personal Guidance
              </Button>
            </form>

            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              <Shield className="h-4 w-4 inline mr-1" />
              Your information is private and will only be used to provide you with appropriate mental health guidance
              and referrals.
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-slate-600" />
              Additional Mental Health Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900 dark:text-white">Online Resources</h4>
                <div className="space-y-2 text-sm">
                  <a
                    href="https://www.who.int/health-topics/mental-health"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    WHO Mental Health
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href="https://www.mentalhealthkenya.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    Mental Health Kenya
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href="https://basicneedskenya.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    BasicNeeds Kenya
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-slate-900 dark:text-white">Support Groups</h4>
                <div className="space-y-2 text-sm">
                  <p>• Depression Support Groups</p>
                  <p>• Anxiety Management Groups</p>
                  <p>• Addiction Recovery Programs</p>
                  <p>• Family Support Networks</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Contact the facilities above for group meeting schedules
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
