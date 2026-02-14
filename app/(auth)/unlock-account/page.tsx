// ==========================================
// PÁGINA: DESBLOQUEAR CONTA
// ==========================================
// Esta página desbloqueia automaticamente a conta do usuário
// Acesso: Via link enviado por email com token único
// URL: /unlock-account?token=ABC123...
// Processo: Página carrega → Valida token → Desbloqueia → Mostra resultado
// 'use client' = página interativa que roda no navegador

'use client'

import { useState, Suspense, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'  // Hooks de navegação e URL
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'                                // Notificações (toasts)
import { Loader2, CheckCircle, XCircle } from 'lucide-react'  // Ícones
import Link from 'next/link'

// COMPONENTE DO CONTEÚDO (dentro de Suspense)
function UnlockAccountContent() {
  // HOOKS DE NAVEGAÇÃO E URL
  const searchParams = useSearchParams()      // Para ler parâmetros da URL
  const token = searchParams.get('token')     // Extrair token da URL (?token=ABC123)

  // ESTADOS: Variáveis que quando mudam, atualizam a tela
  const [isLoading, setIsLoading] = useState(false)   // Se está processando desbloqueio
  const [isSuccess, setIsSuccess] = useState(false)   // Se desbloqueio foi bem-sucedido
  const [error, setError] = useState('')              // Mensagem de erro (se houver)

  // FUNÇÃO: Processar desbloqueio da conta
  // Esta função é chamada automaticamente pelo useEffect acima
  const handleUnlock = useCallback(async () => {
    // 1. VALIDAR TOKEN: Se não tem token, não pode continuar
    if (!token) {
      setError('Token inválido')
      return
    }

    setIsLoading(true)  // Mostrar tela de loading
    try {
      // 2. IMPORTAR E EXECUTAR FUNÇÃO DO SERVIDOR
      // confirmUnlock = Server Action que valida token e desbloqueia no banco
      const { confirmUnlock } = await import('@/lib/actions/auth')
      const result = await confirmUnlock(token)

      // 3. PROCESSAR RESULTADO
      if (result.success) {
        // SUCESSO: Conta foi desbloqueada
        setIsSuccess(true)            // Mudar para tela de sucesso
        toast.success(result.message) // Mostrar notificação verde
      } else {
        // ERRO: Token inválido, expirado ou outro problema
        setError(result.message)      // Guardar mensagem de erro
        toast.error(result.message)   // Mostrar notificação vermelha
      }
    } catch {
      // SE DEU ERRO INESPERADO
      setError('Erro ao processar desbloqueio')
      toast.error('Erro ao processar desbloqueio')
    } finally {
      // SEMPRE executado no final (erro ou sucesso)
      setIsLoading(false)  // Esconder loading
    }
  }, [token])

  // EFEITO: Executado automaticamente quando a página carrega
  // IMPORTANTE: Desbloqueia automaticamente assim que detecta o token
  useEffect(() => {
    if (token) {
      handleUnlock()  // Se tem token na URL, tentar desbloquear
    }
  }, [token, handleUnlock])  // Executar quando token mudar

  // RENDERIZAÇÃO CONDICIONAL 1: TELA DE ERRO
  // Mostrada quando: não tem token OU deu erro no desbloqueio
  if (!token || error) {
    return (
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-6">
          {/* Ícone X vermelho */}
          <div className="mx-auto h-20 w-20 rounded-full bg-red-100 flex items-center justify-center shadow-md">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-destructive">Erro</CardTitle>
            {/* Mostrar mensagem de erro específica ou genérica */}
            <CardDescription className="text-base">
              {error || 'O link de desbloqueio é inválido ou expirou.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-8">
          {/* Botão: Voltar para Login */}
          <Link href="/login">
            <Button className="w-full h-11 text-base font-medium">Voltar para o Login</Button>
          </Link>
          {/* Botão: Solicitar novo link de desbloqueio */}
          <Link href="/forgot-password" className="block">
            <Button variant="outline" className="w-full h-11 text-base font-medium">Solicitar Novo Link</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // RENDERIZAÇÃO CONDICIONAL 2: TELA DE LOADING
  // Mostrada quando: está processando o desbloqueio
  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-6">
          {/* Ícone de loading girando */}
          <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shadow-md">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">Desbloqueando...</CardTitle>
            <CardDescription className="text-base">
              Aguarde enquanto desbloqueamos sua conta
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    )
  }

  // RENDERIZAÇÃO CONDICIONAL 3: TELA DE SUCESSO
  // Mostrada quando: desbloqueio foi bem-sucedido
  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-6">
          {/* Ícone de check verde */}
          <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center shadow-md">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">Conta Desbloqueada!</CardTitle>
            <CardDescription className="text-base">
              Sua conta foi desbloqueada com sucesso. Agora você pode fazer login normalmente.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          {/* Botão: Ir para tela de login */}
          <Link href="/login">
            <Button className="w-full h-11 text-base font-medium">Ir para o Login</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Se não está em nenhum estado acima, não renderizar nada
  return null
}

// COMPONENTE PRINCIPAL DA PÁGINA (WRAPPER)
// Envolve o conteúdo em Suspense para lidar com carregamento assíncrono
export default function UnlockAccountPage() {
  return (
    // SUSPENSE: Componente do React que mostra fallback enquanto carrega
    // Necessário porque usamos useSearchParams() que é assíncrono
    <Suspense fallback={
      // FALLBACK: O que mostrar enquanto está carregando
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      {/* Componente real com a lógica de desbloqueio */}
      <UnlockAccountContent />
    </Suspense>
  )
}
