'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false} refetchWhenOffline={false}>
      {children}
      <Toaster richColors position="top-right" />
    </SessionProvider>
  )
}
