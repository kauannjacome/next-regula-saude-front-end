'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  FileText,
  Upload,
  Trash2,
  Download,
  Loader2,
  Image as ImageIcon,
  File as FileIcon,
  Eye,
  Plus,
  QrCode,
  Stethoscope,
  ClipboardList,
  TestTube,
  Pill,
  FileCheck,
  FileWarning,
  FileScan,
  Receipt,
  ShieldCheck,
  Heart,
  Syringe,
  X,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatFileSize, formatDate } from '@/lib/format'
import { ConfirmDialog } from '@/components/shared'
import { QrCodeUploadModal } from '@/components/shared/qrcode-upload-modal'

interface DocumentTag {
  value: string
  label: string
  icon: LucideIcon
  color: string
}

const DOCUMENT_TAGS: DocumentTag[] = [
  { value: 'LAUDO_MEDICO', label: 'Laudo Médico', icon: Stethoscope, color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800' },
  { value: 'EXAME', label: 'Exame', icon: TestTube, color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800' },
  { value: 'GUIA_REFERENCIA', label: 'Guia de Referência', icon: ClipboardList, color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
  { value: 'RECEITA', label: 'Receita', icon: Pill, color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800' },
  { value: 'AUTORIZACAO', label: 'Autorização', icon: ShieldCheck, color: 'text-teal-600 bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-800' },
  { value: 'RELATORIO', label: 'Relatório', icon: FileCheck, color: 'text-cyan-600 bg-cyan-50 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-800' },
  { value: 'IMAGEM_DIAGNOSTICA', label: 'Imagem Diagnóstica', icon: FileScan, color: 'text-pink-600 bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:text-pink-400 dark:border-pink-800' },
  { value: 'ENCAMINHAMENTO', label: 'Encaminhamento', icon: Heart, color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' },
  { value: 'PROCEDIMENTO', label: 'Procedimento', icon: Syringe, color: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800' },
  { value: 'NOTA_FISCAL', label: 'Nota Fiscal', icon: Receipt, color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' },
  { value: 'TERMO', label: 'Termo/Declaração', icon: FileWarning, color: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800' },
  { value: 'OUTROS', label: 'Outros', icon: FileText, color: 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800' },
]

const DOCUMENT_TAG_MAP = Object.fromEntries(DOCUMENT_TAGS.map((t) => [t.value, t]))

interface UploadedFile {
  id: number
  fileName: string
  fileUrl: string
  fileSize: number | null
  fileType: string | null
  tag: string | null
  createdAt: string
}

interface RegulationDocumentsProps {
  regulationId: number
  initialUploads: UploadedFile[]
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_TYPES = '.pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx'

export default function RegulationDocuments({
  regulationId,
  initialUploads,
}: RegulationDocumentsProps) {
  const [uploads, setUploads] = useState<UploadedFile[]>(initialUploads)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetModal = () => {
    setSelectedTag(null)
    setSelectedFile(null)
    setIsUploading(false)
    setUploadProgress(0)
  }

  const handleModalClose = (open: boolean) => {
    if (!open) resetModal()
    setModalOpen(open)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo excede o tamanho máximo de 10MB')
      return
    }

    setSelectedFile(file)
  }

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo excede o tamanho máximo de 10MB')
      return
    }

    setSelectedFile(file)
    if (!modalOpen) setModalOpen(true)
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedTag) {
      toast.error('Selecione o tipo de documento e o arquivo')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('tag', selectedTag)

    const interval = setInterval(() => {
      setUploadProgress((prev) => (prev >= 90 ? prev : prev + 10))
    }, 100)

    try {
      const response = await fetch(`/api/regulations/${regulationId}/attachments`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(interval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro no upload')
      }

      const newUpload = await response.json()
      setUploads((prev) => [newUpload, ...prev])
      toast.success('Documento anexado com sucesso!')
      handleModalClose(false)
    } catch (error: any) {
      clearInterval(interval)
      toast.error(error.message || 'Erro ao enviar documento')
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 500)
    }
  }

  const confirmDelete = (id: number) => {
    setDeleteId(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const response = await fetch(
        `/api/regulations/${regulationId}/attachments?uploadId=${deleteId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) throw new Error('Erro ao deletar documento')

      setUploads((prev) => prev.filter((u) => u.id !== deleteId))
      toast.success('Documento removido!')
    } catch {
      toast.error('Erro ao remover documento')
    } finally {
      setDeleteDialogOpen(false)
      setDeleteId(null)
    }
  }

  const getFileIcon = (fileType: string | null, tag: string | null) => {
    const tagConfig = tag ? DOCUMENT_TAG_MAP[tag] : null
    if (tagConfig) {
      const Icon = tagConfig.icon
      return <Icon className={`h-5 w-5 ${tagConfig.color.split(' ')[0]}`} />
    }
    if (!fileType) return <FileIcon className="h-5 w-5 text-muted-foreground" />
    if (fileType.includes('image')) return <ImageIcon className="h-5 w-5 text-purple-500" />
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />
    return <FileIcon className="h-5 w-5 text-blue-500" />
  }

  const getTagBadge = (tag: string | null) => {
    const config = tag ? DOCUMENT_TAG_MAP[tag] : null
    if (!config) return null
    return (
      <Badge variant="outline" className={`text-xs font-normal ${config.color}`}>
        {config.label}
      </Badge>
    )
  }

  const getFileExtBadge = (fileType: string | null, fileName: string) => {
    const ext = fileName.split('.').pop()?.toUpperCase() || ''
    let className = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    if (fileType?.includes('pdf')) className = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    else if (fileType?.includes('image')) className = 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    else if (fileType?.includes('word') || fileType?.includes('document')) className = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    else if (fileType?.includes('sheet') || fileType?.includes('excel')) className = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    return (
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${className}`}>
        {ext}
      </span>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Documentos Anexados</CardTitle>
              {uploads.length > 0 && (
                <Badge variant="secondary" className="ml-1">{uploads.length}</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setQrModalOpen(true)}>
                <QrCode className="mr-2 h-4 w-4" />
                QR Code
              </Button>
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Anexar Documento
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop zone compacta */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
            onDrop={handleDropFile}
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${
              isDragging
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-muted-foreground/20 hover:border-primary/40'
            }`}
          >
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Upload className="h-5 w-5" />
              <p className="text-sm">
                Arraste arquivos aqui ou{' '}
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="text-primary font-medium hover:underline"
                >
                  clique para anexar
                </button>
              </p>
            </div>
          </div>

          {/* Lista de arquivos */}
          {uploads.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum documento anexado ainda
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique em &quot;Anexar Documento&quot; para adicionar
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {uploads.map((file) => (
                <div
                  key={file.id}
                  className="group flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted/50 shrink-0">
                      {getFileIcon(file.fileType, file.tag)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className="font-medium text-sm truncate max-w-[200px] md:max-w-sm"
                          title={file.fileName}
                        >
                          {file.fileName}
                        </p>
                        {getFileExtBadge(file.fileType, file.fileName)}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {getTagBadge(file.tag)}
                        <span className="text-xs text-muted-foreground">
                          {file.fileSize ? formatFileSize(file.fileSize) : ''} {' '} {formatDate(file.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Visualizar" asChild>
                      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Baixar" asChild>
                      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Excluir"
                      onClick={() => confirmDelete(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Upload */}
      <Dialog open={modalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle>Anexar Documento</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Tipo de documento */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Tipo de Documento
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DOCUMENT_TAGS.map((tag) => {
                  const Icon = tag.icon
                  const isSelected = selectedTag === tag.value
                  return (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => setSelectedTag(tag.value)}
                      className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className={`flex items-center justify-center h-8 w-8 rounded-md shrink-0 ${tag.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={`text-xs font-medium leading-tight ${isSelected ? 'text-primary' : ''}`}>
                        {tag.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Arquivo */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Arquivo</Label>
              {selectedFile ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0">
                    {getFileIcon(selectedFile.type, selectedTag)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => {
                      setSelectedFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed rounded-lg text-center hover:border-primary/50 hover:bg-muted/30 transition-colors"
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique para selecionar um arquivo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, Imagens, Word, Excel (max. 10MB)
                  </p>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Barra de progresso */}
            {isUploading && (
              <div className="space-y-1">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                  Enviando... {uploadProgress}%
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleModalClose(false)}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedTag || !selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de exclusão */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Documento"
        description="Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />

      <QrCodeUploadModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        entityType="REGULATION"
        entityId={String(regulationId)}
        documentTypes={DOCUMENT_TAGS.map((t) => ({
          value: t.value,
          label: t.label,
          icon: t.icon,
        }))}
        onSuccess={() => {
          // Refresh uploads from server
          window.location.reload()
        }}
      />
    </>
  )
}
