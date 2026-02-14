// ==========================================
// PÁGINA: IMPORTAR CIDADÃOS VIA CSV (ADMIN)
// ==========================================
// Wizard de 4 passos para importação de cidadãos
// Acesso: Apenas System Managers
// Fluxo: Admin > Assinantes > [...] > Importar CSV Cidadãos

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Upload, FileSpreadsheet, Check, AlertTriangle, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/shared'
import { CITIZEN_FIELDS, ValidationSummary, DeduplicationAction } from '@/lib/citizen-import/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Tipos locais
interface UploadResult {
  fileName: string
  fileSize: number
  separator: ',' | ';'
  hasHeader: boolean
  totalRows: number
  headers: string[]
  autoMappings: Record<string, string | null>
  preview: Array<{
    rowIndex: number
    data: Record<string, string>
    processed: {
      status: string
      errors: string[]
      skipReason?: string
    }
  }>
  previewSummary: ValidationSummary
  subscriber: {
    id: number
    name: string
    state: string
    city: string
  }
}

interface ImportResult {
  success: boolean
  totalProcessed: number
  inserted: number
  updated: number
  skipped: number
  errors: number
  errorDetails: Array<{ rowIndex: number; error: string }>
}

interface SubscriberInfo {
  id: number
  name: string
  state: string
  city: string
}

// Passo atual do wizard
type Step = 1 | 2 | 3 | 4

export default function AdminImportCitizensPage() {
  const router = useRouter()
  const params = useParams()
  const subscriberId = params.id as string

  // Estado do subscriber
  const [subscriberInfo, setSubscriberInfo] = useState<SubscriberInfo | null>(null)
  const [isLoadingSubscriber, setIsLoadingSubscriber] = useState(true)

  // Estado do wizard
  const [step, setStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [hasHeader, setHasHeader] = useState(true)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

  // Estado do mapeamento
  const [columnMappings, setColumnMappings] = useState<Record<string, string | null>>({})

  // Estado da deduplicação
  const [deduplicationKey, setDeduplicationKey] = useState<'cpf' | 'cns' | 'cpf_cns'>('cpf')
  const [deduplicationAction, setDeduplicationAction] = useState<DeduplicationAction>('UPDATE')

  // Estado do preview/relatório
  const [previewData, setPreviewData] = useState<{
    summary: ValidationSummary
    errorCSV: string
    errorSample: Array<{
      rowIndex: number
      status: string
      errors: string[]
      skipReason?: string
    }>
  } | null>(null)

  // Estado da importação
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  // Carregar informações do subscriber
  useEffect(() => {
    async function loadSubscriber() {
      try {
        const response = await fetch(`/api/admin/subscribers/${subscriberId}`)
        if (!response.ok) {
          throw new Error('Subscriber não encontrado')
        }
        const data = await response.json()
        setSubscriberInfo({
          id: data.id,
          name: data.name,
          state: data.stateName || data.stateAcronym,
          city: data.city,
        })
      } catch {
        toast.error('Erro ao carregar informações do assinante')
        router.push('/admin/subscribers')
      } finally {
        setIsLoadingSubscriber(false)
      }
    }
    loadSubscriber()
  }, [subscriberId, router])

  // ==========================================
  // PASSO 1: UPLOAD
  // ==========================================

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Selecione um arquivo CSV')
        return
      }
      if (selectedFile.size > 200 * 1024 * 1024) {
        toast.error('Arquivo excede o limite de 200MB')
        return
      }
      setFile(selectedFile)
    }
  }, [])

  const handleValidateFile = async () => {
    if (!file) {
      toast.error('Selecione um arquivo')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('hasHeader', hasHeader.toString())
      formData.append('subscriberId', subscriberId)

      const response = await fetch('/api/admin/citizens/import/validate', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao validar arquivo')
      }

      setUploadResult(result.data)
      setColumnMappings(result.data.autoMappings)
      setStep(2)
      toast.success('Arquivo validado com sucesso')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao validar arquivo')
    } finally {
      setIsLoading(false)
    }
  }

  // ==========================================
  // PASSO 2: MAPEAMENTO
  // ==========================================

  const handleMappingChange = (csvColumn: string, citizenField: string | null) => {
    setColumnMappings(prev => ({
      ...prev,
      [csvColumn]: citizenField === 'none' ? null : citizenField,
    }))
  }

  const isMappingValid = () => {
    const requiredFields = ['cpf', 'name', 'birthDate']
    const mappedFields = Object.values(columnMappings).filter(Boolean)
    return requiredFields.every(field => mappedFields.includes(field))
  }

  // ==========================================
  // PASSO 3: DEDUPLICAÇÃO
  // ==========================================

  const handleGeneratePreview = async () => {
    if (!file || !uploadResult) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('hasHeader', hasHeader.toString())
      formData.append('separator', uploadResult.separator)
      formData.append('columnMappings', JSON.stringify(columnMappings))
      formData.append('deduplicationKey', deduplicationKey)
      formData.append('deduplicationAction', deduplicationAction)
      formData.append('subscriberId', subscriberId)

      const response = await fetch('/api/admin/citizens/import/preview', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao gerar preview')
      }

      setPreviewData(result.data)
      setStep(4)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar preview')
    } finally {
      setIsLoading(false)
    }
  }

  // ==========================================
  // PASSO 4: IMPORTAÇÃO
  // ==========================================

  const handleDownloadErrors = () => {
    if (!previewData?.errorCSV) return

    const blob = new Blob([previewData.errorCSV], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `erros_importacao_${subscriberInfo?.name || subscriberId}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    if (!file || !uploadResult) return

    setIsLoading(true)
    setShowConfirmDialog(false)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('hasHeader', hasHeader.toString())
      formData.append('separator', uploadResult.separator)
      formData.append('columnMappings', JSON.stringify(columnMappings))
      formData.append('deduplicationKey', deduplicationKey)
      formData.append('deduplicationAction', deduplicationAction)
      formData.append('subscriberId', subscriberId)

      const response = await fetch('/api/admin/citizens/import/process', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao importar')
      }

      setImportResult(result.data.result)
      toast.success(`Importação concluída! ${result.data.result.inserted} inseridos, ${result.data.result.updated} atualizados`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao importar')
    } finally {
      setIsLoading(false)
    }
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  if (isLoadingSubscriber) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
              step >= s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {step > s ? <Check className="h-4 w-4" /> : s}
          </div>
          {s < 4 && (
            <div
              className={cn(
                'w-12 h-1 mx-1',
                step > s ? 'bg-primary' : 'bg-muted'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload do Arquivo
        </CardTitle>
        <CardDescription>
          Selecione o arquivo CSV com os dados dos cidadãos para importar para <strong>{subscriberInfo?.name}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info do subscriber */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Assinante:</strong> {subscriberInfo?.name}<br />
            <strong>Cidade/Estado:</strong> {subscriberInfo?.city} / {subscriberInfo?.state}
          </p>
        </div>

        {/* Drop zone */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
          )}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer">
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="h-12 w-12 text-primary" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button variant="outline" size="sm" type="button">
                  Trocar arquivo
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <p className="font-medium">Clique para selecionar ou arraste o arquivo</p>
                <p className="text-sm text-muted-foreground">
                  CSV, tamanho maximo: 200MB
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Opções */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <Label htmlFor="hasHeader">Primeira linha contem cabecalho</Label>
            <p className="text-sm text-muted-foreground">
              Marque se a primeira linha do CSV contem os nomes das colunas
            </p>
          </div>
          <Switch
            id="hasHeader"
            checked={hasHeader}
            onCheckedChange={setHasHeader}
          />
        </div>

        {/* Info */}
        <div className="p-4 bg-muted/50 rounded-lg text-sm">
          <p className="text-muted-foreground">
            <strong>Dica:</strong> O sistema aceita arquivos UTF-8 ou ISO-8859-1.
            Separador pode ser virgula (,) ou ponto-e-virgula (;).
          </p>
        </div>

        <Button
          onClick={handleValidateFile}
          disabled={!file || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validando...
            </>
          ) : (
            <>
              Validar Arquivo
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Mapeamento de Colunas</CardTitle>
        <CardDescription>
          Associe as colunas do CSV com os campos do sistema.
          Campos obrigatorios: CPF, Nome e Data de Nascimento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {uploadResult && (
          <div className="p-4 bg-muted/50 rounded-lg text-sm">
            <p><strong>Arquivo:</strong> {uploadResult.fileName}</p>
            <p><strong>Total de linhas:</strong> {uploadResult.totalRows.toLocaleString()}</p>
            <p><strong>Colunas detectadas:</strong> {uploadResult.headers.length}</p>
            <p><strong>Separador:</strong> {uploadResult.separator === ';' ? 'Ponto-e-virgula' : 'Virgula'}</p>
          </div>
        )}

        <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2">Coluna do CSV</TableHead>
                <TableHead className="w-1/2">Campo no Sistema</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploadResult?.headers.map((header) => (
                <TableRow key={header}>
                  <TableCell className="font-mono text-sm">{header}</TableCell>
                  <TableCell>
                    <Select
                      value={columnMappings[header] || 'none'}
                      onValueChange={(value) => handleMappingChange(header, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Ignorar --</SelectItem>
                        {CITIZEN_FIELDS.map((field) => (
                          <SelectItem key={field.key} value={field.key}>
                            {field.label}
                            {field.required && ' *'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {!isMappingValid() && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Mapeie os campos obrigatorios: CPF, Nome e Data de Nascimento
            </p>
          </div>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={() => setStep(3)} disabled={!isMappingValid()}>
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Regras de Importacao</CardTitle>
        <CardDescription>
          Configure como tratar registros duplicados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Chave de unicidade</Label>
          <RadioGroup
            value={deduplicationKey}
            onValueChange={(v) => setDeduplicationKey(v as 'cpf' | 'cns' | 'cpf_cns')}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cpf" id="key-cpf" />
              <Label htmlFor="key-cpf" className="font-normal cursor-pointer">
                CPF (recomendado)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cns" id="key-cns" />
              <Label htmlFor="key-cns" className="font-normal cursor-pointer">
                CNS (Cartao SUS)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cpf_cns" id="key-both" />
              <Label htmlFor="key-both" className="font-normal cursor-pointer">
                CPF ou CNS
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <Label>Se ja existir cidadao com a mesma chave:</Label>
          <RadioGroup
            value={deduplicationAction}
            onValueChange={(v) => setDeduplicationAction(v as DeduplicationAction)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="UPDATE" id="action-update" />
              <Label htmlFor="action-update" className="font-normal cursor-pointer">
                Atualizar campos (recomendado) - Atualiza apenas campos nao vazios
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="SKIP" id="action-skip" />
              <Label htmlFor="action-skip" className="font-normal cursor-pointer">
                Pular registro - Mantem o cadastro existente
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm space-y-2">
          <p className="font-medium text-blue-800 dark:text-blue-200">
            Registros que serao automaticamente ignorados:
          </p>
          <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 space-y-1">
            <li>Cidadaos com data de obito ou marcados como falecidos</li>
            <li>Registros inativos para exibicao</li>
            <li>Territorios que nao utilizam CPF</li>
            <li>Cadastros unificados</li>
            <li>Registros sem CPF e sem CNS</li>
          </ul>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(2)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={handleGeneratePreview} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando relatorio...
              </>
            ) : (
              <>
                Gerar Relatorio
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Relatorio de Validacao</CardTitle>
        <CardDescription>
          Revise os dados antes de confirmar a importacao para <strong>{subscriberInfo?.name}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {importResult ? (
          <div className="space-y-6">
            <div className={cn(
              'p-6 rounded-lg text-center',
              importResult.success
                ? 'bg-green-50 dark:bg-green-950'
                : 'bg-yellow-50 dark:bg-yellow-950'
            )}>
              <Check className={cn(
                'h-12 w-12 mx-auto mb-4',
                importResult.success
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              )} />
              <h3 className="text-xl font-bold mb-2">
                Importacao Concluida!
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{importResult.inserted}</p>
                  <p className="text-sm text-muted-foreground">Inseridos</p>
                </div>
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{importResult.updated}</p>
                  <p className="text-sm text-muted-foreground">Atualizados</p>
                </div>
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{importResult.skipped}</p>
                  <p className="text-sm text-muted-foreground">Ignorados</p>
                </div>
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{importResult.errors}</p>
                  <p className="text-sm text-muted-foreground">Erros</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => router.push('/admin/subscribers')}>
                Voltar para Assinantes
              </Button>
              <Button onClick={() => {
                setStep(1)
                setFile(null)
                setUploadResult(null)
                setPreviewData(null)
                setImportResult(null)
              }}>
                Nova Importacao
              </Button>
            </div>
          </div>
        ) : previewData ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold">{previewData.summary.totalRows}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{previewData.summary.toInsert}</p>
                <p className="text-sm text-muted-foreground">Inserir</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{previewData.summary.toUpdate}</p>
                <p className="text-sm text-muted-foreground">Atualizar</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-600">{previewData.summary.skippedRows}</p>
                <p className="text-sm text-muted-foreground">Ignorados</p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-600">{previewData.summary.duplicateRows}</p>
                <p className="text-sm text-muted-foreground">Duplicados</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">{previewData.summary.invalidRows}</p>
                <p className="text-sm text-muted-foreground">Invalidos</p>
              </div>
            </div>

            {previewData.errorSample.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Amostra de Erros</h4>
                  <Button variant="outline" size="sm" onClick={handleDownloadErrors}>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar CSV de Erros
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Linha</TableHead>
                        <TableHead className="w-32">Status</TableHead>
                        <TableHead>Motivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.errorSample.slice(0, 20).map((error, i) => (
                        <TableRow key={i}>
                          <TableCell>{error.rowIndex}</TableCell>
                          <TableCell>
                            <Badge variant={error.status === 'INVALID' ? 'destructive' : 'secondary'}>
                              {error.status === 'INVALID' ? 'Invalido' : 'Ignorado'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {error.errors.join(', ') || error.skipReason}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={isLoading || (previewData.summary.toInsert + previewData.summary.toUpdate) === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    Importar {previewData.summary.toInsert + previewData.summary.toUpdate} Cidadaos
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <PageHeader
        title="Importar Cidadaos"
        description={`Importe cidadãos em lista para ${subscriberInfo?.name}`}
        backHref="/admin/subscribers"
      />

      {renderStepIndicator()}

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Importacao
            </DialogTitle>
            <DialogDescription>
              Voce esta prestes a importar{' '}
              <strong>
                {previewData && (previewData.summary.toInsert + previewData.summary.toUpdate)}
              </strong>{' '}
              cidadaos para{' '}
              <strong>{subscriberInfo?.name}</strong>.
              <br /><br />
              Esta acao nao pode ser desfeita facilmente.
              <br /><br />
              Digite <strong>IMPORTAR</strong> para confirmar:
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            placeholder="Digite IMPORTAR"
            className="text-center font-mono"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={confirmText !== 'IMPORTAR' || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                'Confirmar Importacao'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
