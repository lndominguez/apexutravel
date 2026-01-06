import { DefaultSession } from 'next-auth'
import { JWT } from 'next-auth/jwt'

// Extender tipos de NextAuth con campos personalizados
declare module 'next-auth' {
  interface User {
    id: string
    role: string
    firstName: string
    lastName: string
    phone?: string
    avatar?: string
    department?: string
    position?: string
    commissionRate: number
    preferences?: {
      theme?: string
      colorScheme?: string
      language?: string
    }
  }

  interface Session {
    user: {
      id: string
      role: string
      firstName: string
      lastName: string
      phone?: string
      avatar?: string
      department?: string
      position?: string
      commissionRate: number
      preferences?: {
        theme?: string
        colorScheme?: string
        language?: string
      }
    } & DefaultSession['user']
  }
}

// Extender tipos de JWT
declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    firstName: string
    lastName: string
    phone?: string
    avatar?: string
    department?: string
    position?: string
    commissionRate: number
    preferences?: {
      theme?: string
      colorScheme?: string
      language?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    firstName: string
    lastName: string
    commissionRate: number
  }
}
