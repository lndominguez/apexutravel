import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { z } from 'zod'
import { User } from '@/models/User'
import connectDB from '@/lib/db/mongoose'
import type { NextAuthConfig } from 'next-auth'

// ====================================================================
// CONFIGURACIÓN DE NEXTAUTH V5
// ====================================================================

export const authConfig: NextAuthConfig = {
  // Configuración de seguridad
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  
  // Providers de autenticación
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      
      async authorize(credentials) {
        try {
          // Validar formato de credenciales
          const parsedCredentials = z.object({
            email: z.string().email('Email inválido'),
            password: z.string().min(6, 'Password debe tener al menos 6 caracteres')
          }).safeParse(credentials)

          if (!parsedCredentials.success) {
            console.error('❌ Validación fallida:', parsedCredentials.error.issues)
            return null
          }

          const { email, password } = parsedCredentials.data

          // Conectar a base de datos
          await connectDB()

          // Buscar usuario activo
          const user = await User.findOne({ 
            email: email.toLowerCase().trim(),
            isActive: true 
          }).select('+password')

          if (!user) {
            console.error('❌ Usuario no encontrado o inactivo:', email)
            return null
          }

          // Verificar contraseña
          const isValid = await user.comparePassword(password)
          
          if (!isValid) {
            console.error('❌ Contraseña incorrecta para:', email)
            return null
          }

          // Actualizar último login
          user.lastLogin = new Date()
          await user.save()

          console.log('✅ Login exitoso:', email, '- Rol:', user.role)

          // Retornar datos del usuario para el token JWT
          return {
            id: user._id.toString(),
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phone: user.phone,
            avatar: user.avatar,
            department: user.department,
            position: user.position,
            commissionRate: user.commissionRate,
            preferences: user.preferences
          }

        } catch (error) {
          console.error('❌ Error en authorize():', error)
          return null
        }
      }
    })
  ],

  // Configuración de sesión JWT
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  // Callbacks para manejar tokens y sesiones
  callbacks: {
    // JWT Callback - Se ejecuta cuando se crea o actualiza el token
    async jwt({ token, user, trigger, session }) {
      // En login inicial, agregar datos del usuario al token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.role = user.role
        token.phone = user.phone
        token.avatar = user.avatar
        token.department = user.department
        token.position = user.position
        token.commissionRate = user.commissionRate
        token.preferences = user.preferences
      }

      // Si se llama update() desde el cliente, actualizar datos
      if (trigger === 'update' && session) {
        try {
          await connectDB()
          const dbUser = await User.findById(token.id).select('-password')
          
          if (dbUser) {
            token.firstName = dbUser.firstName
            token.lastName = dbUser.lastName
            token.role = dbUser.role
            token.phone = dbUser.phone
            token.avatar = dbUser.avatar
            token.department = dbUser.department
            token.position = dbUser.position
            token.commissionRate = dbUser.commissionRate
            token.preferences = dbUser.preferences
            
            console.log('🔄 Token actualizado desde DB para:', dbUser.email)
          }
        } catch (error) {
          console.error('❌ Error actualizando token:', error)
        }
      }

      return token
    },

    // Session Callback - Se ejecuta cuando se obtiene la sesión
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.role = token.role as string
        session.user.phone = token.phone as string
        session.user.avatar = token.avatar as string
        session.user.department = token.department as string
        session.user.position = token.position as string
        session.user.commissionRate = token.commissionRate as number
        session.user.preferences = token.preferences as any
      }
      return session
    }
  },

  // Páginas personalizadas
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  // Eventos (opcional, para logging)
  events: {
    async signIn({ user }) {
      console.log('🔐 Usuario inició sesión:', user.email)
    },
    async signOut() {
      console.log('🚪 Usuario cerró sesión')
    }
  }
}

// Exportar handlers y funciones de NextAuth
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
