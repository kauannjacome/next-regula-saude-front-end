import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home } from 'lucide-react';
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-muted/5 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            <FileQuestion className="h-10 w-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-3xl">404</CardTitle>
          <CardDescription className="text-lg">
            Página Não Encontrada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            A página que você está procurando não existe ou foi movida para outro endereço.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/">
              <Button>
                <Home className="mr-2 h-4 w-4" />
                Ir para Início
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
