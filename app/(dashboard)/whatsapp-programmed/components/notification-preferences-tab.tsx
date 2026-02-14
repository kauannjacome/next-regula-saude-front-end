'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, MessageSquare, FileText, Calendar, Pill, Package, Heart, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { toast } from 'sonner'
import { WHATSAPP_TRIGGER_GROUPS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface NotificationPreference {
  triggerType: string
  label: string
  state: 'ON' | 'OFF'
  templateId: number | null
  selectedTemplate: {
    id: number
    name: string
    bodyText: string
  } | null
  availableTemplates: Array<{ id: number; name: string; bodyText: string }>
}

interface PreferencesData {
  preferences: NotificationPreference[]
}

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

// Função para substituir variáveis por valores de exemplo
const replaceVariables = (text: string) => {
  return text
    .replace(/\{\{nome_cidadao\}\}/g, 'Maria Silva')
    .replace(/\{\{paciente\.nome\}\}/g, 'Maria Silva')
    .replace(/\{\{nome_profissional\}\}/g, 'Dr. Carlos Santos')
    .replace(/\{\{profissional\.nome\}\}/g, 'Dr. Carlos Santos')
    .replace(/\{\{data_agendamento\}\}/g, '15/03/2024')
    .replace(/\{\{agendamento\.data\}\}/g, '15/03/2024')
    .replace(/\{\{hora_agendamento\}\}/g, '14:30')
    .replace(/\{\{local_agendamento\}\}/g, 'UBS Centro')
    .replace(/\{\{endereco\}\}/g, 'Rua das Flores, 123')
    .replace(/\{\{tipo_atendimento\}\}/g, 'Consulta Cardiologia')
    .replace(/\{\{numero_protocolo\}\}/g, 'REG-2024-00123')
    .replace(/\{\{regulacao\.protocolo\}\}/g, 'REG-2024-00123')
    .replace(/\{\{nome_unidade\}\}/g, 'UBS Vila Nova')
    .replace(/\{\{unidade\.nome\}\}/g, 'UBS Vila Nova')
    .replace(/\{\{telefone_unidade\}\}/g, '(11) 3456-7890')
    .replace(/\{\{medicamento\}\}/g, 'Losartana 50mg')
    .replace(/\{\{quantidade\}\}/g, '30 comprimidos')
    .replace(/\{\{nome_municipio\}\}/g, 'São Paulo')
    .replace(/\{\{prioridade\}\}/g, 'Alta')
    .replace(/\{\{observacao\}\}/g, 'Trazer exames anteriores')
    .replace(/\{\{[^}]+\}\}/g, '[...]') // Remover variáveis não substituídas
}

export function NotificationPreferencesTab() {
  const [data, setData] = useState<PreferencesData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/whatsapp/notification-preferences')
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || result.details || 'Erro ao buscar preferências')
      }
      // Normalizar: converter ALWAYS_ASK para ON
      const normalized = {
        ...result,
        preferences: result.preferences?.map((p: any) => ({
          ...p,
          state: p.state === 'OFF' ? 'OFF' : 'ON'
        })) || []
      }
      setData(normalized)
    } catch (error: any) {
      console.error('Erro:', error)
      toast.error(error.message || 'Erro ao carregar preferências')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = async (triggerType: string, currentState: 'ON' | 'OFF') => {
    if (!data) return

    const newState = currentState === 'ON' ? 'OFF' : 'ON'

    // Atualizar localmente primeiro (optimistic update)
    setData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        preferences: prev.preferences.map(p =>
          p.triggerType === triggerType ? { ...p, state: newState } : p
        )
      }
    })

    try {
      const response = await fetch('/api/whatsapp/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerType, state: newState })
      })

      if (!response.ok) throw new Error('Erro ao salvar')
      toast.success(newState === 'ON' ? 'Notificação ativada' : 'Notificação desativada')
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao salvar preferência')
      fetchPreferences()
    }
  }

  const handleTemplateChange = async (triggerType: string, templateId: string) => {
    if (!data) return

    const numericId = parseInt(templateId)

    // Atualizar localmente
    setData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        preferences: prev.preferences.map(p => {
          if (p.triggerType === triggerType) {
            const newTemplate = p.availableTemplates.find(t => t.id === numericId)
            return {
              ...p,
              templateId: numericId,
              selectedTemplate: newTemplate || p.selectedTemplate
            }
          }
          return p
        })
      }
    })

    // Salvar no backend
    try {
      const response = await fetch('/api/whatsapp/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerType, templateId: numericId })
      })

      if (!response.ok) throw new Error('Erro ao salvar')
      toast.success('Template atualizado')
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao salvar template')
      fetchPreferences()
    }
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  // Agrupar preferências por categoria
  const getPreferencesByCategory = (categoryKey: string) => {
    if (!data) return []
    const group = WHATSAPP_TRIGGER_GROUPS[categoryKey as keyof typeof WHATSAPP_TRIGGER_GROUPS]
    if (!group) return []
    const triggerValues = group.triggers.map(t => t.value) as readonly string[]
    return data.preferences.filter(p => triggerValues.includes(p.triggerType))
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">Erro ao carregar preferências</p>
          <Button variant="link" onClick={fetchPreferences}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {Object.entries(WHATSAPP_TRIGGER_GROUPS).map(([categoryKey, group]) => {
        const categoryPrefs = getPreferencesByCategory(categoryKey)
        if (categoryPrefs.length === 0) return null

        const Icon = CATEGORY_ICONS[categoryKey] || MessageSquare
        const isExpanded = expandedCategories.includes(categoryKey)
        const onCount = categoryPrefs.filter(p => p.state === 'ON').length

        return (
          <Collapsible key={categoryKey} open={isExpanded} onOpenChange={() => toggleCategory(categoryKey)}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg', group.color)}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">{group.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {categoryPrefs.length} tipo{categoryPrefs.length !== 1 ? 's' : ''} de mensagem
                        {onCount > 0 && (
                          <span className="text-emerald-600 ml-1">
                            ({onCount} ativo{onCount !== 1 ? 's' : ''})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 space-y-3">
                  {categoryPrefs.map(pref => (
                    <div key={pref.triggerType} className="border rounded-lg p-4">
                      {/* Cabeçalho com nome e switch */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{pref.label}</p>
                          {pref.selectedTemplate && pref.state === 'ON' && (
                            <p className="text-xs text-muted-foreground">
                              Template: {pref.selectedTemplate.name}
                            </p>
                          )}
                        </div>

                        {/* Switch Ligado/Desligado */}
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-xs font-medium',
                            pref.state === 'ON' ? 'text-emerald-600' : 'text-muted-foreground'
                          )}>
                            {pref.state === 'ON' ? 'Ligado' : 'Desligado'}
                          </span>
                          <Switch
                            checked={pref.state === 'ON'}
                            onCheckedChange={() => handleToggle(pref.triggerType, pref.state)}
                          />
                        </div>
                      </div>

                      {/* Preview da mensagem (estilo WhatsApp) */}
                      {pref.state === 'ON' && pref.selectedTemplate && (
                        <div className="mt-3 bg-[#e5ddd5] dark:bg-zinc-800 p-3 rounded-lg">
                          <div className="bg-[#dcf8c6] dark:bg-green-900/50 rounded-lg p-3 max-w-[90%] ml-auto shadow-sm">
                            <p className="text-xs whitespace-pre-wrap leading-relaxed line-clamp-4">
                              {replaceVariables(pref.selectedTemplate.bodyText)}
                            </p>
                            <p className="text-[10px] text-gray-500 text-right mt-1">14:30</p>
                          </div>
                        </div>
                      )}

                      {/* Mensagem quando não há templates */}
                      {pref.state === 'ON' && !pref.selectedTemplate && pref.availableTemplates.length === 0 && (
                        <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            Nenhum template configurado. Crie um em "Meus Templates".
                          </p>
                        </div>
                      )}

                      {/* Seletor de template quando há mais de um */}
                      {pref.state === 'ON' && pref.availableTemplates.length > 1 && (
                        <div className="mt-3">
                          <label className="text-xs text-muted-foreground block mb-2">
                            Modelo de mensagem:
                          </label>
                          <Select
                            value={pref.templateId ? String(pref.templateId) : String(pref.availableTemplates[0]?.id)}
                            onValueChange={(value) => handleTemplateChange(pref.triggerType, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione um template" />
                            </SelectTrigger>
                            <SelectContent>
                              {pref.availableTemplates.map(t => (
                                <SelectItem key={t.id} value={String(t.id)}>
                                  {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )
      })}

      {/* Estatísticas */}
      {data.preferences.length > 0 && (
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-4 border-t">
          <span>{data.preferences.length} tipos de notificação</span>
          <span>•</span>
          <span className="text-emerald-600">
            {data.preferences.filter(p => p.state === 'ON').length} ativas
          </span>
          <span>•</span>
          <span className="text-gray-500">
            {data.preferences.filter(p => p.state === 'OFF').length} desativadas
          </span>
        </div>
      )}
    </div>
  )
}
