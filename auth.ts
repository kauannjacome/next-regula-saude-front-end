import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { CredentialsSignin } from "@auth/core/errors"

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

class TwoFactorRequired extends CredentialsSignin {
  code = "2FA_REQUIRED"
}

class TwoFactorInvalid extends CredentialsSignin {
  code = "2FA_INVALID_CODE"
}

class AccountBlocked extends CredentialsSignin {
  code = "ACCOUNT_BLOCKED"
}

class SubscriptionBlocked extends CredentialsSignin {
  code = "SUBSCRIPTION_BLOCKED"
}

class EmploymentPending extends CredentialsSignin {
  code = "EMPLOYMENT_PENDING"
}

class NoEmployment extends CredentialsSignin {
  code = "NO_EMPLOYMENT"
}

const ERROR_CLASS_MAP: Record<string, new () => CredentialsSignin> = {
  '2FA_REQUIRED': TwoFactorRequired,
  '2FA_INVALID_CODE': TwoFactorInvalid,
  'ACCOUNT_BLOCKED': AccountBlocked,
  'SUBSCRIPTION_BLOCKED': SubscriptionBlocked,
  'EMPLOYMENT_PENDING': EmploymentPending,
  'NO_EMPLOYMENT': NoEmployment,
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "Codigo 2FA", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              twoFactorCode: credentials.twoFactorCode || undefined,
            }),
          })

          if (!response.ok) {
            const error = await response.json().catch(() => ({ code: 'UNKNOWN' }))
            const ErrorClass = ERROR_CLASS_MAP[error.code]
            if (ErrorClass) {
              throw new ErrorClass()
            }
            return null
          }

          const data = await response.json()

          // The NestJS backend returns { user, accessToken }
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            isSystemManager: data.user.isSystemManager,
            isPasswordTemp: data.user.isPasswordTemp,
            accessToken: data.accessToken,
            // Session data from backend
            subscriberId: data.user.subscriberId,
            subscriberName: data.user.subscriberName,
            subscriptionStatus: data.user.subscriptionStatus,
            role: data.user.role,
            roleDisplayName: data.user.roleDisplayName,
            homePage: data.user.homePage,
            permissions: data.user.permissions,
            menus: data.user.menus,
            acceptedTerms: data.user.acceptedTerms,
            twoFactorEnabled: data.user.twoFactorEnabled,
            twoFactorResetRequired: data.user.twoFactorResetRequired,
          }
        } catch (error) {
          if (error instanceof CredentialsSignin) {
            throw error
          }
          console.error('[AUTH] Login error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Initial sign in - store all data from backend
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.accessToken = (user as any).accessToken
        token.isSystemManager = (user as any).isSystemManager
        token.isPasswordTemp = (user as any).isPasswordTemp
        token.subscriberId = (user as any).subscriberId
        token.subscriberName = (user as any).subscriberName
        token.subscriptionStatus = (user as any).subscriptionStatus
        token.role = (user as any).role
        token.roleDisplayName = (user as any).roleDisplayName
        token.homePage = (user as any).homePage
        token.permissions = (user as any).permissions
        token.menus = (user as any).menus
        token.acceptedTerms = (user as any).acceptedTerms
        token.twoFactorEnabled = (user as any).twoFactorEnabled
        token.twoFactorResetRequired = (user as any).twoFactorResetRequired
      }

      return token
    },

    async session({ session, token }) {
      // Check subscriber context cookie (for system manager impersonation)
      try {
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        const contextCookie = cookieStore.get('subscriber-context')

        if (contextCookie?.value) {
          const contextData = JSON.parse(contextCookie.value)

          session.user = {
            ...session.user,
            id: token.id as string,
            email: token.email as string,
            name: token.name as string,
            role: 'SYSTEM_MANAGER',
            roleDisplayName: 'System Manager',
            homePage: '/municipal-dashboard',
            subscriberId: String(contextData.subscriberId),
            subscriberName: contextData.subscriberName,
            subscriptionStatus: contextData.subscriptionStatus,
            isSystemManager: true,
            isSubscriberContext: true,
            originalUserId: contextData.originalUserId,
            originalUserName: contextData.originalUserName,
            menus: [
              'municipal-dashboard', 'regulations', 'citizens',
              'schedules', 'suppliers', 'units', 'users', 'folders',
              'care', 'whatsapp', 'reports', 'settings', 'tenant-settings', 'audit'
            ],
            permissions: ['*'],
          }
          // Pass accessToken to session for API calls
          ;(session as any).accessToken = token.accessToken
          return session
        }
      } catch {
        // Cookie not available or parsing error
      }

      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as any
        session.user.roleDisplayName = token.roleDisplayName as string
        session.user.homePage = token.homePage as string
        session.user.isSystemManager = token.isSystemManager as boolean
        session.user.isPasswordTemp = token.isPasswordTemp as boolean
        session.user.acceptedTerms = token.acceptedTerms as boolean
        session.user.menus = token.menus as string[]
        session.user.permissions = token.permissions as string[]
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean
        session.user.twoFactorResetRequired = token.twoFactorResetRequired as boolean

        if (token.subscriberId) {
          session.user.subscriberId = String(token.subscriberId)
          session.user.subscriberName = token.subscriberName as string
          session.user.subscriptionStatus = token.subscriptionStatus as any
        }
      }

      // Pass accessToken to session for API calls
      ;(session as any).accessToken = token.accessToken

      return session
    }
  }
})
