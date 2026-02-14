'use client'

import { useState, useEffect } from 'react';
import { Plus, Trash, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import apiClient from '@/lib/api/api-client'

import type { WhatsAppProgrammed } from '@/types'
import { WHATSAPP_TRIGGERS } from '@/lib/constants'

type NotificationRule = {
  id: number
  triggerEvent: string
  isActive: boolean
  whatsappProgrammedId: number | null
  whatsappTemplate?: WhatsAppProgrammed
}

// Usar constantes centralizadas de lib/constants.ts
const TRIGGER_EVENTS = WHATSAPP_TRIGGERS.map(t => ({
  value: t.value,
  label: t.label,
}))

export function AutomationTab() {
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [templates, setTemplates] = useState<WhatsAppProgrammed[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  // New Rule State
  const [newRuleTrigger, setNewRuleTrigger] = useState('')
  const [newRuleTemplate, setNewRuleTemplate] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [rulesRes, templatesRes] = await Promise.all([
        apiClient.get('/whatsapp/rules'),
        apiClient.get('/whatsapp-programmed')
      ])
      setRules(rulesRes.data || [])
      setTemplates(templatesRes.data || [])
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRule = async () => {
    if (!newRuleTrigger || !newRuleTemplate) {
      toast.error('Selecione o Gatilho e o Template')
      return
    }

    try {
      await apiClient.post('/whatsapp/rules', {
        triggerEvent: newRuleTrigger,
        templateId: newRuleTemplate
      })
      toast.success('Regra criada')
      setIsCreating(false)
      setNewRuleTrigger('')
      setNewRuleTemplate('')
      fetchData()
    } catch {
      toast.error('Erro ao criar regra')
    }
  }

  const handleDeleteRule = async (id: number) => {
    try {
      await apiClient.delete(`/whatsapp/rules/${id}`)
      toast.success('Regra removida')
      setRules(prev => prev.filter(r => r.id !== id))
    } catch {
      toast.error('Erro ao remover regra')
    }
  }

  const handleToggleRule = async (id: number, currentStatus: boolean) => {
    try {
      // Optimistic updatet
      setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !currentStatus } : r))

      await apiClient.put(`/whatsapp/rules/${id}`, {
        isActive: !currentStatus
      })
    } catch {
      toast.error('Erro ao atualizar regra')
      fetchData() // Revert on error
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Regras de Automação</h3>
        <Button onClick={() => setIsCreating(!isCreating)} variant={isCreating ? "secondary" : "default"}>
          {isCreating ? 'Cancelar' : <><Plus className="w-4 h-4 mr-2" /> Nova Regra</>}
        </Button>
      </div>

      {isCreating && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Nova Regra de Notificação</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3 items-end">
            <div className="space-y-2">
              <Label>Se Acontecer Isso (Gatilho)</Label>
              <Select value={newRuleTrigger} onValueChange={setNewRuleTrigger}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um evento..." />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_EVENTS.map(evt => (
                    <SelectItem key={evt.value} value={evt.value}>{evt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Enviar Essa Mensagem (Template)</Label>
              <Select value={newRuleTemplate} onValueChange={setNewRuleTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.length === 0 ? (
                    <SelectItem value="none" disabled>Nenhum template cadastrado</SelectItem>
                  ) : templates.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleCreateRule}>Salvar Regra</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {rules.length === 0 && !loading && (
          <div className="text-center py-10 text-muted-foreground border rounded-lg bg-gray-50 dark:bg-zinc-900/50">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500 opacity-50" />
            <p>Nenhuma regra de automação ativa.</p>
          </div>
        )}

        {rules.map(rule => {
          const triggerLabel = TRIGGER_EVENTS.find(t => t.value === rule.triggerEvent)?.label || rule.triggerEvent
          return (
            <Card key={rule.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${rule.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium">{triggerLabel}</h4>
                  <p className="text-sm text-muted-foreground">
                    Envia: <span className="font-semibold text-primary">{rule.whatsappTemplate?.name || 'Template Removido'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`switch-${rule.id}`} className="text-xs text-muted-foreground">Ativo</Label>
                  <Switch
                    id={`switch-${rule.id}`}
                    checked={rule.isActive}
                    onCheckedChange={() => handleToggleRule(rule.id, rule.isActive)}
                  />
                </div>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteRule(rule.id)}>
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
