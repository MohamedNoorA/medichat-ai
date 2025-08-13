"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Video, Headphones, ExternalLink, Filter } from "lucide-react"

const resources = [
  {
    title: "5-Minute Breathing Exercise",
    type: "Exercise",
    category: "Anxiety",
    description: "Simple breathing technique to reduce anxiety and stress in just 5 minutes.",
    icon: Headphones,
    color: "bg-cyan-100 text-cyan-800",
    duration: "5 min",
  },
  {
    title: "Understanding Depression",
    type: "Article",
    category: "Depression",
    description: "Comprehensive guide to recognizing and managing depression symptoms.",
    icon: BookOpen,
    color: "bg-purple-100 text-purple-800",
    duration: "10 min read",
  },
  {
    title: "Sleep Hygiene Tips",
    type: "Guide",
    category: "Sleep",
    description: "Practical tips for better sleep quality and establishing healthy sleep habits.",
    icon: BookOpen,
    color: "bg-emerald-100 text-emerald-800",
    duration: "8 min read",
  },
  {
    title: "Mindfulness Meditation",
    type: "Video",
    category: "Mindfulness",
    description: "Guided meditation session for beginners to practice mindfulness.",
    icon: Video,
    color: "bg-orange-100 text-orange-800",
    duration: "15 min",
  },
  {
    title: "Stress Management Techniques",
    type: "Article",
    category: "Stress",
    description: "Evidence-based strategies for managing and reducing daily stress.",
    icon: BookOpen,
    color: "bg-blue-100 text-blue-800",
    duration: "12 min read",
  },
  {
    title: "Progressive Muscle Relaxation",
    type: "Exercise",
    category: "Relaxation",
    description: "Step-by-step guide to progressive muscle relaxation for tension relief.",
    icon: Headphones,
    color: "bg-pink-100 text-pink-800",
    duration: "20 min",
  },
]

const categories = ["All", "Anxiety", "Depression", "Sleep", "Mindfulness", "Stress", "Relaxation"]

export function Resources() {
  const [selectedCategory, setSelectedCategory] = useState("All")

  const filteredResources =
    selectedCategory === "All" ? resources : resources.filter((resource) => resource.category === selectedCategory)

  return (
    <section id="resources" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">Mental Health Resources</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Explore our curated collection of articles, exercises, and guides to support your mental wellness journey.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          <Filter className="w-5 h-5 text-slate-500 mr-2 mt-2" />
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white" : ""}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredResources.map((resource, index) => (
            <Card
              key={index}
              className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-slate-50 to-white"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex items-center justify-center">
                      <resource.icon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <Badge className={resource.color} variant="secondary">
                        {resource.type}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{resource.duration}</span>
                </div>
                <CardTitle className="text-lg">{resource.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm mb-4 leading-relaxed">{resource.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full group-hover:bg-slate-50 bg-transparent"
                  onClick={() =>
                    alert(`Opening: ${resource.title}\n\nThis would open the actual resource in a real implementation.`)
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Access Resource
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No resources found for the selected category.</p>
          </div>
        )}
      </div>
    </section>
  )
}
