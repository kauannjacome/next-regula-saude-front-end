// ==========================================
// PÁGINA: ESQUECI MINHA SENHA
// ==========================================
// Esta é a tela onde o usuário solicita recuperação de senha
// Processo: usuário digita email → sistema envia link de recuperação
// 'use client' = página interativa que roda no navegador

'use client'

import { useState } from 'react';
import { useForm } from 'react-hook-form';      // Gerenciador de formulários
import { zodResolver } from '@hookform/resolvers/zod';  // Integração com validação Zod
import { z } from 'zod';                        // Biblioteca de validação de dados
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';                 // Notificações (toasts)
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';  // Ícones
import Link from 'next/link'

// SCHEMA DE VALIDAÇÃO: Define as regras do formulário
// Usando Zod para garantir que os dados estejam corretos
const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),  // Email obrigatório e deve ser válido
})

// TIPO: Extraído automaticamente do schema acima
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

// COMPONENTE PRINCIPAL DA PÁGINA
export default function ForgotPasswordPage() {
  // ESTADOS: Variáveis que quando mudam, atualizam a tela
  const [isLoading, setIsLoading] = useState(false)      // Se está processando
  const [isEmailSent, setIsEmailSent] = useState(false)  // Se email foi enviado com sucesso
  const [sentEmail, setSentEmail] = useState('')         // Email que recebeu as instruções

  // FORM HOOK: Gerencia o formulário (validação, erros, etc)
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema) as any,  // Usar schema Zod para validar
  })

  // FUNÇÃO: Executada quando o formulário é enviado
  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)  // Mostrar loading
    try {
      // 1. IMPORTAR E EXECUTAR FUNÇÃO DO SERVIDOR
      // forgotPassword = Server Action que gera token e "envia" email
      const { forgotPassword } = await import('@/lib/actions/auth')
      const result = await forgotPassword(data.email)

      // 2. SE DEU CERTO
      if (result.success) {
        setSentEmail(data.email)      // Guardar email enviado
        setIsEmailSent(true)          // Mudar para tela de confirmação
        toast.success(result.message) // Mostrar notificação de sucesso

        // Modo dev: mostrar link de recuperação no console
        if (process.env.NODE_ENV === 'development' && result.devToken) {
          console.log('Link de recuperação:', `${window.location.origin}/reset-password?token=${result.devToken}`)
        }
      } else {
        // SE DEU ERRO: Mostrar mensagem de erro
        toast.error(result.message)
      }
    } catch {
      // SE DEU ERRO INESPERADO
      toast.error('Erro ao enviar email')
    } finally {
      // SEMPRE executado no final (erro ou sucesso)
      setIsLoading(false)  // Esconder loading
    }
  }

  // RENDERIZAÇÃO CONDICIONAL 1: Se email foi enviado, mostrar tela de confirmação
  if (isEmailSent) {
    return (
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-6">
          {/* Ícone de sucesso (check verde) */}
          <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center shadow-md">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <div className="space-y-2">
            {/* Título: Email Enviado! */}
            <CardTitle className="text-3xl font-bold">Email Enviado!</CardTitle>
            {/* Mensagem mostrando para qual email foi enviado */}
            <CardDescription className="text-base">
              Enviamos instruções de recuperação para{' '}
              <span className="font-medium text-foreground">{sentEmail}</span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pb-8">
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p className="mb-2">Verifique sua caixa de entrada e siga as instruções no email.</p>
            <p>Caso não encontre, verifique a pasta de spam.</p>
          </div>

          <Button
            variant="outline"
            className="w-full h-11"
            onClick={() => {
              setIsEmailSent(false)
              setSentEmail('')
            }}
          >
            <Mail className="mr-2 h-5 w-5" />
            Enviar para outro email
          </Button>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="text-sm text-primary hover:underline inline-flex items-center font-medium"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Voltar para o login
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-4 shadow-lg">
      <CardHeader className="text-center space-y-4 pb-6">
        <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shadow-md">
          <Mail className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-3xl font-bold">Recuperar Senha</CardTitle>
          <CardDescription className="text-base">
            Informe seu email para receber as instruções de recuperação
          </CardDescription>
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

          <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Instruções'
            )}
          </Button>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="text-sm text-primary hover:underline inline-flex items-center font-medium"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Voltar para o login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
