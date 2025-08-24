// app/api/contact/route.ts
import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { name, email, phone, urgency, message } = await req.json()

    await resend.emails.send({
      from: "MediChat-AI <onboarding@resend.dev>", // Using Resend's sandbox domain
      to: "moharizein09318@gmail.com", // destination still your Gmail
      subject: urgency === "urgent" ? "🚨 Urgent Mental Health Request" : "New Mental Health Support Request",
      html: `
        <h2>New Contact Form Submission</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Urgency:</b> ${urgency}</p>
        <p><b>Message:</b><br/>${message}</p>
        <hr/>
        <small>Sent from MediChat-AI at ${new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}</small>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Email send error:", error)
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 })
  }
}
