import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { HowItWorks } from "@/components/how-it-works"
import { ChatDemo } from "@/components/chat-demo"
import { EmotionDemo } from "@/components/emotion-demo"
import { MoodTracker } from "@/components/mood-tracker"
import { Testimonials } from "@/components/testimonials"
import { Resources } from "@/components/resources"
import { CTA } from "@/components/cta"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Resources />
      <CTA />
      <Footer />
    </main>
  )
}
