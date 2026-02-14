import Link from "next/link"

export function PublicFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t bg-background py-6 md:py-0">
      <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row h-16 items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground text-center md:text-left">
          &copy; {currentYear} Regula. Todos os direitos reservados.
        </p>
        <nav className="flex gap-4 sm:gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/terms" className="hover:underline hover:text-foreground transition-colors">
            Termos de Uso
          </Link>
          <Link href="/privacy" className="hover:underline hover:text-foreground transition-colors">
            Política de Privacidade
          </Link>
        </nav>
      </div>
    </footer>
  )
}
