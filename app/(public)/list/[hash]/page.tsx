'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, Camera, AlertCircle, Clock, User as UserIcon, FileText, Save, RefreshCw, Upload, CameraOff, X, ImagePlus, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ListItem {
  id: number
  citizen?: {
    name: string;
    cpf: string;
    age?: number;
    birthDate?: string;
  }
  cares?: { care: { name: string } }[]
  professional?: { name: string }
  status: string
  scheduledDate?: string
  createdAt: string
  notes?: string
}

interface ListData {
  batch: {
    uuid: string
    type: 'STATUS' | 'UPLOAD' | 'SUPPLIER_LIST'
    expiresAt: string
    allowedActions: string[]
    subscriberName: string
  }
  itemType: 'REGULATION' | 'SCHEDULE'
  items: ListItem[]
}

// Track uploads per item
interface UploadTracker {
  [itemId: number]: {
    count: number
    completed: boolean
  }
}

export default function ListUpdatePage() {
  const { hash } = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [listData, setListData] = useState<ListData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Update state
  const [updateStatus, setUpdateStatus] = useState<string>('')
  const [updateNotes, setUpdateNotes] = useState<string>('')
  const [uploadType, setUploadType] = useState<string>('PEDIDO_MEDICO')

  // Upload tracking
  const [uploadTracker, setUploadTracker] = useState<UploadTracker>({})

  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [captured, setCaptured] = useState<{ file: File; preview: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const fetchList = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/lists/${hash}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Erro ao carregar dados')
      }

      setListData(data)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [hash])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  // Camera functions
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }, [])

  const openCamera = async () => {
    setCameraOpen(true)
    setCameraError(false)
    setCaptured(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setCameraReady(true)
    } catch {
      setCameraError(true)
    }
  }

  const closeCamera = () => {
    stopCamera()
    setCameraOpen(false)
    setCaptured(null)
    setCameraError(false)
  }

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

  const retakePhoto = () => {
    setCaptured(null)
  }

  const handleUploadPhoto = async () => {
    if (!captured || !selectedItem) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', captured.file)
      formData.append('itemId', String(selectedItem.id))
      formData.append('documentType', uploadType)
      formData.append('notes', updateNotes)

      const res = await fetch(`/api/lists/${hash}/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao enviar documento')
      }

      // Update upload tracker
      setUploadTracker(prev => ({
        ...prev,
        [selectedItem.id]: {
          count: (prev[selectedItem.id]?.count || 0) + 1,
          completed: false
        }
      }))

      toast.success('Documento enviado!')

      // Close camera but keep sheet open
      closeCamera()
      setCaptured(null)
      setUpdateNotes('')

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar documento'
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCompleteItem = () => {
    if (!selectedItem) return

    // Mark as completed
    setUploadTracker(prev => ({
      ...prev,
      [selectedItem.id]: {
        ...prev[selectedItem.id],
        completed: true
      }
    }))

    toast.success(`${selectedItem.citizen?.name || 'Paciente'} concluído!`)
    setSelectedItem(null)
  }

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const handleUpdate = async () => {
    if (!selectedItem) return

    try {
      setIsUpdating(true)
      const res = await fetch(`/api/lists/${hash}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItem.id,
          status: updateStatus || undefined,
          notes: updateNotes || undefined
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Erro ao atualizar item')
      }

      toast.success('Registro atualizado com sucesso')
      setSelectedItem(null)
      fetchList()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar'
      toast.error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  const openUpdateSheet = (item: ListItem) => {
    setSelectedItem(item)
    setUpdateStatus(item.status)
    setUpdateNotes('')
  }

  // Get items that are not completed
  const getVisibleItems = () => {
    if (!listData) return []
    return listData.items.filter(item => !uploadTracker[item.id]?.completed)
  }

  // Get completed items count
  const getCompletedCount = () => {
    return Object.values(uploadTracker).filter(t => t.completed).length
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-slate-500 font-medium">Carregando lista...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Ops! Ocorreu um erro</h1>
        <p className="text-slate-500 mb-6 max-w-xs">{error}</p>
        <Button onClick={() => router.refresh()} variant="outline">
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (!listData) return null

  const isSupplierView = listData.batch.type === 'SUPPLIER_LIST'
  const isExpired = new Date() > new Date(listData.batch.expiresAt)
  const visibleItems = getVisibleItems()
  const completedCount = getCompletedCount()

  const statusOptions = [
    { value: 'APPROVED', label: 'Aprovado' },
    { value: 'DENIED', label: 'Cancelado' }
  ]

  // Camera fullscreen view
  if (cameraOpen) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-3">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {uploadType === 'PEDIDO_MEDICO' ? 'Pedido Médico' :
                   uploadType === 'LAUDO_EXAME' ? 'Laudo de Exame' :
                   uploadType === 'DOCUMENTO_CIDADAO' ? 'Documento / CPF' : 'Outros'}
                </p>
                <p className="text-xs text-gray-500 truncate">{selectedItem?.citizen?.name}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={closeCamera} className="h-8 w-8">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Canvas oculto */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Video da câmera */}
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
              <Button onClick={closeCamera} variant="outline">
                Voltar
              </Button>
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
              <div className="flex gap-3">
                <button
                  onClick={retakePhoto}
                  disabled={isUploading}
                  className="flex-1 bg-white/20 backdrop-blur-sm text-white rounded-xl py-3 px-4 font-medium flex items-center justify-center gap-2 active:bg-white/30 disabled:opacity-50"
                >
                  <RefreshCw className="h-5 w-5" />
                  Tirar outra
                </button>
                <button
                  onClick={handleUploadPhoto}
                  disabled={isUploading}
                  className="flex-1 bg-blue-600 text-white rounded-xl py-3 px-4 font-medium flex items-center justify-center gap-2 active:bg-blue-700 disabled:opacity-50"
                >
                  {isUploading ? (
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

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => router.push('/lists')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-slate-900 truncate flex-1">
            {listData.batch.subscriberName}
          </h1>
          <Badge variant={isExpired ? "destructive" : "secondary"} className="shrink-0 flex gap-1 items-center ml-2">
            <Clock className="w-3 h-3" />
            {isExpired ? 'Expirado' : format(new Date(listData.batch.expiresAt), 'HH:mm', { locale: ptBR })}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500">
            {listData.batch.type === 'SUPPLIER_LIST' ? 'Lista para Fornecedor' : 'Atualização em Listas'}
          </p>
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="bg-white">
              {visibleItems.length} pendente{visibleItems.length !== 1 ? 's' : ''}
            </Badge>
            {completedCount > 0 && (
              <Badge variant="default" className="bg-green-600">
                <Check className="w-3 h-3 mr-1" />
                {completedCount} concluído{completedCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-4 max-w-2xl mx-auto">
        {visibleItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="bg-green-100 p-4 rounded-full mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Todos concluídos!</h3>
            <p className="text-sm text-slate-500 mt-2">
              Você processou {completedCount} {completedCount === 1 ? 'paciente' : 'pacientes'} nesta lista.
            </p>
          </div>
        ) : (
          visibleItems.map((item) => {
            const itemUploads = uploadTracker[item.id]
            return (
              <Card key={item.id} className="overflow-hidden border-slate-200 active:scale-[0.98] transition-transform">
                <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between space-y-0">
                  <div className="flex-1">
                    <CardTitle className="text-base font-bold text-slate-900 leading-tight mb-1">
                      {item.citizen?.name || 'Cidadão não identificado'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-xs">
                      <FileText className="w-3 h-3" />
                      {isSupplierView ? (
                        `ID #${item.id} • ${item.citizen?.age} anos • CPF ${item.citizen?.cpf}`
                      ) : (
                        `ID #${item.id} ${item.citizen?.cpf ? `• ${item.citizen.cpf}` : ''}`
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Show upload count if any */}
                    {itemUploads && itemUploads.count > 0 && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 flex items-center gap-1">
                        <ImagePlus className="w-3 h-3" />
                        {itemUploads.count}
                      </Badge>
                    )}
                    {!isSupplierView && (
                      <StatusBadge
                        status={item.status}
                        type={listData.itemType === 'REGULATION' ? 'regulation' : 'schedule'}
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-4">
                  <div className="space-y-3 mb-4">
                    {listData.itemType === 'REGULATION' && item.cares && item.cares.length > 0 && (
                      <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{item.cares.map(c => c.care.name).join(', ')}</span>
                      </div>
                    )}
                    {listData.itemType === 'SCHEDULE' && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{item.scheduledDate ? format(new Date(item.scheduledDate), "eee, d 'de' MMM 'às' HH:mm", { locale: ptBR }) : 'Data não definida'}</span>
                      </div>
                    )}
                    {item.professional && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Prof: {item.professional.name}</span>
                      </div>
                    )}
                  </div>

                  {!isSupplierView && (
                    <div className="flex gap-2">
                      {listData.batch.type === 'STATUS' && (
                        <Button
                          className="flex-1 h-10 gap-2 font-semibold shadow-sm"
                          onClick={() => openUpdateSheet(item)}
                          disabled={isExpired}
                        >
                          <Save className="w-4 h-4" />
                          Atualizar Status
                        </Button>
                      )}
                      {listData.batch.type === 'UPLOAD' && (
                        <Button
                          className="flex-1 h-10 gap-2 font-semibold shadow-sm bg-indigo-600 hover:bg-indigo-700"
                          onClick={() => openUpdateSheet(item)}
                          disabled={isExpired}
                        >
                          <Camera className="w-4 h-4" />
                          {itemUploads && itemUploads.count > 0 ? 'Adicionar Mais' : 'Anexar Documentos'}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </main>

      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl px-6 pb-10 pt-4">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
          <SheetHeader className="text-left mb-6">
            <SheetTitle className="flex items-center justify-between">
              <span>
                {listData?.batch.type === 'UPLOAD' ? 'Anexar Documentos' : 'Atualizar Registro'}
              </span>
              {selectedItem && uploadTracker[selectedItem.id]?.count > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {uploadTracker[selectedItem.id].count} enviado{uploadTracker[selectedItem.id].count !== 1 ? 's' : ''}
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              {selectedItem?.citizen?.name}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {listData?.batch.type === 'STATUS' && (
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">Novo Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setUpdateStatus(opt.value)}
                      className={cn(
                        "flex items-center justify-center px-3 py-3 rounded-lg border text-sm font-medium transition-all active:scale-[0.97]",
                        updateStatus === opt.value
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : "bg-white border-slate-200 text-slate-600 hover:border-primary/50"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {listData?.batch.type === 'UPLOAD' && (
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">Tipo de Documento</Label>
                <Select value={uploadType} onValueChange={setUploadType}>
                  <SelectTrigger className="w-full h-12 border-slate-200">
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PEDIDO_MEDICO">Pedido Médico</SelectItem>
                    <SelectItem value="LAUDO_EXAME">Laudo de Exame</SelectItem>
                    <SelectItem value="DOCUMENTO_CIDADAO">Documento / CPF</SelectItem>
                    <SelectItem value="OUTROS">Outros</SelectItem>
                  </SelectContent>
                </Select>

                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full h-24 border-dashed border-2 flex flex-col gap-2 border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50"
                    onClick={openCamera}
                  >
                    <Camera className="w-8 h-8" />
                    Tirar Foto
                  </Button>
                </div>
              </div>
            )}

            {listData?.batch.type === 'STATUS' && (
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">Observações / Motivo</Label>
                <Textarea
                  placeholder="Descreva brevemente a atualização..."
                  className="min-h-[100px] border-slate-200 resize-none"
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                />
              </div>
            )}
          </div>

          <SheetFooter className="mt-8 gap-3 flex-row">
            <SheetClose asChild>
              <Button variant="outline" className="flex-1 h-12">Cancelar</Button>
            </SheetClose>
            {listData?.batch.type === 'STATUS' && (
              <Button
                className="flex-1 h-12 gap-2 font-bold shadow-lg"
                onClick={handleUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Alteração
              </Button>
            )}
            {listData?.batch.type === 'UPLOAD' && selectedItem && uploadTracker[selectedItem.id]?.count > 0 && (
              <Button
                className="flex-1 h-12 gap-2 font-bold shadow-lg bg-green-600 hover:bg-green-700"
                onClick={handleCompleteItem}
              >
                <Check className="w-4 h-4" />
                Concluir Paciente
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Empty State Footer */}
      {!loading && !error && listData.items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Nenhum item encontrado</h3>
          <p className="text-sm text-slate-500">Todos os itens desta lista já podem ter sido processados ou removidos.</p>
        </div>
      )}
    </div>
  )
}
