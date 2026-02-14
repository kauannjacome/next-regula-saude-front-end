import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Activity } from "lucide-react"

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <img src="/Logo.ico" alt="Regula" className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tight">Regula</span>
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            <Button>Entrar</Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
