'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Upload,
  FileText,
  X,
  Plus,
  FileImage,
  FileSpreadsheet,
  FileScan,
  FileHeart,
  FileQuestion,
  Stethoscope,
  Pill,
  Receipt,
  ClipboardList,
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { REGULATION_STATUSES, PRIORITIES } from '@/lib/constants'
import { formatFileSize } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCachedFolders, useCachedSuppliers, useCachedUsers } from '@/hooks/use-cached-data'

interface Step3Data {
  status: string
  folderId?: string
  priority: string
  templateId?: string
  analyzerId?: string
  supplierId?: string
  resourceOrigin?: string
}

interface RegulationDocument {
  id: string
  file: File
  name: string
  size: number
  type: string
  tag?: string
}

interface Step3ContentProps {
  data: Step3Data
  onFieldChange: (field: keyof Step3Data, value: string) => void
  documents: RegulationDocument[]
  onDocumentsChange: (documents: RegulationDocument[]) => void
  subscriberId?: string | null
}

// Tipos de documentos para anexar
const DOCUMENT_TYPES = [
  { value: 'REQUISICAO', label: 'Requisicao', icon: ClipboardList, color: 'text-blue-600 bg-blue-100' },
  { value: 'EXAME_LABORATORIAL', label: 'Exame Laboratorial', icon: FileSpreadsheet, color: 'text-purple-600 bg-purple-100' },
  { value: 'RAIO_X', label: 'Raio-X / Imagem', icon: FileScan, color: 'text-cyan-600 bg-cyan-100' },
  { value: 'LAUDO', label: 'Laudo Medico', icon: Stethoscope, color: 'text-green-600 bg-green-100' },
  { value: 'RECEITA', label: 'Receita', icon: Pill, color: 'text-orange-600 bg-orange-100' },
  { value: 'NOTA_FISCAL', label: 'Nota Fiscal', icon: Receipt, color: 'text-yellow-600 bg-yellow-100' },
  { value: 'DOCUMENTO_PESSOAL', label: 'Documento Pessoal', icon: FileText, color: 'text-gray-600 bg-gray-100' },
  { value: 'FOTO', label: 'Foto', icon: FileImage, color: 'text-pink-600 bg-pink-100' },
  { value: 'OUTRO', label: 'Outro', icon: FileQuestion, color: 'text-slate-600 bg-slate-100' },
]

const RESOURCE_ORIGIN_OPTIONS = [
  { value: 'MUNICIPAL', label: 'Municipal' },
  { value: 'NOT_SPECIFIED', label: 'Nao especificado' },
  { value: 'FEDERAL', label: 'Federal' },
  { value: 'STATE', label: 'Estadual' },
]

export function Step3Content({ data, onFieldChange, documents, onDocumentsChange, subscriberId }: Step3ContentProps) {
  // Usar cache Zustand para dados que raramente mudam
  const { data: foldersData } = useCachedFolders()
  const { data: suppliersData } = useCachedSuppliers()
  const { data: usersData } = useCachedUsers()

  // Mapear dados para o formato esperado (com tipagem correta)
  const folders = foldersData.map((item) => ({ id: item.id, name: item.name || 'Pasta sem nome' }))
  const suppliers = suppliersData.map((item) => ({ id: item.id, name: item.name || 'Fornecedor sem nome' }))
  const users = usersData.map((item) => ({ id: item.id, name: item.name || item.email || 'Usuario sem nome' }))

  // Modal de upload
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState<string>('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createDocument = (file: File, tag?: string): RegulationDocument => ({
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    tag,
  })

  const handleOpenUploadModal = () => {
    setSelectedDocType('')
    setPendingFiles([])
    setIsUploadModalOpen(true)
  }

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false)
    setSelectedDocType('')
    setPendingFiles([])
  }

  const handleFilesSelected = (files: File[]) => {
    setPendingFiles(prev => [...prev, ...files])
  }

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleConfirmUpload = () => {
    if (pendingFiles.length === 0) return

    const newDocs = pendingFiles.map(file => createDocument(file, selectedDocType || undefined))
    onDocumentsChange([...documents, ...newDocs])
    handleCloseUploadModal()
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const files = Array.from(event.dataTransfer.files)
    if (files.length) {
      handleFilesSelected(files)
    }
  }

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFilesSelected(Array.from(event.target.files))
    }
    // Reset input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveDocument = (docId: string) => {
    onDocumentsChange(documents.filter((doc) => doc.id !== docId))
  }

  const getDocTypeInfo = (tag?: string) => {
    return DOCUMENT_TYPES.find(dt => dt.value === tag) || DOCUMENT_TYPES[DOCUMENT_TYPES.length - 1]
  }

  return (
    <div className="space-y-6">
      {/* DADOS DA REGULACAO */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Regulacao</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={data.status}
                onValueChange={(value) => onFieldChange('status', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {REGULATION_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={data.priority}
                onValueChange={(value) => onFieldChange('priority', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Pasta</Label>
              <Select
                value={data.folderId || ''}
                onValueChange={(value) => onFieldChange('folderId', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a pasta" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={String(folder.id)}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Responsavel pela analise</Label>
              <Select
                value={data.analyzerId || ''}
                onValueChange={(value) => onFieldChange('analyzerId', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o responsavel" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Select
                value={data.supplierId || ''}
                onValueChange={(value) => onFieldChange('supplierId', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={String(supplier.id)}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Origem do recurso</Label>
            <Select
              value={data.resourceOrigin || ''}
              onValueChange={(value) => onFieldChange('resourceOrigin', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_ORIGIN_OPTIONS.map((origin) => (
                  <SelectItem key={origin.value} value={origin.value}>
                    {origin.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* DOCUMENTOS ANEXADOS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Documentos Anexados</CardTitle>
          <Button onClick={handleOpenUploadModal} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Documento
          </Button>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhum documento anexado</p>
              <p className="text-xs mt-1">Clique em "Adicionar Documento" para anexar arquivos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const docTypeInfo = getDocTypeInfo(doc.tag)
                const Icon = docTypeInfo.icon
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', docTypeInfo.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(doc.size)}</span>
                          <span>-</span>
                          <span>{docTypeInfo.label}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveDocument(doc.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            Os arquivos serao enviados ao finalizar a regulacao.
          </p>
        </CardContent>
      </Card>

      {/* MODAL DE UPLOAD */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Documento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* SELECAO DO TIPO DE DOCUMENTO */}
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <div className="grid grid-cols-3 gap-2">
                {DOCUMENT_TYPES.map((docType) => {
                  const Icon = docType.icon
                  const isSelected = selectedDocType === docType.value
                  return (
                    <button
                      key={docType.value}
                      type="button"
                      onClick={() => setSelectedDocType(docType.value)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-center',
                        'hover:border-primary/50 hover:bg-primary/5',
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border'
                      )}
                    >
                      <div className={cn('p-2 rounded-full', docType.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium">{docType.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* AREA DE UPLOAD */}
            <div className="space-y-2">
              <Label>Arquivo(s)</Label>
              <div
                onDragOver={(event) => {
                  event.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={(event) => {
                  event.preventDefault()
                  setIsDragging(false)
                }}
                onDrop={handleDrop}
                className={cn(
                  'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
                  isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Arraste arquivos ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPG, PNG (max 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
            </div>

            {/* LISTA DE ARQUIVOS PENDENTES */}
            {pendingFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Arquivos selecionados ({pendingFiles.length})</Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {pendingFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 p-2 bg-muted rounded-md text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemovePendingFile(index)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseUploadModal}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmUpload}
              disabled={pendingFiles.length === 0}
            >
              Adicionar {pendingFiles.length > 0 && `(${pendingFiles.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
