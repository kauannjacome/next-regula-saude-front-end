import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Link from 'next/link'

export default async function Home() {
  const session = await auth()

  // Se logado, redirecionar para a homePage da role
  if (session?.user) {
    const homePage = session.user.homePage

    // System Manager sem contexto de assinante vai para admin
    if (session.user.isSystemManager && !session.user.isSubscriberContext) {
      redirect(homePage || '/admin/dashboard')
    }

    // Demais usuarios vao para a homePage configurada na role
    redirect(homePage || '/regulations')
  }

  // Se não logado, mostrar a landing page
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden">
              <img src="/Logo.ico" alt="Regula" className="h-8 w-8 object-contain" />
            </div>
            <span className="text-xl font-bold">Regula</span>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 py-16 text-center max-w-3xl">
          <div className="mx-auto h-24 w-24 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden mb-8">
            <img src="/Logo.ico" alt="Regula" className="h-20 w-20 object-contain" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Regula
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Sistema de Regulação em Saúde
          </p>
          <p className="text-base text-muted-foreground mb-10 max-w-xl mx-auto">
            Plataforma completa para gestão de regulações, agendamentos, cidadãos e unidades de saúde.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          >
            Acessar o Sistema
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Sistema de Regulação em Saúde &mdash; v2.0.0</p>
        </div>
      </footer>
    </div>
  )
}
