import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const homePage = session.user.homePage

  // System Manager sem contexto de assinante vai para admin
  if (session.user.isSystemManager && !session.user.isSubscriberContext) {
    redirect(homePage || '/admin/dashboard')
  }

  // Demais usuarios vao para a homePage configurada na role
  redirect(homePage || '/regulations')
}
