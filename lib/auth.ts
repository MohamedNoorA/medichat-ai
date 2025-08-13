import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare, hash } from "bcryptjs"
import { connectMongoDB } from "@/lib/mongodb"
import { UserModel } from "@/lib/models/User"
import { jwtVerify, SignJWT } from "jose"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null
        }

        try {
          await connectMongoDB()
        } catch (error) {
          console.error("Failed to connect to MongoDB in authorize:", error)
          return null
        }

        const user = await UserModel.findOne({ email: credentials.email })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.username,
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        (session.user as any).id = token.id as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Fix: Simplified token extraction that works with NextRequest
export function extractToken(req: any): string | null {
  // First check Authorization header
  const authHeader = req.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }
  
  // Then check cookies - this is the key fix
  if (req.cookies && req.cookies.get) {
    const cookieToken = req.cookies.get("auth-token")?.value
    if (cookieToken) {
      console.log("Found token in cookies")
      return cookieToken
    }
  }
  
  console.log("No token found in request")
  return null
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    
    console.log("JWT Payload:", payload) // Debug log
    
    // The payload should have 'id' field based on generateToken
    const userId = payload.id
    if (userId && typeof userId === "string") {
      console.log("Successfully extracted userId:", userId)
      return { userId }
    }
    
    console.log("No valid userId found in payload")
    return null
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return hash(password, saltRounds)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await compare(password, hashedPassword)
  } catch (error) {
    console.error("Password verification failed:", error)
    return false
  }
}

export async function generateToken(userId: string): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not defined.")
  }
  const alg = "HS256"
  
  // Use 'id' field to match middleware and verification
  const jwt = await new SignJWT({ id: userId })
    .setProtectedHeader({ alg })
    .setExpirationTime("7d")
    .sign(secret)
  return jwt
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long." }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter." }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter." }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number." }
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: "Password must contain at least one special character." }
  }
  return { valid: true }
}
