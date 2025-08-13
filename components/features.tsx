import { Card, CardContent } from "@/components/ui/card"
import { Brain, MessageSquare, Heart, Shield, Zap, Users, BarChart3, Clock } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "Real-Time Emotion Analysis",
    description:
      "Advanced AI analyzes your text to understand your emotional state with 85%+ accuracy, providing contextually appropriate responses.",
    color: "from-cyan-500 to-cyan-600",
  },
  {
    icon: MessageSquare,
    title: "Intelligent Conversations",
    description:
      "Engage in meaningful, therapeutic conversations powered by GPT-4 and specialized mental health training.",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: Heart,
    title: "Empathetic Support",
    description:
      "Experience compassionate, judgment-free support designed to help you process emotions and develop healthy coping strategies.",
    color: "from-orange-500 to-orange-600",
  },
  {
    icon: Shield,
    title: "HIPAA Compliant",
    description:
      "Your conversations are protected with AES-256 encryption and full HIPAA compliance, ensuring complete confidentiality.",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    icon: Zap,
    title: "Instant Response",
    description:
      "Get immediate support whenever you need it most, with AI responses that adapt to your emotional state in real-time.",
    color: "from-cyan-500 to-purple-600",
  },
  {
    icon: Users,
    title: "Professional Integration",
    description:
      "Seamlessly connect with licensed mental health professionals when you need human support beyond AI assistance.",
    color: "from-purple-500 to-orange-600",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description:
      "Visualize your emotional patterns and mental health journey with detailed analytics and insights over time.",
    color: "from-orange-500 to-emerald-600",
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Access support anytime, anywhere. Your mental health doesn't follow a schedule, and neither do we.",
    color: "from-emerald-500 to-cyan-600",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">Comprehensive AI Mental Health Support</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Medichat-AI combines cutting-edge artificial intelligence with evidence-based therapeutic approaches to
            provide you with personalized, accessible mental health support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-slate-50 to-white"
            >
              <CardContent className="p-6">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
