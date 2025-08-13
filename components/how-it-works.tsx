import { Card, CardContent } from "@/components/ui/card"
import { MessageCircle, Brain, Heart, ArrowRight } from "lucide-react"

const steps = [
  {
    step: 1,
    icon: MessageCircle,
    title: "Start Conversation",
    description:
      "Begin by sharing what's on your mind. Our AI creates a safe, judgment-free space for you to express yourself freely.",
    color: "from-cyan-500 to-cyan-600",
  },
  {
    step: 2,
    icon: Brain,
    title: "AI Analysis & Understanding",
    description:
      "Advanced sentiment analysis and NLP process your words to understand your emotional state, context, and underlying needs with 85%+ accuracy.",
    color: "from-purple-500 to-purple-600",
  },
  {
    step: 3,
    icon: Heart,
    title: "Personalized Support",
    description:
      "Receive tailored therapeutic responses, coping strategies, and professional referrals based on your unique emotional profile and mental health needs.",
    color: "from-orange-500 to-orange-600",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">How Medichat-AI Works</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Our three-step AI-powered process ensures you receive the most effective, personalized mental health support
            tailored to your unique emotional needs and circumstances.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    {/* Step Number */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div
                        className={`w-8 h-8 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white font-bold text-sm`}
                      >
                        {step.step}
                      </div>
                    </div>

                    {/* Icon */}
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <step.icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">{step.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>

                {/* Arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-slate-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
