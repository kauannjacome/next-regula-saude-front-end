'use client'

// ==========================================
// MODAL DE IMPRESSÃO DE TEMPLATES
// ==========================================
// Este componente exibe um modal para selecionar e imprimir templates
// É usado quando a regulação tem múltiplos templates disponíveis
//
// FUNCIONALIDADES:
// - Lista templates disponíveis para a regulação
// - Mostra histórico de impressão (quem, quando, quantas vezes)
// - Permite selecionar data do documento
// - Opções: imprimir um, imprimir todos, baixar PDF
//
// COMO USAR:
// <PrintTemplateModal
//   open={isOpen}
//   onOpenChange={setIsOpen}
//   regulationId={123}
//   citizenName="João da Silva"
// />

import { useState, useEffect } from 'react'
import {
  Printer,
  Download,
  FileText,
  Calendar,
  User,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatDate } from '@/lib/templates/utils'
import { TemplateType, TEMPLATE_CONFIGS } from '@/lib/templates/types'

// ==========================================
// TIPOS
// ==========================================

interface PrintTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  regulationId?: number
  citizenId?: number
  citizenName?: string
  subscriberId?: number
  onPrintComplete?: () => void
}

interface TemplateItem {
  type: TemplateType
  name: string
  description: string
  category: string
  printHistory: {
    printedAt: string | null
    printedBy: string | null
    printCount: number
  } | null
  documentDate: string
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export function PrintTemplateModal({
  open,
  onOpenChange,
  regulationId,
  citizenId,
  citizenName,
  onPrintComplete,
}: PrintTemplateModalProps) {
  // === ESTADOS ===
  const [isLoading, setIsLoading] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [selectedTemplates, setSelectedTemplates] = useState<TemplateType[]>([])
  const [documentDate, setDocumentDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  // === CARREGAR TEMPLATES DISPONIVEIS ===
  useEffect(() => {
    if (open) {
      loadAvailableTemplates()
    }
  }, [open, regulationId, citizenId])

  const loadAvailableTemplates = async () => {
    setIsLoading(true)
    try {
      // Buscar templates disponíveis e histórico de impressão
      const response = await fetch(
        `/api/templates/available?regulationId=${regulationId || ''}&citizenId=${citizenId || ''}`
      )

      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || getDefaultTemplates())
      } else {
        // Se API não disponível, usar templates padrão
        setTemplates(getDefaultTemplates())
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
      setTemplates(getDefaultTemplates())
    } finally {
      setIsLoading(false)
    }
  }

  // Templates padrão quando não há API
  const getDefaultTemplates = (): TemplateItem[] => {
    const configs = regulationId
      ? Object.values(TEMPLATE_CONFIGS).filter(t => t.requiresRegulation)
      : Object.values(TEMPLATE_CONFIGS).filter(t => t.requiresCitizen && !t.requiresRegulation)

    return configs.map(config => ({
      type: config.type,
      name: config.name,
      description: config.description,
      category: config.category,
      printHistory: null,
      documentDate: new Date().toISOString(),
    }))
  }

  // === SELEÇÃO DE TEMPLATES ===
  const handleToggleTemplate = (type: TemplateType) => {
    setSelectedTemplates(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleSelectAll = () => {
    if (selectedTemplates.length === templates.length) {
      setSelectedTemplates([])
    } else {
      setSelectedTemplates(templates.map(t => t.type))
    }
  }

  // === IMPRESSÃO ===
  const handlePrint = async (templateType?: TemplateType) => {
    const typesToPrint = templateType ? [templateType] : selectedTemplates

    if (typesToPrint.length === 0) {
      toast.error('Selecione pelo menos um template')
      return
    }

    setIsPrinting(true)
    try {
      const response = await fetch('/api/templates/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateTypes: typesToPrint,
          regulationId,
          citizenId,
          documentDate,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar documento')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      // Abrir em nova aba para impressão
      const printWindow = window.open(url, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }

      toast.success('Documento gerado com sucesso!')
      onPrintComplete?.()

      // Recarregar histórico
      loadAvailableTemplates()
    } catch (error) {
      console.error('Erro ao imprimir:', error)
      toast.error('Erro ao gerar documento')
    } finally {
      setIsPrinting(false)
    }
  }

  const handleDownload = async (templateType?: TemplateType) => {
    const typesToPrint = templateType ? [templateType] : selectedTemplates

    if (typesToPrint.length === 0) {
      toast.error('Selecione pelo menos um template')
      return
    }

    setIsPrinting(true)
    try {
      const response = await fetch('/api/templates/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateTypes: typesToPrint,
          regulationId,
          citizenId,
          documentDate,
          download: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar documento')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      // Download do arquivo
      const a = document.createElement('a')
      a.href = url
      a.download = `documento-${regulationId || citizenId}-${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      toast.success('Download iniciado!')
      onPrintComplete?.()
      loadAvailableTemplates()
    } catch (error) {
      console.error('Erro ao baixar:', error)
      toast.error('Erro ao baixar documento')
    } finally {
      setIsPrinting(false)
    }
  }

  // === AGRUPAR POR CATEGORIA ===
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category
    if (!acc[category]) acc[category] = []
    acc[category].push(template)
    return acc
  }, {} as Record<string, TemplateItem[]>)

  const categoryLabels: Record<string, string> = {
    regulation: 'Regulação',
    declaration: 'Declarações',
    term: 'Termos',
    sus: 'Cartão SUS',
    medication: 'Medicamentos',
    hospital: 'Hospitalar',
    list: 'Listas',
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] flex flex-col rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Imprimir Documentos
          </DialogTitle>
          <DialogDescription>
            {citizenName && (
              <>
                Paciente: <strong>{citizenName}</strong>
              </>
            )}
            {regulationId && (
              <>
                {citizenName && ' | '}
                Regulação: <strong>#{regulationId}</strong>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Data do Documento */}
        <div className="flex items-center gap-4 py-2 px-1">
          <div className="flex items-center gap-2">
            <Label htmlFor="documentDate" className="text-sm whitespace-nowrap">
              Data do documento:
            </Label>
            <Input
              id="documentDate"
              type="date"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
              className="w-40"
            />
          </div>

          <div className="flex-1" />

          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={isLoading}
          >
            {selectedTemplates.length === templates.length
              ? 'Desmarcar todos'
              : 'Selecionar todos'}
          </Button>
        </div>

        <Separator />

        {/* Lista de Templates */}
        <ScrollArea className="flex-1 min-h-0 max-h-[50vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mb-2" />
              <p>Nenhum template disponível</p>
            </div>
          ) : (
            <div className="space-y-6 p-1">
              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <div key={category}>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    {categoryLabels[category] || category}
                  </h4>
                  <div className="space-y-2">
                    {categoryTemplates.map((template) => (
                      <TemplateListItem
                        key={template.type}
                        template={template}
                        selected={selectedTemplates.includes(template.type)}
                        onToggle={() => handleToggleTemplate(template.type)}
                        onPrint={() => handlePrint(template.type)}
                        onDownload={() => handleDownload(template.type)}
                        isPrinting={isPrinting}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />

        {/* Rodapé com ações */}
        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedTemplates.length} selecionado(s)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPrinting}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownload()}
              disabled={isPrinting || selectedTemplates.length === 0}
            >
              {isPrinting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Baixar PDF
            </Button>
            <Button
              onClick={() => handlePrint()}
              disabled={isPrinting || selectedTemplates.length === 0}
            >
              {isPrinting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              Imprimir ({selectedTemplates.length})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ==========================================
// COMPONENTE: ITEM DA LISTA DE TEMPLATES
// ==========================================

interface TemplateListItemProps {
  template: TemplateItem
  selected: boolean
  onToggle: () => void
  onPrint: () => void
  onDownload: () => void
  isPrinting: boolean
}

function TemplateListItem({
  template,
  selected,
  onToggle,
  onPrint,
  onDownload,
  isPrinting,
}: TemplateListItemProps) {
  const history = template.printHistory

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg border cursor-pointer
        transition-colors
        ${selected
          ? 'border-primary bg-primary/5'
          : 'border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900'}
      `}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Info do Template */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{template.name}</span>
          {history && history.printCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {history.printCount}x impresso
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {template.description}
        </p>

        {/* Histórico de Impressão */}
        {history && history.printedAt ? (
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(history.printedAt)}
            </span>
            {history.printedBy && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {history.printedBy}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Nunca impresso
          </div>
        )}
      </div>

      {/* Ações Rápidas */}
      <div
        className="flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onDownload}
          disabled={isPrinting}
          title="Baixar PDF"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onPrint}
          disabled={isPrinting}
          title="Imprimir"
        >
          <Printer className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default PrintTemplateModal





