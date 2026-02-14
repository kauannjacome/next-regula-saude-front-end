'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Loader2,
  QrCode,
  CheckCircle2,
  RefreshCw,
  Clock,
  ArrowLeft,
  Copy,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { DOCUMENT_TYPES_LIST } from '@/lib/document-type-config'
import { generateQRCodeDataURL } from '@/lib/qrcode'

interface QrCodeUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: 'CITIZEN' | 'USER' | 'REGULATION'
  entityId: string
  documentTypes?: { value: string; label: string; icon: React.ElementType }[]
  onSuccess: () => void
}

type Step = 'select' | 'qrcode' | 'success' | 'expired'

const MAX_POLLS = 10
const POLL_INTERVAL_MS = 60_000

export function QrCodeUploadModal({
  open,
  onOpenChange,
  entityType,
  entityId,
  documentTypes,
  onSuccess,
}: QrCodeUploadModalProps) {
  const [step, setStep] = useState<Step>('select')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [linkUrl, setLinkUrl] = useState<string | null>(null)
  const [hash, setHash] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState('')
  const [pollCount, setPollCount] = useState(0)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [copied, setCopied] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const types = documentTypes || DOCUMENT_TYPES_LIST.map((t) => ({
    value: t.value,
    label: t.label,
    icon: t.icon,
  }))

  const reset = useCallback(() => {
    setStep('select')
    setSelectedType(null)
    setIsGenerating(false)
    setQrDataUrl(null)
    setLinkUrl(null)
    setHash(null)
    setExpiresAt(null)
    setTimeLeft('')
    setPollCount(0)
    setLastCheck(null)
    setCopied(false)
    if (pollRef.current) clearInterval(pollRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) reset()
      onOpenChange(open)
    },
    [onOpenChange, reset]
  )

  const generateQrCode = async () => {
    if (!selectedType) return

    setIsGenerating(true)
    try {
      const res = await fetch('/api/upload/qrcode/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          documentType: selectedType,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao gerar QR code')
      }

      const data = await res.json()
      setHash(data.hash)
      setExpiresAt(new Date(data.expiresAt))

      // Construir URL usando origin do navegador (funciona local e producao)
      const clientLink = `${window.location.origin}/upload/${data.hash}`
      setLinkUrl(clientLink)

      const dataUrl = await generateQRCodeDataURL(clientLink, 280)
      setQrDataUrl(dataUrl)
      setStep('qrcode')
      setPollCount(0)
      setLastCheck(null)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar QR code')
    } finally {
      setIsGenerating(false)
    }
  }

  // Countdown timer — exibe 10min para o usuario, backend expira em 13min (3min de margem)
  useEffect(() => {
    if (step !== 'qrcode' || !expiresAt) return

    const displayExpiresAt = expiresAt.getTime() - 3 * 60 * 1000

    const updateTimer = () => {
      const now = Date.now()
      const diff = displayExpiresAt - now
      if (diff <= 0) {
        setTimeLeft('00:00')
        setStep('expired')
        if (pollRef.current) clearInterval(pollRef.current)
        return
      }
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`)
    }

    updateTimer()
    timerRef.current = setInterval(updateTimer, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [step, expiresAt])

  // Polling
  const checkStatus = useCallback(async () => {
    if (!hash) return

    try {
      const res = await fetch(`/api/upload/qrcode/${hash}/status`)
      if (!res.ok) return

      const data = await res.json()
      setLastCheck(new Date())
      setPollCount((c) => c + 1)

      if (data.used) {
        setStep('success')
        if (pollRef.current) clearInterval(pollRef.current)
        onSuccess()
        setTimeout(() => handleClose(false), 2000)
      } else if (data.expired) {
        setStep('expired')
        if (pollRef.current) clearInterval(pollRef.current)
      }
    } catch {
      // Silent fail on poll
    }
  }, [hash, onSuccess, handleClose])

  useEffect(() => {
    if (step !== 'qrcode' || !hash) return

    const timeout = setTimeout(() => checkStatus(), 5000)

    pollRef.current = setInterval(() => {
      setPollCount((c) => {
        if (c >= MAX_POLLS) {
          if (pollRef.current) clearInterval(pollRef.current)
          return c
        }
        checkStatus()
        return c
      })
    }, POLL_INTERVAL_MS)

    return () => {
      clearTimeout(timeout)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [step, hash, checkStatus])

  const getLastCheckText = () => {
    if (!lastCheck) return 'Aguardando...'
    const diffSec = Math.floor((Date.now() - lastCheck.getTime()) / 1000)
    if (diffSec < 60) return `ha ${diffSec}s`
    return `ha ${Math.floor(diffSec / 60)} min`
  }

  const handleCopyLink = () => {
    if (!linkUrl) return
    navigator.clipboard.writeText(linkUrl)
    setCopied(true)
    toast.success('Link copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Upload via QR Code
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Select document type */}
        {step === 'select' && (
          <div className="space-y-4 py-2">
            <Label className="text-sm font-medium block">
              Selecione o tipo de documento
            </Label>
            <div className="grid grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto">
              {types.map((config) => {
                const Icon = config.icon
                const isSelected = selectedType === config.value
                return (
                  <button
                    key={config.value}
                    type="button"
                    onClick={() => setSelectedType(config.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs leading-tight">{config.label}</span>
                  </button>
                )
              })}
            </div>
            <Button
              onClick={generateQrCode}
              disabled={!selectedType || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Gerar QR Code
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Show QR Code */}
        {step === 'qrcode' && (
          <div className="flex flex-col items-center space-y-4 py-2">
            <div className="p-3 bg-white border-4 border-muted rounded-2xl shadow-sm">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code para upload"
                  className="w-52 h-52"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            <p className="text-sm text-center text-muted-foreground">
              Escaneie o QR code com a camera do celular
            </p>

            {/* Copiar link */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-2"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiado!' : 'Copiar Link'}
            </Button>

            {/* Timer */}
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono font-medium">{timeLeft}</span>
            </div>

            {/* Polling info */}
            <div className="flex items-center justify-between w-full text-xs text-muted-foreground border-t pt-3">
              <span>
                Ultima verificacao: {getLastCheckText()}
              </span>
              <div className="flex items-center gap-2">
                <span>
                  {pollCount}/{MAX_POLLS}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={checkStatus}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                if (pollRef.current) clearInterval(pollRef.current)
                setStep('select')
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <p className="font-medium">Documento recebido com sucesso!</p>
            <p className="text-sm text-muted-foreground">
              Fechando em instantes...
            </p>
          </div>
        )}

        {/* Expired */}
        {step === 'expired' && (
          <div className="py-8 text-center space-y-4">
            <Clock className="h-12 w-12 text-orange-500 mx-auto" />
            <p className="font-medium">QR Code expirado</p>
            <p className="text-sm text-muted-foreground">
              O tempo limite foi atingido. Gere um novo QR code.
            </p>
            <Button onClick={() => setStep('select')} className="w-full">
              <QrCode className="mr-2 h-4 w-4" />
              Gerar Novo QR Code
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
