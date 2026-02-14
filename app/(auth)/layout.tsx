import { auth } from '@/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Se já logado, redirecionar para home (exceto /change-password que precisa de sessão)
  if (session?.user?.id) {
    const headerList = await headers()
    const pathname = headerList.get('x-pathname') || ''
    const isChangePassword = pathname.includes('change-password')

    if (!isChangePassword) {
      redirect(session.user.homePage || '/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      {children}
    </div>
  )
}
