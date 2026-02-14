'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check } from 'lucide-react'

interface TwoFactorStatus {
  enabled: boolean
  verifiedAt: string | null
}

export function TwoFactorSettings() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Setup Dialog State
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  // Disable Dialog State
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  const [isDisabling, setIsDisabling] = useState(false)

  // Carregar status do 2FA
  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/auth/two-factor/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Erro ao carregar status 2FA:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Iniciar configuração do 2FA
  const handleStartSetup = async () => {
    setIsSettingUp(true)
    try {
      const response = await fetch('/api/auth/two-factor/setup', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar configuração')
      }

      setQrCode(data.qrCode)
      setSecret(data.secret)
      setShowSetupDialog(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao configurar 2FA')
    } finally {
      setIsSettingUp(false)
    }
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
      setShowSetupDialog(false)
      setVerificationCode('')
      setQrCode(null)
      setSecret(null)
      fetchStatus()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao verificar código')
    } finally {
      setIsVerifying(false)
    }
  }

  // Desativar 2FA
  const handleDisable = async () => {
    if (!disablePassword) {
      toast.error('Digite sua senha para confirmar')
      return
    }

    setIsDisabling(true)
    try {
      const response = await fetch('/api/auth/two-factor/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao desativar')
      }

      toast.success('Autenticação de dois fatores desativada')
      setShowDisableDialog(false)
      setDisablePassword('')
      fetchStatus()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao desativar 2FA')
    } finally {
      setIsDisabling(false)
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

  if (isLoading) {
    return (
      <div className="bg-card dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg overflow-hidden">
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-card dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border dark:border-slate-700 bg-muted/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-foreground dark:text-slate-200">
                Autenticação de Dois Fatores (2FA)
              </h2>
              <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">
                Adicione uma camada extra de segurança à sua conta
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {status?.enabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <ShieldCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    2FA está ativado
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Sua conta está protegida com autenticação de dois fatores
                  </p>
                  {status.verifiedAt && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Ativado em: {new Date(status.verifiedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                onClick={() => setShowDisableDialog(true)}
              >
                <ShieldOff className="h-4 w-4 mr-2" />
                Desativar 2FA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <Shield className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    2FA não está ativado
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Recomendamos ativar para maior segurança da sua conta
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Com a autenticação de dois fatores, você precisará do seu celular para fazer login.
                  Use o aplicativo <strong>Google Authenticator</strong> ou similar.
                </p>

                <Button onClick={handleStartSetup} disabled={isSettingUp}>
                  {isSettingUp ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Configurando...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Ativar 2FA
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog de Setup */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>Configurar Autenticação de Dois Fatores</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code com o Google Authenticator
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* QR Code */}
            {qrCode && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={qrCode} alt="QR Code para 2FA" className="w-48 h-48" />
              </div>
            )}

            {/* Código manual */}
            {secret && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Ou digite o código manualmente:
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={secret}
                    readOnly
                    className="font-mono text-sm"
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
              <p className="text-sm font-medium">
                Digite o código de 6 dígitos do aplicativo:
              </p>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSetupDialog(false)
                setVerificationCode('')
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleVerifyAndEnable}
              disabled={verificationCode.length !== 6 || isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Ativar 2FA'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Desativar */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>Desativar Autenticação de Dois Fatores</DialogTitle>
            <DialogDescription>
              Digite sua senha para confirmar a desativação do 2FA
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Atenção:</strong> Desativar o 2FA deixará sua conta menos segura.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Senha</label>
              <Input
                type="password"
                placeholder="Digite sua senha"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDisableDialog(false)
                setDisablePassword('')
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={!disablePassword || isDisabling}
            >
              {isDisabling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Desativando...
                </>
              ) : (
                'Desativar 2FA'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
