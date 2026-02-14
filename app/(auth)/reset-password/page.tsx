// ==========================================
// PÁGINA: REDEFINIR SENHA
// ==========================================
// Esta é a tela onde o usuário cria uma nova senha
// Acesso: Via link enviado por email com token único
// URL: /reset-password?token=ABC123...
// 'use client' = página interativa que roda no navegador

'use client'

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';  // Hooks de navegação e URL
import { useForm } from 'react-hook-form';                     // Gerenciador de formulários
import { zodResolver } from '@hookform/resolvers/zod';         // Integração com validação Zod
import { z } from 'zod';                                       // Biblioteca de validação de dados
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';                                // Notificacoes (toasts)
import { Loader2, Lock, CheckCircle } from 'lucide-react';  // Icones
import Link from 'next/link'
import { PasswordInput, validatePassword, PASSWORD_REQUIREMENTS } from '@/components/shared/password-strength';

// SCHEMA DE VALIDACAO: Define as regras do formulario
// Usando Zod para garantir que os dados estejam corretos
const resetPasswordSchema = z.object({
  password: z.string()
    .min(PASSWORD_REQUIREMENTS.minLength, `Senha deve ter pelo menos ${PASSWORD_REQUIREMENTS.minLength} caracteres`)
    .max(PASSWORD_REQUIREMENTS.maxLength, `Senha deve ter no maximo ${PASSWORD_REQUIREMENTS.maxLength} caracteres`),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  // Validacao customizada: senhas devem ser iguais
  message: 'Senhas nao conferem',
  path: ['confirmPassword'],  // Campo onde o erro sera mostrado
}).refine((data) => validatePassword(data.password).isValid, {
  message: 'Senha nao atende todos os requisitos de seguranca',
  path: ['password'],
})

// TIPO: Extraído automaticamente do schema acima
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

// COMPONENTE DO FORMULÁRIO (dentro de Suspense)
function ResetPasswordForm() {
  // HOOKS DE NAVEGAÇÃO E URL
  const router = useRouter()                  // Para redirecionar usuário
  const searchParams = useSearchParams()      // Para ler parâmetros da URL
  const token = searchParams.get('token')     // Extrair token da URL (?token=ABC123)

  // ESTADOS: Variaveis que quando mudam, atualizam a tela
  const [isLoading, setIsLoading] = useState(false)              // Se esta processando
  const [isSuccess, setIsSuccess] = useState(false)              // Se senha foi alterada com sucesso
  const [passwordValue, setPasswordValue] = useState('')
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('')

  // FORM HOOK: Gerencia o formulario (validacao, erros, etc)
  const { handleSubmit, formState: { errors }, setValue } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema) as any,  // Usar schema Zod para validar
  })

  // Validar senha atual
  const passwordValidation = validatePassword(passwordValue)

  // FUNÇÃO: Executada quando o formulário é enviado
  const onSubmit = async (data: ResetPasswordFormData) => {
    // 1. VALIDAR TOKEN: Se não tem token na URL, não pode continuar
    if (!token) {
      toast.error('Token inválido')
      return
    }

    setIsLoading(true)  // Mostrar loading
    try {
      // 2. IMPORTAR E EXECUTAR FUNÇÃO DO SERVIDOR
      // resetPassword = Server Action que valida token e atualiza senha no banco
      const { resetPassword } = await import('@/lib/actions/auth')
      const result = await resetPassword(token, data.password)

      // 3. SE DEU CERTO
      if (result.success) {
        setIsSuccess(true)            // Mudar para tela de sucesso
        toast.success(result.message) // Mostrar notificação de sucesso

        // Aguardar 2 segundos e redirecionar para login
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        // SE DEU ERRO: Mostrar mensagem (token expirado, etc)
        toast.error(result.message)
      }
    } catch {
      // SE DEU ERRO INESPERADO
      toast.error('Erro ao alterar senha')
    } finally {
      // SEMPRE executado no final (erro ou sucesso)
      setIsLoading(false)  // Esconder loading
    }
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-6">
          <CardTitle className="text-3xl font-bold text-destructive">Link Inválido</CardTitle>
          <CardDescription className="text-base">
            O link de recuperação é inválido ou expirou.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <Link href="/forgot-password">
            <Button className="w-full h-11 text-base font-medium">Solicitar link</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center shadow-md">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">Senha Alterada!</CardTitle>
            <CardDescription className="text-base">
              Sua senha foi alterada com sucesso. Agora você pode fazer login.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <Link href="/login">
            <Button className="w-full h-11 text-base font-medium">Ir para o Login</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shadow-md">
            <Lock className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">Nova Senha</CardTitle>
            <CardDescription className="text-base">
              Crie uma nova senha para sua conta
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Nova Senha</Label>
              <PasswordInput
                id="password"
                value={passwordValue}
                onChange={(value) => {
                  setPasswordValue(value)
                  setValue('password', value)
                }}
                placeholder="Digite sua nova senha"
                showStrength={true}
                disabled={isLoading}
                error={errors.password?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Senha</Label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPasswordValue}
                onChange={(value) => {
                  setConfirmPasswordValue(value)
                  setValue('confirmPassword', value)
                }}
                placeholder="Confirme sua nova senha"
                showStrength={false}
                disabled={isLoading}
                error={errors.confirmPassword?.message || (confirmPasswordValue && passwordValue !== confirmPasswordValue ? 'Senhas nao conferem' : undefined)}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={isLoading || !passwordValidation.isValid || passwordValue !== confirmPasswordValue}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Alterando...
                </>
              ) : (
                'Alterar Senha'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
