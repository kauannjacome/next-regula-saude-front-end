'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Clock,
  Upload,
  RefreshCw,
  CameraOff,
} from 'lucide-react'

type PageStatus = 'loading' | 'ready' | 'expired' | 'used' | 'error' | 'uploading' | 'success'

interface TokenInfo {
  entityType: string
  documentType: string
  subscriberName: string
}

const DOC_TYPE_LABELS: Record<string, string> = {
  RG: 'RG',
  CPF: 'CPF',
  CNH: 'CNH',
  PROOF_OF_RESIDENCE: 'Comprovante de Residência',
  SUS_CARD: 'Cartão SUS',
  SUS_MIRROR: 'Espelho SUS',
  BIRTH_CERTIFICATE: 'Certidão de Nascimento',
  MARRIAGE_CERTIFICATE: 'Certidão de Casamento',
  VOTER_ID: 'Título de Eleitor',
  WORK_CARD: 'Carteira de Trabalho',
  PIS_PASEP: 'PIS/PASEP',
  RESERVIST_CERTIFICATE: 'Certificado de Reservista',
  GOV_BR: 'Gov.br',
  DIGITAL_CNH: 'CNH Digital',
  DIGITAL_RG: 'RG Digital',
  OTHER: 'Outro',
  LAUDO_MEDICO: 'Laudo Médico',
  EXAME: 'Exame',
  GUIA_REFERENCIA: 'Guia de Referência',
  RECEITA: 'Receita',
  AUTORIZACAO: 'Autorização',
  RELATORIO: 'Relatório',
  IMAGEM_DIAGNOSTICA: 'Imagem Diagnóstica',
  ENCAMINHAMENTO: 'Encaminhamento',
  PROCEDIMENTO: 'Procedimento',
  NOTA_FISCAL: 'Nota Fiscal',
  TERMO: 'Termo/Declaração',
  OUTROS: 'Outros',
}

function formatDocType(type: string) {
  return DOC_TYPE_LABELS[type] || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())
}

export default function PublicUploadPage() {
  const { hash } = useParams()
  const [status, setStatus] = useState<PageStatus>('loading')
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [captured, setCaptured] = useState<{ file: File; preview: string } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // ---- Fetch token info ----
  const fetchTokenInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/upload/qrcode/${hash}`)
      if (res.ok) {
        const data = await res.json()
        setTokenInfo(data)
        setStatus('ready')
      } else if (res.status === 410) {
        const data = await res.json()
        setStatus(data.used ? 'used' : 'expired')
      } else {
        setStatus('error')
        setErrorMsg('Link inválido')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Erro de conexão')
    }
  }, [hash])

  useEffect(() => {
    if (hash) fetchTokenInfo()
  }, [hash, fetchTokenInfo])

  // ---- Camera lifecycle: abre 1x e mantém aberta ----
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    if (status !== 'ready') return

    let cancelled = false

    async function open() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setCameraReady(true)
      } catch {
        if (!cancelled) setCameraError(true)
      }
    }

    open()

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [status, stopCamera])

  // ---- Capturar foto (camera continua rodando) ----
  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], `documento-${Date.now()}.jpg`, { type: 'image/jpeg' })
        const preview = canvas.toDataURL('image/jpeg', 0.9)
        setCaptured({ file, preview })
      },
      'image/jpeg',
      0.9
    )
  }

  const retake = () => {
    setCaptured(null)
    setErrorMsg('')
  }

  const handleUpload = async () => {
    if (!captured) return

    setStatus('uploading')
    stopCamera()

    try {
      const formData = new FormData()
      formData.append('file', captured.file)

      const res = await fetch(`/api/upload/qrcode/${hash}`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        setStatus('success')
      } else {
        const data = await res.json()
        setErrorMsg(data.error || 'Erro ao enviar arquivo')
        setStatus('ready')
      }
    } catch {
      setErrorMsg('Erro de conexão ao enviar')
      setStatus('ready')
    }
  }

  // ---- Telas de status ----
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Documento enviado!</h1>
          <p className="text-gray-600">O documento foi recebido com sucesso. Você pode fechar esta página.</p>
        </div>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link expirado</h1>
          <p className="text-gray-600">Este link de upload expirou. Solicite um novo QR code ao profissional.</p>
        </div>
      </div>
    )
  }

  if (status === 'used') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link já utilizado</h1>
          <p className="text-gray-600">Este link já foi utilizado para enviar um documento.</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Erro</h1>
          <p className="text-gray-600">{errorMsg || 'Link inválido'}</p>
        </div>
      </div>
    )
  }

  // ---- Tela da câmera (ready / uploading) ----
  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {tokenInfo ? formatDocType(tokenInfo.documentType) : 'Documento'}
              </p>
              <p className="text-xs text-gray-500 truncate">{tokenInfo?.subscriberName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas oculto */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video da câmera — sempre renderizado, sempre rodando */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Erro de câmera */}
      {cameraError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900">
          <div className="text-center p-6">
            <CameraOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">Não foi possível acessar a câmera</p>
            <p className="text-gray-400 text-sm mb-4">Verifique as permissões do navegador</p>
          </div>
        </div>
      )}

      {/* Loading da câmera */}
      {!cameraReady && !cameraError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}

      {/* Foto capturada (overlay sobre o vídeo) */}
      {captured && (
        <div className="absolute inset-0 z-10">
          <img
            src={captured.preview}
            alt="Foto capturada"
            className="w-full h-full object-contain bg-black"
          />
        </div>
      )}

      {/* Controles */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {!captured ? (
          <>
            {/* Guia visual */}
            {cameraReady && (
              <div className="absolute inset-0 bottom-24 pointer-events-none" style={{ top: '-100vh' }}>
                <div className="absolute inset-x-6 top-[calc(100vh*0.12)] bottom-8 border-2 border-white/40 rounded-xl" />
              </div>
            )}

            {/* Botão de captura */}
            {cameraReady && (
              <div className="pb-8 pt-4 flex justify-center">
                <button
                  onClick={capturePhoto}
                  className="w-18 h-18 rounded-full border-[5px] border-white shadow-lg active:scale-90 transition-transform flex items-center justify-center"
                  style={{ width: 72, height: 72 }}
                >
                  <div className="w-14 h-14 bg-white rounded-full" style={{ width: 56, height: 56 }} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12">
            {errorMsg && (
              <div className="bg-red-500/90 rounded-lg p-2 mb-3">
                <p className="text-sm text-white text-center">{errorMsg}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={retake}
                disabled={status === 'uploading'}
                className="flex-1 bg-white/20 backdrop-blur-sm text-white rounded-xl py-3 px-4 font-medium flex items-center justify-center gap-2 active:bg-white/30 disabled:opacity-50"
              >
                <RefreshCw className="h-5 w-5" />
                Tirar outra
              </button>
              <button
                onClick={handleUpload}
                disabled={status === 'uploading'}
                className="flex-1 bg-blue-600 text-white rounded-xl py-3 px-4 font-medium flex items-center justify-center gap-2 active:bg-blue-700 disabled:opacity-50"
              >
                {status === 'uploading' ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
