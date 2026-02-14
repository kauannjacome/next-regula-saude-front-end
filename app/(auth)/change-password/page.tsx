// ==========================================
// PÁGINA: ALTERAR SENHA (LOGADO)
// ==========================================
// Esta é a tela onde o usuário LOGADO altera sua senha
// Diferente de reset-password (que usa token por email)
// Esta página requer: senha atual, nova senha e confirmação
// Usado para: trocar senha temporária OU trocar senha por vontade própria
// 'use client' = página interativa que roda no navegador

'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';              // Hook de navegação
import { useSession, signOut } from 'next-auth/react';   // Hooks de autenticação
import { useForm } from 'react-hook-form';               // Gerenciador de formulários
import { zodResolver } from '@hookform/resolvers/zod';   // Integração com validação Zod
import { z } from 'zod';                                 // Biblioteca de validação de dados
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';                          // Notificacoes (toasts)
import { Loader2, Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';  // Icones
import { PasswordInput, validatePassword, PASSWORD_REQUIREMENTS } from '@/components/shared/password-strength';

// SCHEMA DE VALIDACAO: Define as regras do formulario
// Usando Zod para garantir que os dados estejam corretos
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual e obrigatoria'),
  newPassword: z.string()
    .min(PASSWORD_REQUIREMENTS.minLength, `Nova senha deve ter pelo menos ${PASSWORD_REQUIREMENTS.minLength} caracteres`)
    .max(PASSWORD_REQUIREMENTS.maxLength, `Nova senha deve ter no maximo ${PASSWORD_REQUIREMENTS.maxLength} caracteres`),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  // Validacao customizada 1: Nova senha e confirmacao devem ser iguais
  message: 'Senhas nao conferem',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  // Validacao customizada 2: Nova senha deve ser diferente da atual
  message: 'A nova senha deve ser diferente da senha atual',
  path: ['newPassword'],
}).refine((data) => validatePassword(data.newPassword).isValid, {
  message: 'Senha nao atende todos os requisitos de seguranca',
  path: ['newPassword'],
})

// TIPO: Extraído automaticamente do schema acima
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

// COMPONENTE PRINCIPAL DA PÁGINA
export default function ChangePasswordPage() {
  // HOOKS DE NAVEGAÇÃO E SESSÃO
  const router = useRouter()                              // Para redirecionar usuário
  const { data: session, status, update } = useSession() // Dados da sessão (usuário logado)
  // session = dados do usuário, status = 'loading'|'authenticated'|'unauthenticated'
  // update = função para atualizar a sessão

  // ESTADOS: Variaveis que quando mudam, atualizam a tela
  const [isLoading, setIsLoading] = useState(false)              // Se esta processando
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)        // Mostrar senha atual
  const [currentPasswordValue, setCurrentPasswordValue] = useState('')
  const [newPasswordValue, setNewPasswordValue] = useState('')
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('')

  // FORM HOOK: Gerencia o formulario (validacao, erros, etc)
  const { handleSubmit, formState: { errors }, setValue } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema) as any,  // Usar schema Zod para validar
  })

  // Validar nova senha
  const newPasswordValidation = validatePassword(newPasswordValue)

  // EFEITO: Verificar se usuário está autenticado
  // Se não está logado, redirecionar para login
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])  // Executar sempre que status mudar

  // FUNÇÃO: Executada quando o formulário é enviado
  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true)  // Mostrar loading
    try {
      // 1. FAZER REQUISIÇÃO PARA API DE TROCA DE SENHA
      // POST /api/auth/change-password com senha atual e nova senha
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      // 2. PROCESSAR RESPOSTA
      const result = await response.json()

      // Se API retornou erro (401, 400, 500, etc)
      if (!response.ok) {
        toast.error(result.message || 'Erro ao alterar senha')
        return
      }

      // 3. SUCESSO!
      toast.success('Senha alterada com sucesso!')

      // Atualizar sessão para remover flag isPasswordTemp
      // Isso evita que usuário seja redirecionado de volta para esta página
      await update()

      // Aguardar 1.5 segundos e redirecionar para home
      setTimeout(() => {
        router.push('/')
        router.refresh()  // Forçar atualização da página
      }, 1500)
    } catch {
      // SE DEU ERRO INESPERADO
      toast.error('Erro ao alterar senha')
    } finally {
      // SEMPRE executado no final (erro ou sucesso)
      setIsLoading(false)  // Esconder loading
    }
  }

  const handleLogout = async () => {
    // Limpar cookies de sessão antes de deslogar
    await fetch('/api/auth/cleanup', { method: 'POST' }).catch(() => {})
    await signOut({ callbackUrl: '/login' })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const isPasswordTemp = session?.user?.isPasswordTemp

  return (
    <Card className="w-full max-w-md mx-4 shadow-lg">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center">
          {isPasswordTemp ? (
            <AlertCircle className="h-10 w-10 text-orange-600" />
          ) : (
            <Lock className="h-10 w-10 text-primary" />
          )}
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl">
            {isPasswordTemp ? 'Alterar Senha Temporária' : 'Alterar Senha'}
          </CardTitle>
          <CardDescription>
            {isPasswordTemp ? (
              <>
                Sua senha atual é temporária. Por favor, escolha uma nova senha segura
                para continuar usando o sistema.
              </>
            ) : (
              'Crie uma nova senha para sua conta'
            )}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isPasswordTemp && (
          <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-900 rounded-lg p-4">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              ⚠️ Você deve alterar sua senha temporária antes de continuar
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Digite sua senha atual"
                value={currentPasswordValue}
                onChange={(e) => {
                  setCurrentPasswordValue(e.target.value)
                  setValue('currentPassword', e.target.value)
                }}
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                tabIndex={-1}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <PasswordInput
              id="newPassword"
              value={newPasswordValue}
              onChange={(value) => {
                setNewPasswordValue(value)
                setValue('newPassword', value)
              }}
              placeholder="Digite sua nova senha"
              showStrength={true}
              disabled={isLoading}
              error={errors.newPassword?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
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
              error={errors.confirmPassword?.message || (confirmPasswordValue && newPasswordValue !== confirmPasswordValue ? 'Senhas nao conferem' : undefined)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleLogout}
              disabled={isLoading}
            >
              Sair
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !newPasswordValidation.isValid || newPasswordValue !== confirmPasswordValue || !currentPasswordValue}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                'Alterar Senha'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
