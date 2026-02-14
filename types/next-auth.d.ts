import { DefaultSession } from 'next-auth';

type SubscriptionStatus = 'ACTIVE' | 'OVERDUE' | 'TEMPORARY_UNBLOCK' | 'BLOCKED'

declare module "next-auth" {
  interface Session {
    accessToken?: string
    user: {
      role?: string | null
      roleDisplayName?: string | null
      homePage?: string | null
      subscriberId?: string | null
      subscriberName?: string | null
      subscriptionStatus?: SubscriptionStatus | null
      isSystemManager: boolean
      isPasswordTemp: boolean
      acceptedTerms?: boolean
      menus?: string[]
      permissions?: string[]
      // 2FA fields
      twoFactorEnabled?: boolean
      twoFactorResetRequired?: boolean
      // Onboarding fields
      onboardingCompleted?: boolean
      // Subscriber Context fields (for System Manager managing a subscriber)
      isSubscriberContext?: boolean
      originalUserId?: string
      originalUserName?: string
    } & DefaultSession["user"]
  }

  interface User {
    role?: string | null
    subscriberId?: string | null
    isSystemManager: boolean
    isPasswordTemp: boolean
    twoFactorEnabled?: boolean
    twoFactorResetRequired?: boolean
    onboardingCompleted?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    role?: string | null
    roleDisplayName?: string | null
    homePage?: string | null
    subscriberId?: string | null
    subscriberName?: string | null
    subscriptionStatus?: SubscriptionStatus | null
    isSystemManager: boolean
    isPasswordTemp: boolean
    acceptedTerms?: boolean
    menus?: string[]
    permissions?: string[]
    // 2FA fields
    twoFactorEnabled?: boolean
    twoFactorResetRequired?: boolean
    // Onboarding fields
    onboardingCompleted?: boolean
  }
}
