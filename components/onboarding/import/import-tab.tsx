'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { ImportType, IMPORT_TAB_CONFIG } from '@/lib/onboarding'
import { ImportPreview } from './import-preview'
import { ImportErrors } from './import-errors'

interface ImportTabProps {
  type: ImportType
  onImportComplete: () => void
}

type TabState = 'idle' | 'validating' | 'preview' | 'importing' | 'success' | 'error'

interface ValidationResult {
  fileName: string
  totalRows: number
  validRows: number
  invalidRows: number
  isValid: boolean
  preview: Array<{
    rowIndex: number
    isValid: boolean
    data?: Record<string, unknown>
    errors?: Array<{ field: string; message: string }>
  }>
  errors: Array<{
    rowIndex: number
    isValid: boolean
    errors?: Array<{ field: string; message: string }>
  }>
}

interface ImportResult {
  totalRows: number
  successRows: number
  errorRows: number
}

export function ImportTab({ type, onImportComplete }: ImportTabProps) {
  const [state, setState] = useState<TabState>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const config = IMPORT_TAB_CONFIG[type]

  // Download do template
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`/api/onboarding/templates/${type.toLowerCase()}`)
      if (!response.ok) {
        throw new Error('Erro ao baixar template')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = config.templateFileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Template baixado com sucesso!')
    } catch (error) {
      toast.error('Erro ao baixar template')
    }
  }

  // Upload e validacao do arquivo
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (!selectedFile) return

      // Validar extensao
      const validExtensions = ['.xlsx', '.xls', '.csv']
      const extension = selectedFile.name.substring(
        selectedFile.name.lastIndexOf('.')
      ).toLowerCase()

      if (!validExtensions.includes(extension)) {
        toast.error('Formato invalido. Use arquivos .xlsx, .xls ou .csv')
        return
      }

      setFile(selectedFile)
      setState('validating')

      try {
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('type', type)

        const response = await fetch('/api/onboarding/import/validate', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao validar arquivo')
        }

        setValidation(data)
        setState('preview')
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Erro ao validar arquivo'
        )
        setState('idle')
        setFile(null)
      }
    },
    [type]
  )

  // Processar importacao
  const handleImport = async () => {
    if (!file || !validation) return

    setState('importing')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/onboarding/import/process', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar importacao')
      }

      setImportResult(data)
      setState('success')
      onImportComplete()

      toast.success(
        `Importacao concluida! ${data.successRows} registros importados.`
      )
    } catch (error) {
      setState('error')
      toast.error(
        error instanceof Error ? error.message : 'Erro ao processar importacao'
      )
    }
  }

  // Resetar estado
  const handleReset = () => {
    setState('idle')
    setFile(null)
    setValidation(null)
    setImportResult(null)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{config.description}</p>

      {/* Estado inicial */}
      {state === 'idle' && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Download template */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">Baixar Template</p>
                  <p className="text-sm text-muted-foreground">
                    Use nosso modelo para preencher os dados
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>

            {/* Upload */}
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id={`file-upload-${type}`}
              />
              <label
                htmlFor={`file-upload-${type}`}
                className="cursor-pointer"
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium">Clique para enviar arquivo</p>
                <p className="text-sm text-muted-foreground mt-1">
                  ou arraste e solte aqui
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Formatos aceitos: .xlsx, .xls, .csv
                </p>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validando */}
      {state === 'validating' && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 font-medium">Validando arquivo...</p>
            <p className="text-sm text-muted-foreground">{file?.name}</p>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {state === 'preview' && validation && (
        <div className="space-y-4">
          <ImportPreview
            validation={validation}
            type={type}
          />

          {validation.invalidRows > 0 && (
            <ImportErrors errors={validation.errors} />
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={validation.validRows === 0}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar {validation.validRows} registros
            </Button>
          </div>
        </div>
      )}

      {/* Importando */}
      {state === 'importing' && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 font-medium">Importando dados...</p>
            <p className="text-sm text-muted-foreground">
              Isso pode levar alguns instantes
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sucesso */}
      {state === 'success' && importResult && (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
            <p className="mt-4 font-medium text-green-700">
              Importacao concluida!
            </p>
            <div className="mt-2 text-sm text-muted-foreground">
              <p>{importResult.successRows} registros importados</p>
              {importResult.errorRows > 0 && (
                <p className="text-orange-600">
                  {importResult.errorRows} registros com erro
                </p>
              )}
            </div>
            <Button variant="outline" onClick={handleReset} className="mt-4">
              Importar mais dados
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Erro */}
      {state === 'error' && (
        <Card>
          <CardContent className="py-8 text-center">
            <XCircle className="h-12 w-12 mx-auto text-red-600" />
            <p className="mt-4 font-medium text-red-700">
              Erro na importacao
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Verifique os dados e tente novamente
            </p>
            <Button variant="outline" onClick={handleReset} className="mt-4">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
