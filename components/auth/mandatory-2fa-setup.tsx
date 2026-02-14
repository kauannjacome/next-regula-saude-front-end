'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, ShieldCheck, Loader2, Copy, Check, LogOut, Headphones } from 'lucide-react'
import { SupportContactModal } from './support-contact-modal'

export function Mandatory2FASetup() {
  const router = useRouter()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)
  const setupStarted = useRef(false)

  // Iniciar setup automaticamente ao carregar (com proteção contra StrictMode e abort)
  useEffect(() => {
    if (setupStarted.current) return
    setupStarted.current = true
    let cancelled = false

    const startSetup = async () => {
      setIsSettingUp(true)
      setSetupError(null)
      try {
        const response = await fetch('/api/auth/two-factor/setup', {
          method: 'POST',
        })
        if (cancelled) return

        const data = await response.json()

        if (!response.ok) {
          if (data.error?.includes('já está ativado')) {
            toast.success('2FA já está configurado!')
            window.location.href = '/regulations'
            return
          }
          throw new Error(data.error || 'Erro ao iniciar configuração')
        }

        setQrCode(data.qrCode)
        setSecret(data.secret)
      } catch (error) {
        if (cancelled) return
        const errorMsg = error instanceof Error ? error.message : 'Erro ao configurar 2FA'
        setSetupError(errorMsg)
        toast.error(errorMsg)
      } finally {
        if (!cancelled) setIsSettingUp(false)
      }
    }

    startSetup()
    return () => { cancelled = true }
  }, [])

  // Retry do setup
  const handleRetrySetup = () => {
    setupStarted.current = false
    setSetupError(null)
    setQrCode(null)
    setSecret(null)
    setVerificationCode('')
    // Disparar o useEffect novamente via re-render
    setIsSettingUp(true)
    fetch('/api/auth/two-factor/setup', { method: 'POST' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) {
          if (data.error?.includes('já está ativado')) {
            toast.success('2FA já está configurado!')
            window.location.href = '/regulations'
            return
          }
          throw new Error(data.error || 'Erro ao iniciar configuração')
        }
        setQrCode(data.qrCode)
        setSecret(data.secret)
      })
      .catch((error) => {
        const errorMsg = error instanceof Error ? error.message : 'Erro ao configurar 2FA'
        setSetupError(errorMsg)
        toast.error(errorMsg)
      })
      .finally(() => setIsSettingUp(false))
  }

  // Verificar código e ativar 2FA
  const handleVerifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Digite os 6 dígitos do código')
      return
    }

    setIsVerifying(true)
    try {
      const response = await fetch('/api/auth/two-factor/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Código inválido')
      }

      toast.success('Autenticação de dois fatores ativada!')
      // Recarregar a página para atualizar a sessão
      window.location.href = '/regulations'
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao verificar código')
    } finally {
      setIsVerifying(false)
    }
  }

  // Copiar segredo
  const handleCopySecret = async () => {
    if (secret) {
      await navigator.clipboard.writeText(secret)
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
      toast.success('Código copiado!')
    }
  }

  // Fazer logout
  const handleLogout = async () => {
    // Limpar cookies de sessão antes de deslogar
    await fetch('/api/auth/cleanup', { method: 'POST' }).catch(() => {})
    signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">
              Configuração Obrigatória de 2FA
            </CardTitle>
            <CardDescription className="text-base">
              Para acessar o sistema, você precisa configurar a autenticação de dois fatores
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isSettingUp ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-4 text-muted-foreground">Preparando configuração...</p>
            </div>
          ) : setupError ? (
            <div className="space-y-6">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {setupError}
                </p>
              </div>
              <Button onClick={handleRetrySetup} variant="outline" className="w-full">
                Tentar novamente
              </Button>
              <Button onClick={handleLogout} className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                Fazer logout e entrar novamente
              </Button>
            </div>
          ) : (
            <>
              {/* Instruções */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Como configurar:</strong>
                </p>
                <ol className="mt-2 text-sm text-blue-700 dark:text-blue-300 list-decimal list-inside space-y-1">
                  <li>Baixe o <strong>Google Authenticator</strong> no seu celular</li>
                  <li>Escaneie o QR Code abaixo ou digite o código manualmente</li>
                  <li>Digite o código de 6 dígitos que aparece no aplicativo</li>
                </ol>
              </div>

              {/* QR Code */}
              {qrCode && (
                <div className="flex justify-center p-4 bg-white dark:bg-slate-800 rounded-lg border">
                  <img src={qrCode} alt="QR Code para 2FA" className="w-48 h-48" />
                </div>
              )}

              {/* Código manual */}
              {secret && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    Ou digite o código manualmente no aplicativo:
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={secret}
                      readOnly
                      className="font-mono text-sm text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopySecret}
                    >
                      {copiedSecret ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Campo de verificação */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Digite o código de 6 dígitos do aplicativo:
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest font-mono h-14"
                  autoFocus
                />
              </div>

              {/* Botão de ativar */}
              <Button
                onClick={handleVerifyAndEnable}
                disabled={verificationCode.length !== 6 || isVerifying}
                className="w-full h-12 text-base"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5 mr-2" />
                    Ativar 2FA e Acessar o Sistema
                  </>
                )}
              </Button>

              {/* Botões de suporte e logout */}
              <div className="flex flex-col gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowSupportModal(true)}
                  className="w-full"
                >
                  <Headphones className="h-4 w-4 mr-2" />
                  Entrar em contato com o suporte
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full text-muted-foreground"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Suporte */}
      <SupportContactModal
        open={showSupportModal}
        onOpenChange={setShowSupportModal}
      />
    </div>
  )
}
