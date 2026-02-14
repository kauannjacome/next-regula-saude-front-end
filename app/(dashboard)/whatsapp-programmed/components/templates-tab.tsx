'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  MoreHorizontal,
  Edit,
  Trash,
  MessageSquare,
  Plus,
  Eye,
  Search,
  Copy,
  Check,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronRight,
  FileText,
  Calendar,
  Pill,
  Package,
  Heart,
  FileCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared'
import { Switch } from '@/components/ui/switch'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import Link from 'next/link'
import { toast } from 'sonner'
import apiClient from '@/lib/api/api-client'
import { WHATSAPP_TRIGGER_GROUPS } from '@/lib/constants'
import { extractMustacheTokens } from '@/lib/templates/template-variables'
import type { WhatsAppProgrammed } from '@/types'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Mapeamento de ícones para categorias
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  status: FileText,
  schedule: Calendar,
  medication: Pill,
  stock: Package,
  care: Heart,
  document: FileCheck,
  general: MessageSquare,
}

// Obter label do trigger
const mapTriggerLabel = (trigger: string) => {
  for (const group of Object.values(WHATSAPP_TRIGGER_GROUPS)) {
    const found = group.triggers.find((t) => t.value === trigger)
    if (found) return found.label
  }
  return trigger
}

// Obter categoria do trigger
const getTriggerCategory = (trigger: string): string => {
  for (const [key, group] of Object.entries(WHATSAPP_TRIGGER_GROUPS)) {
    if (group.triggers.some((t) => t.value === trigger)) {
      return key
    }
  }
  return 'general'
}

const getTriggerColor = (trigger: string) => {
  const category = getTriggerCategory(trigger)
  const group = WHATSAPP_TRIGGER_GROUPS[category as keyof typeof WHATSAPP_TRIGGER_GROUPS]
  return group?.color || 'bg-gray-500'
}

export function TemplatesTab() {
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [templates, setTemplates] = useState<WhatsAppProgrammed[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/whatsapp-programmed')
      const rawData = response.data?.data || response.data || []
      setTemplates(Array.isArray(rawData) ? rawData : [])
    } catch (error: any) {
      console.error('Error fetching templates:', error)
      const msg = error?.response?.data?.details || error?.message || 'Erro ao carregar templates'
      toast.error(`Erro: ${msg}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar templates pela busca
  const filtered = templates.filter(
    (item) =>
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.bodyText?.toLowerCase().includes(search.toLowerCase())
  )

  // Agrupar templates por categoria
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, WhatsAppProgrammed[]> = {}

    // Inicializar grupos vazios para todas as categorias
    Object.keys(WHATSAPP_TRIGGER_GROUPS).forEach((key) => {
      groups[key] = []
    })

    // Distribuir templates nos grupos
    filtered.forEach((template) => {
      const category = getTriggerCategory(template.triggerType)
      if (!groups[category]) groups[category] = []
      groups[category].push(template)
    })

    return groups
  }, [filtered])

  // Categorias que têm templates
  const categoriesWithTemplates = useMemo(() => {
    return Object.entries(groupedTemplates)
      .filter(([_, templates]) => templates.length > 0)
      .map(([key]) => key)
  }, [groupedTemplates])

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  const handleDelete = async () => {
    if (!selectedId) return
    try {
      await apiClient.delete(`/whatsapp-programmed/${selectedId}`)
      toast.success('Template excluído com sucesso')
      setDeleteDialogOpen(false)
      setSelectedId(null)
      fetchTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Erro ao excluir template')
    }
  }

  const handleToggleActive = async (id: number, currentState: boolean) => {
    try {
      await apiClient.patch(`/whatsapp-programmed/${id}`, { isActive: !currentState })
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isActive: !currentState } : t))
      )
      toast.success(currentState ? 'Template desativado' : 'Template ativado')
    } catch (error) {
      toast.error('Erro ao atualizar template')
    }
  }

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Mensagem copiada!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  // Renderiza um template card
  const renderTemplateCard = (template: WhatsAppProgrammed) => {
    const tokens = extractMustacheTokens(template.bodyText || '')

    return (
      <Card
        key={template.id}
        className={cn(
          'group transition-all hover:shadow-md',
          !template.isActive && 'opacity-60'
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{template.name}</h3>
                {template.isActive ? (
                  <Badge variant="default" className="bg-emerald-500 text-[10px] px-1.5">
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] px-1.5">
                    Inativo
                  </Badge>
                )}
              </div>
              <Badge
                variant="outline"
                className={cn('mt-1 text-[10px] text-white border-0', getTriggerColor(template.triggerType))}
              >
                {mapTriggerLabel(template.triggerType)}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/whatsapp-programmed/${template.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Detalhes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/whatsapp-programmed/${template.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCopy(template.bodyText, template.id)}>
                  {copiedId === template.id ? (
                    <Check className="mr-2 h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Copiar Mensagem
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleToggleActive(template.id, template.isActive)}
                >
                  {template.isActive ? (
                    <>
                      <ToggleLeft className="mr-2 h-4 w-4" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <ToggleRight className="mr-2 h-4 w-4" />
                      Ativar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    setSelectedId(template.id)
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {/* Preview da mensagem */}
          <div className="bg-[#e5ddd5] dark:bg-zinc-800 rounded-lg p-3 mb-3">
            <div className="bg-[#dcf8c6] dark:bg-green-900/50 rounded-lg p-3 max-w-[95%] ml-auto shadow-sm">
              <p className="text-xs whitespace-pre-wrap line-clamp-4 leading-relaxed">
                {template.bodyText}
              </p>
            </div>
          </div>

          {/* Variáveis usadas */}
          {tokens.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tokens.slice(0, 4).map((token, idx) => (
                <Badge key={idx} variant="secondary" className="text-[9px] font-mono">
                  {`{{${token}}}`}
                </Badge>
              ))}
              {tokens.length > 4 && (
                <Badge variant="outline" className="text-[9px]">
                  +{tokens.length - 4}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header com busca e ações */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full sm:w-80"
          />
        </div>
        <Link href="/whatsapp-programmed/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Template</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </Link>
      </div>

      {/* Templates agrupados por categoria */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 rounded-full bg-muted">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Nenhum template encontrado</p>
                <p className="text-sm text-muted-foreground">
                  Crie seu primeiro template de mensagem
                </p>
              </div>
              <Link href="/whatsapp-programmed/new">
                <Button className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Criar Template
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {Object.entries(WHATSAPP_TRIGGER_GROUPS).map(([key, group]) => {
            const categoryTemplates = groupedTemplates[key] || []
            const Icon = CATEGORY_ICONS[key] || MessageSquare
            const isExpanded = expandedCategories.includes(key)
            const activeCount = categoryTemplates.filter((t) => t.isActive).length

            return (
              <Collapsible
                key={key}
                open={isExpanded}
                onOpenChange={() => toggleCategory(key)}
              >
                <Card className={cn(
                  'transition-all',
                  categoryTemplates.length === 0 && 'opacity-50'
                )}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg', group.color)}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold">{group.label}</h3>
                          <p className="text-sm text-muted-foreground">
                            {categoryTemplates.length === 0 ? (
                              'Nenhum template'
                            ) : (
                              <>
                                {categoryTemplates.length} template{categoryTemplates.length !== 1 ? 's' : ''}
                                {activeCount > 0 && (
                                  <span className="text-emerald-600 ml-1">
                                    ({activeCount} ativo{activeCount !== 1 ? 's' : ''})
                                  </span>
                                )}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {categoryTemplates.length > 0 && (
                          isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  {categoryTemplates.length > 0 && (
                    <CollapsibleContent>
                      <div className="px-4 pb-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {categoryTemplates.map(renderTemplateCard)}
                        </div>
                      </div>
                    </CollapsibleContent>
                  )}
                </Card>
              </Collapsible>
            )
          })}
        </div>
      )}

      {/* Estatísticas */}
      {templates.length > 0 && (
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-4 border-t">
          <span>{templates.length} templates</span>
          <span>•</span>
          <span className="text-emerald-600">{templates.filter((t) => t.isActive).length} ativos</span>
          <span>•</span>
          <span className="text-gray-500">{templates.filter((t) => !t.isActive).length} inativos</span>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Template"
        description="Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
