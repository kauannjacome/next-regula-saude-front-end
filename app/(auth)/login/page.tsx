// ==========================================
// PÁGINA DE LOGIN
// ==========================================
// Esta é a tela onde o usuário faz login no sistema
// 'use client' = página interativa que roda no navegador

'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form'; // Biblioteca para gerenciar formulários
import { zodResolver } from '@hookform/resolvers/zod'; // Integração com validação Zod
import { signIn } from 'next-auth/react'; // Função de login do NextAuth
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { loginSchema, type LoginFormData } from '@/lib/validators'; // Schema de validação
import { toast } from 'sonner'; // Biblioteca para mostrar notificações
import { Loader2, Eye, EyeOff, Shield, ArrowLeft, Headphones } from 'lucide-react'; // Ícones
import Link from 'next/link'
import { SupportContactModal } from '@/components/auth/support-contact-modal'

// COMPONENTE PRINCIPAL DA PÁGINA
export default function LoginPage() {
  // HOOKS: Funções especiais do React
  const router = useRouter() // Para navegar entre páginas

  // ESTADOS: Variáveis que quando mudam, atualizam a tela
  const [isLoading, setIsLoading] = useState(false)         // Se está fazendo login
  const [showPassword, setShowPassword] = useState(false)   // Se deve mostrar a senha
  const [rememberMe, setRememberMe] = useState(false)       // Se marcou "Lembrar-me"
  const [requires2FA, setRequires2FA] = useState(false)     // Se precisa de código 2FA
  const [twoFactorCode, setTwoFactorCode] = useState('')    // Código 2FA digitado
  const [savedCredentials, setSavedCredentials] = useState<LoginFormData | null>(null) // Credenciais para reenviar com 2FA
  const [showSupportModal, setShowSupportModal] = useState(false) // Modal de suporte
  const enableGoogleAuth = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === 'true'

  // FORM HOOK: Gerencia o formulário (validação, erros, etc)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema) as any, // Usa schema Zod para validar
  })

  // FUNÇÃO: Executada quando o formulário é enviado
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true) // Mostrar loading
    try {
      // 0. Limpar cookies antigos antes do login
      await fetch('/api/auth/cleanup', { method: 'POST' }).catch(() => {})

      // 1. Tentar fazer login usando NextAuth
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        twoFactorCode: '', // Primeiro sem código 2FA
        redirect: false,
      })

      // 2. Se precisa de 2FA
      if (result?.code === '2FA_REQUIRED') {
        setSavedCredentials(data)
        setRequires2FA(true)
        toast.info('Digite o código do Google Authenticator')
        return
      }

      // 3. Se código 2FA inválido
      if (result?.code === '2FA_INVALID_CODE') {
        toast.error('Código de verificação incorreto')
        return
      }

      // 4. Se deu outro erro
      if (result?.error) {
        console.error('[LOGIN] NextAuth error:', result.error, 'code:', result.code, 'status:', result.status)
        if (result.code === 'SUBSCRIPTION_BLOCKED') {
          toast.error('Acesso bloqueado. O assinante está com pagamento pendente. Entre em contato com o administrador.')
        } else if (result.code === 'ACCOUNT_BLOCKED') {
          toast.error('Conta bloqueada. Entre em contato com o administrador.')
        } else if (result.code === 'EMPLOYMENT_PENDING') {
          toast.info('Seu cadastro está aguardando aprovação do administrador.')
        } else if (result.code === 'NO_EMPLOYMENT') {
          toast.error('Você não possui vínculo ativo com nenhuma unidade.')
        } else if (result.error === 'Configuration') {
          toast.error('Erro de configuração do servidor. Verifique o console.')
        } else {
          toast.error('Credenciais inválidas')
        }
        return
      }

      // 5. Se login foi bem-sucedido
      if (result?.ok) {
        toast.success('Login realizado com sucesso!')
        router.replace('/')
        router.refresh()
      }
    } catch {
      toast.error('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // FUNÇÃO: Enviar código 2FA
  const onSubmit2FA = async () => {
    if (!savedCredentials || twoFactorCode.length !== 6) {
      toast.error('Digite os 6 dígitos do código')
      return
    }

    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email: savedCredentials.email,
        password: savedCredentials.password,
        twoFactorCode: twoFactorCode,
        redirect: false,
      })

      if (result?.code === '2FA_INVALID_CODE') {
        toast.error('Código incorreto. Verifique e tente novamente.')
        setTwoFactorCode('')
        return
      }

      if (result?.error) {
        toast.error('Erro na verificação')
        return
      }

      if (result?.ok) {
        toast.success('Login realizado com sucesso!')
        router.replace('/')
        router.refresh()
      }
    } catch {
      toast.error('Erro ao verificar código')
    } finally {
      setIsLoading(false)
    }
  }

  // FUNÇÃO: Voltar para tela de login
  const handleBack = () => {
    setRequires2FA(false)
    setTwoFactorCode('')
    setSavedCredentials(null)
  }

  // Tela de verificação 2FA
  if (requires2FA) {
    return (
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">Verificação em Duas Etapas</CardTitle>
            <CardDescription className="text-base">
              Digite o código de 6 dígitos do Google Authenticator
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="twoFactorCode" className="text-sm font-medium">
                Código de Verificação
              </Label>
              <Input
                id="twoFactorCode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                disabled={isLoading}
                className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
                autoFocus
              />
            </div>

            <Button
              type="button"
              className="w-full h-11 text-base font-medium"
              disabled={isLoading || twoFactorCode.length !== 6}
              onClick={onSubmit2FA}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar'
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleBack}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              Abra o aplicativo <strong>Google Authenticator</strong> no seu celular e digite o código exibido para sua conta.
            </p>
          </div>

          {/* Link para suporte - problemas com 2FA */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
            >
              <Headphones className="h-4 w-4" />
              Perdeu acesso ao autenticador? Solicitar suporte
            </button>
          </div>
        </CardContent>

        {/* Modal de suporte */}
        <SupportContactModal open={showSupportModal} onOpenChange={setShowSupportModal} />
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-4 shadow-lg">
      <CardHeader className="text-center space-y-4 pb-6">
        <div className="mx-auto h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden">
          <img src="/Logo.ico" alt="Regula" className="h-16 w-16 object-contain" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-3xl font-bold">Regula</CardTitle>
          <CardDescription className="text-base">Entre com suas credenciais para acessar o sistema</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pb-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
              disabled={isLoading}
              className="h-11"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                disabled={isLoading}
                className="h-11 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={isLoading}
              />
              <label
                htmlFor="remember"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Lembrar-me
              </label>
            </div>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline font-medium"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>

        {enableGoogleAuth && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={() => signIn('google', { callbackUrl: '/' })}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Login com Google
            </Button>
          </>
        )}

        <div className="mt-6 text-center">
          <Link href="/register" className="text-sm text-primary hover:underline font-medium">
            Não tem conta? Solicitar acesso
          </Link>
        </div>

        <div className="mt-4 pt-4 border-t text-center text-sm text-muted-foreground">
          <p className="font-medium">Sistema de Regulação em Saúde</p>
          <p className="mt-1">v2.0.0</p>
        </div>
      </CardContent>
    </Card>
  )
}
