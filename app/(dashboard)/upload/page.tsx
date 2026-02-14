'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Trash2, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatFileSize } from '@/lib/format'

interface UploadedFile {
  id: string
  name: string
  size: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

const ALLOWED_TYPES = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    processFiles(droppedFiles)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : []
    processFiles(selectedFiles)
  }, [])

  const processFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`Formato inválido: ${file.name}. Use CSV ou Excel.`)
        return false
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`Arquivo muito grande: ${file.name}. Máximo 10MB.`)
        return false
      }
      return true
    })

    const uploadFiles: UploadedFile[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      status: 'pending',
      progress: 0,
    }))

    setFiles((prev) => [...prev, ...uploadFiles])
  }

  const uploadFile = async (file: UploadedFile) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === file.id ? { ...f, status: 'uploading', progress: 0 } : f))
    )

    try {
      // Buscar o arquivo original pelo nome na lista de arquivos do input
      const inputEl = document.getElementById('file-upload') as HTMLInputElement
      const originalFiles = inputEl?.files ? Array.from(inputEl.files) : []
      const originalFile = originalFiles.find((f) => f.name === file.name)

      if (!originalFile) {
        throw new Error('Arquivo original não encontrado')
      }

      const formData = new FormData()
      formData.append('file', originalFile)

      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, progress: 30 } : f))
      )

      const response = await fetch('/api/batch-upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, progress: 80 } : f))
      )

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar arquivo para o servidor')
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? { ...f, status: 'success', progress: 100 }
            : f
        )
      )
    } catch (error: any) {
      console.error('Erro no upload:', error)
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? { ...f, status: 'error', error: error.message || 'Falha ao processar arquivo' }
            : f
        )
      )
    }
  }

  const handleUploadAll = async () => {
    setIsProcessing(true)
    const pendingFiles = files.filter((f) => f.status === 'pending')

    for (const file of pendingFiles) {
      await uploadFile(file)
    }

    setIsProcessing(false)
    toast.success('Processamento concluído!')
  }

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const handleClearAll = () => {
    setFiles([])
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'uploading':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const pendingCount = files.filter((f) => f.status === 'pending').length

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Upload em Lista"
        description="Importe dados em massa através de arquivos CSV ou Excel"
      />

      <Card>
        <CardHeader>
          <CardTitle>Área de Upload</CardTitle>
          <CardDescription>
            Arraste arquivos ou clique para selecionar. Formatos aceitos: CSV, XLS, XLSX (máx. 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              CSV, XLS ou XLSX até 10MB
            </p>
            <input
              type="file"
              multiple
              accept=".csv,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                Selecionar Arquivos
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Arquivos Selecionados</CardTitle>
              <CardDescription>
                {files.length} arquivo(s) - {pendingCount} pendente(s)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar
              </Button>
              <Button
                size="sm"
                onClick={handleUploadAll}
                disabled={pendingCount === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar Todos
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-4 rounded-lg border"
                >
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{file.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {formatFileSize(file.size)}
                      </Badge>
                    </div>
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="h-1" />
                    )}
                    {file.error && (
                      <p className="text-sm text-destructive">{file.error}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(file.status)}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFile(file.id)}
                      disabled={file.status === 'uploading'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Modelos de Importação</CardTitle>
          <CardDescription>
            Baixe os modelos para importação correta dos dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: 'Modelo de Cidadãos', filename: 'modelo_cidadãos.xlsx' },
              { name: 'Modelo de Profissionais', filename: 'modelo_profissionais.xlsx' },
              { name: 'Modelo de Unidades', filename: 'modelo_unidades.xlsx' },
              { name: 'Modelo de Regulações', filename: 'modelo_regulacoes.xlsx' },
            ].map((template) => (
              <Button key={template.filename} variant="outline" className="justify-start">
                <Download className="mr-2 h-4 w-4" />
                {template.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
