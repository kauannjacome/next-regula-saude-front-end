'use client'

import { useState, useMemo } from 'react'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { whatsappProgrammedSchema, type WhatsAppProgrammedFormData } from '@/lib/validators'
import { WHATSAPP_TRIGGER_GROUPS } from '@/lib/constants'
import { TOKEN_CATEGORIES, getTokensByCategory, formatMustacheToken, extractMustacheTokens, isValidMustacheToken } from '@/lib/templates/template-variables'
import { TemplateEditor } from '@/components/ui/template-editor'
import { TemplateSuggestions, type TemplateSuggestion } from './template-suggestions'
import {
  Loader2,
  MessageSquare,
  Settings,
  Eye,
  ChevronDown,
  User,
  Users,
  FileText,
  Calendar,
  UserPlus,
  UserCheck,
  Stethoscope,
  Building2,
  Folder,
  Truck,
  Building,
  Activity,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  Pill,
  Package,
  Heart,
  FileCheck,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Escapa caracteres especiais de HTML para prevenir XSS
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Mapeamento de ícones para triggers
const TRIGGER_ICON_MAP: Record<string, React.ElementType> = {
  FileText,
  Calendar,
  Pill,
  Package,
  Heart,
  FileCheck,
  MessageSquare,
}

// Mapeamento de ícones para variáveis
const ICON_MAP: Record<string, React.ElementType> = {
  User,
  Users,
  FileText,
  Calendar,
  UserPlus,
  UserCheck,
  Stethoscope,
  Building2,
  Folder,
  Truck,
  Building,
  Activity,
}

interface WhatsAppProgrammedFormProps {
  defaultValues?: WhatsAppProgrammedFormData
  onSubmit: (data: WhatsAppProgrammedFormData) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

export function WhatsAppProgrammedForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Salvar Template',
}: WhatsAppProgrammedFormProps) {
  const [activeTab, setActiveTab] = useState('editor')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [selectedTriggerGroup, setSelectedTriggerGroup] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
    watch,
  } = useForm<WhatsAppProgrammedFormData>({
    resolver: zodResolver(whatsappProgrammedSchema) as any,
    defaultValues: defaultValues || {
      triggerType: 'STATUS_PENDING',
      isActive: true,
      bodyText: '',
      headerText: '',
      footerText: '',
    },
  })

  const isActive = useWatch({ control, name: 'isActive' })
  const triggerType = watch('triggerType')
  const bodyText = watch('bodyText')
  const headerText = watch('headerText')
  const footerText = watch('footerText')

  // Encontra o grupo do trigger selecionado
  const currentTriggerGroup = useMemo(() => {
    for (const [groupKey, group] of Object.entries(WHATSAPP_TRIGGER_GROUPS)) {
      if (group.triggers.some((t) => t.value === triggerType)) {
        return groupKey
      }
    }
    return 'status'
  }, [triggerType])

  // Atualiza o grupo selecionado quando o trigger muda
  useState(() => {
    setSelectedTriggerGroup(currentTriggerGroup)
  })

  // Tokens usados no template
  const usedTokens = useMemo(() => {
    const allText = `${headerText || ''} ${bodyText || ''} ${footerText || ''}`
    return extractMustacheTokens(allText)
  }, [headerText, bodyText, footerText])

  // Tokens inválidos
  const invalidTokens = useMemo(() => {
    return usedTokens.filter((token) => !isValidMustacheToken(token))
  }, [usedTokens])

  // Preview da mensagem
  const previewMessage = useMemo(() => {
    const sampleData: Record<string, string> = {
      'paciente.nome': 'João da Silva',
      'paciente.cpf': '123.456.789-00',
      'paciente.telefone': '(11) 99999-9999',
      'paciente.idade': '45',
      'paciente.cidade': 'São Paulo',
      'agendamento.data': '15/03/2024 às 14:30',
      'agendamento.status': 'Confirmado',
      'regulacao.protocolo': 'REG-2024-00123',
      'regulacao.status': 'Aprovada',
      'profissional.nome': 'Dr. Maria Santos',
      'unidade.nome': 'UBS Central',
      'unidade.telefone': '(11) 3333-4444',
    }

    let preview = escapeHtml(bodyText || '')
    Object.entries(sampleData).forEach(([token, value]) => {
      preview = preview.replace(new RegExp(`\\{\\{${token}\\}\\}`, 'g'), `**${escapeHtml(value)}**`)
    })

    preview = preview.replace(/\{\{([^}]+)\}\}/g, '`{{$1}}`')

    return preview
  }, [bodyText])

  // Copia token para clipboard
  const copyToken = (token: string) => {
    navigator.clipboard.writeText(formatMustacheToken(token))
    setCopiedToken(token)
    toast.success('Token copiado!')
    setTimeout(() => setCopiedToken(null), 2000)
  }

  // Toggle categoria expandida
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    )
  }

  // Aplica template sugerido
  const applyTemplateSuggestion = (template: TemplateSuggestion) => {
    setValue('bodyText', template.bodyText)
    setValue('triggerType', template.triggerType as any)
    if (!watch('name')) {
      setValue('name', template.name)
    }
  }

  // Renderiza ícone
  const renderIcon = (iconName: string, size = 16) => {
    const IconComponent = ICON_MAP[iconName] || TRIGGER_ICON_MAP[iconName]
    return IconComponent ? <IconComponent size={size} /> : null
  }

  // Obtém label do trigger atual
  const getCurrentTriggerLabel = () => {
    for (const group of Object.values(WHATSAPP_TRIGGER_GROUPS)) {
      const trigger = group.triggers.find((t) => t.value === triggerType)
      if (trigger) return trigger.label
    }
    return triggerType
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna Principal - Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Configuração Básica */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Configuração</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nome e Ativo */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome do Template *</Label>
                  <Input placeholder="Ex: Confirmação de Agendamento" {...register('name')} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Template Ativo</Label>
                    <p className="text-xs text-muted-foreground">Mensagens só são enviadas quando ativo</p>
                  </div>
                  <Switch checked={!!isActive} onCheckedChange={(checked) => setValue('isActive', checked)} />
                </div>
              </div>

              {/* Seletor de Gatilho Segmentado */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Quando disparar a mensagem? *
                </Label>

                {/* Tabs de Categoria */}
                <Tabs value={selectedTriggerGroup} onValueChange={setSelectedTriggerGroup}>
                  <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
                    {Object.entries(WHATSAPP_TRIGGER_GROUPS).map(([key, group]) => {
                      const TriggerIcon = TRIGGER_ICON_MAP[group.icon] || MessageSquare
                      return (
                        <TabsTrigger
                          key={key}
                          value={key}
                          className={cn(
                            'flex items-center gap-1.5 text-xs px-3 py-1.5 data-[state=active]:shadow-sm',
                            currentTriggerGroup === key && 'ring-2 ring-primary ring-offset-1'
                          )}
                        >
                          <TriggerIcon className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{group.label}</span>
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>

                  {/* Opções de cada categoria */}
                  {Object.entries(WHATSAPP_TRIGGER_GROUPS).map(([key, group]) => (
                    <TabsContent key={key} value={key} className="mt-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {group.triggers.map((trigger) => (
                          <button
                            key={trigger.value}
                            type="button"
                            onClick={() => setValue('triggerType', trigger.value as any)}
                            className={cn(
                              'flex items-center gap-2 p-3 rounded-lg border text-left transition-all',
                              'hover:border-primary/50 hover:bg-muted/50',
                              triggerType === trigger.value
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-border'
                            )}
                          >
                            <div
                              className={cn(
                                'w-2 h-2 rounded-full shrink-0',
                                triggerType === trigger.value ? group.color : 'bg-gray-300'
                              )}
                            />
                            <span className="text-sm font-medium truncate">{trigger.label}</span>
                          </button>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                {/* Indicador do gatilho selecionado */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm">
                    Gatilho selecionado:{' '}
                    <Badge variant="secondary" className="ml-1">
                      {getCurrentTriggerLabel()}
                    </Badge>
                  </span>
                </div>

                {errors.triggerType && (
                  <p className="text-sm text-destructive">{errors.triggerType.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Editor de Mensagem */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Conteúdo da Mensagem</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <TemplateSuggestions onSelect={applyTemplateSuggestion} />
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="h-8">
                      <TabsTrigger value="editor" className="text-xs px-3">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Editor
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="text-xs px-3">
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
              <CardDescription>
                Use variáveis como <code className="text-xs bg-muted px-1 py-0.5 rounded">{`{{paciente.nome}}`}</code>{' '}
                para personalizar a mensagem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeTab === 'editor' ? (
                <>
                  <div className="space-y-2">
                    <Label>Cabeçalho</Label>
                    <Input placeholder="Título da mensagem (opcional)" {...register('headerText')} />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Corpo da Mensagem *
                      <span className="text-xs text-muted-foreground ml-2">
                        (Digite {`{{`} para ver as variáveis)
                      </span>
                    </Label>
                    <Controller
                      name="bodyText"
                      control={control}
                      render={({ field }) => (
                        <TemplateEditor
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Olá {{paciente.nome}}, seu agendamento foi confirmado para {{agendamento.data}}..."
                          minHeight="180px"
                          maxHeight="400px"
                          error={errors.bodyText?.message}
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rodapé</Label>
                    <Input placeholder="Texto do rodapé (opcional)" {...register('footerText')} />
                  </div>

                  {/* Tokens usados */}
                  {usedTokens.length > 0 && (
                    <div className="pt-4 border-t">
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Variáveis utilizadas ({usedTokens.length})
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {usedTokens.map((token, idx) => {
                          const isInvalid = !isValidMustacheToken(token)
                          return (
                            <Badge
                              key={idx}
                              variant={isInvalid ? 'destructive' : 'secondary'}
                              className="text-xs font-mono"
                            >
                              {isInvalid && <AlertCircle className="h-3 w-3 mr-1" />}
                              {`{{${token}}}`}
                            </Badge>
                          )
                        })}
                      </div>
                      {invalidTokens.length > 0 && (
                        <p className="text-xs text-destructive mt-2">
                          {invalidTokens.length} variável(is) não reconhecida(s)
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Preview */
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">WhatsApp Preview</p>
                        <p className="text-xs text-muted-foreground">Como a mensagem aparecerá</p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm">
                      {headerText && (
                        <p className="font-semibold text-sm border-b pb-2 mb-2">{headerText}</p>
                      )}
                      <div
                        className="text-sm whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: previewMessage
                            .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-primary">$1</strong>')
                            .replace(/`([^`]+)`/g, '<code class="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1 rounded text-xs">$1</code>'),
                        }}
                      />
                      {footerText && (
                        <p className="text-xs text-muted-foreground border-t pt-2 mt-2">{footerText}</p>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      * Valores em destaque são exemplos. Variáveis em amarelo ainda não têm valor definido.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral - Variáveis */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Variáveis Disponíveis
              </CardTitle>
              <CardDescription className="text-xs">
                Clique para copiar e colar no editor
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="px-4 pb-4 space-y-1">
                  {TOKEN_CATEGORIES.map((category) => {
                    const tokens = getTokensByCategory(category.id)
                    const isExpanded = expandedCategories.includes(category.id)

                    return (
                      <Collapsible key={category.id} open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
                        <CollapsibleTrigger className="w-full">
                          <div
                            className={cn(
                              'flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
                              'hover:bg-muted/50',
                              isExpanded && 'bg-muted/30'
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div className={cn('p-1.5 rounded-md text-white', category.color)}>
                                {renderIcon(category.icon, 14)}
                              </div>
                              <span className="text-sm font-medium">{category.label}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {tokens.length}
                              </Badge>
                            </div>
                            <ChevronDown
                              className={cn('h-4 w-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')}
                            />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="pl-4 pr-2 py-1 space-y-0.5">
                            {tokens.map((token) => (
                              <button
                                key={token.token}
                                type="button"
                                onClick={() => copyToken(token.token)}
                                className={cn(
                                  'w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left',
                                  'hover:bg-muted/50 transition-colors group'
                                )}
                              >
                                <div className="min-w-0 flex-1">
                                  <code className="text-xs font-mono text-primary block truncate">
                                    {token.token}
                                  </code>
                                  <span className="text-xs text-muted-foreground truncate block">
                                    {token.label}
                                  </span>
                                </div>
                                <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {copiedToken === token.token ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botão Submit */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="min-w-[150px]">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  )
}
