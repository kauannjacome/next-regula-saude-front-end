'use client'

import { useState, useEffect } from 'react'
import { Plus, Server, Edit, Trash, Check, X, Settings2, Wifi, WifiOff, HelpCircle, Save, Zap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog, PageHeader } from '@/components/shared'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Provider {
  id: number
  uuid: string
  name: string
  provider: string
  apiUrl: string
  apiKey: string
  globalApiKey?: string
  webhookUrl?: string
  isDefault: boolean
  isActive: boolean
  maxInstances?: number
  settings?: any
  createdAt: string
}

const PROVIDER_OPTIONS = [
  { value: 'evolution', label: 'Evolution API', description: 'API open-source para WhatsApp (Recomendado)' },
  { value: 'official', label: 'WhatsApp Business API', description: 'API oficial do Meta (Alta estabilidade)' },
  { value: 'gowa', label: 'GoWa / Waha', description: 'API alternativa baseada em Go' },
  { value: 'zapi', label: 'Z-API', description: 'Serviço brasileiro de WhatsApp' },
]

export default function AdminWhatsAppPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [testingId, setTestingId] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<{ id: number; success: boolean; message: string; latency?: number; instances?: number } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    provider: 'evolution',
    apiUrl: '',
    apiKey: '',
    globalApiKey: '',
    webhookUrl: '',
    isDefault: false,
    isActive: true,
    maxInstances: ''
  })

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/whatsapp-providers')
      
      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        throw new Error('Erro ao processar resposta do servidor')
      }

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar provedores')
      }

      if (Array.isArray(data)) {
        setProviders(data)
      } else {
        setProviders([])
        console.warn('Formato de dados inesperado:', data)
      }
    } catch (error: any) {
      console.error('Erro:', error)
      toast.error(error.message || 'Erro ao carregar provedores')
      setProviders([])
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingProvider(null)
    setFormData({
      name: '',
      provider: 'evolution',
      apiUrl: '',
      apiKey: '',
      globalApiKey: '',
      webhookUrl: '',
      isDefault: false,
      isActive: true,
      maxInstances: ''
    })
    setDialogOpen(true)
  }

  const openEditDialog = (provider: Provider) => {
    setEditingProvider(provider)
    setFormData({
      name: provider.name,
      provider: provider.provider,
      apiUrl: provider.apiUrl,
      apiKey: provider.apiKey,
      globalApiKey: provider.globalApiKey || '',
      webhookUrl: provider.webhookUrl || '',
      isDefault: provider.isDefault,
      isActive: provider.isActive,
      maxInstances: provider.maxInstances?.toString() || ''
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.apiUrl || !formData.apiKey) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    // Basic URL validation
    try {
      new URL(formData.apiUrl)
      if (formData.webhookUrl) new URL(formData.webhookUrl)
    } catch (e) {
      toast.error('URL inválida. Verifique os campos de URL.')
      return
    }

    setIsSaving(true)
    try {
      const url = editingProvider
        ? `/api/admin/whatsapp-providers/${editingProvider.id}`
        : '/api/admin/whatsapp-providers'

      const response = await fetch(url, {
        method: editingProvider ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxInstances: formData.maxInstances ? parseInt(formData.maxInstances) : null
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Erro ao salvar')

      toast.success(editingProvider ? 'Provedor atualizado com sucesso!' : 'Provedor criado com sucesso!')
      setDialogOpen(false)
      fetchProviders()
    } catch (error: any) {
      console.error('Erro:', error)
      toast.error(error.message || 'Erro ao salvar provedor')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedId) return

    try {
      const response = await fetch(`/api/admin/whatsapp-providers/${selectedId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        // Mostrar mensagem de validação sem logar como erro
        toast.error(data.error || 'Erro ao excluir provedor')
        return
      }

      toast.success('Provedor excluído com sucesso!')
      setDeleteDialogOpen(false)
      fetchProviders()
    } catch (error) {
      // Apenas erros de rede/conexão são logados
      console.error('Erro de conexão:', error)
      toast.error('Erro de conexão ao excluir provedor')
    }
  }

  const handleToggleActive = async (provider: Provider) => {
    try {
      const response = await fetch(`/api/admin/whatsapp-providers/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...provider, isActive: !provider.isActive })
      })

      if (!response.ok) throw new Error('Erro ao atualizar status')

      toast.success(provider.isActive ? 'Provedor desativado' : 'Provedor ativado')
      fetchProviders()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao alterar status')
    }
  }

  const handleSetDefault = async (provider: Provider) => {
    try {
      const response = await fetch(`/api/admin/whatsapp-providers/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...provider, isDefault: true })
      })

      if (!response.ok) throw new Error('Erro ao atualizar')

      toast.success('Provedor definido como padrão')
      fetchProviders()
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao definir padrão')
    }
  }

  const handleTestConnection = async (provider: Provider) => {
    setTestingId(provider.id)
    setTestResult(null)

    try {
      const response = await fetch(`/api/admin/whatsapp-providers/${provider.id}/test`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        setTestResult({
          id: provider.id,
          success: true,
          message: data.message,
          latency: data.latency,
          instances: data.instances
        })
        toast.success(`Conexão OK! Latência: ${data.latency}ms${data.instances !== undefined ? ` | ${data.instances} instância(s)` : ''}`)
      } else {
        setTestResult({
          id: provider.id,
          success: false,
          message: data.error || 'Falha na conexão'
        })
        toast.error(data.error || 'Falha ao conectar')
      }
    } catch (error) {
      setTestResult({
        id: provider.id,
        success: false,
        message: 'Erro de rede'
      })
      toast.error('Erro ao testar conexão')
    } finally {
      setTestingId(null)
    }
  }

  // Helper to get placeholders based on provider type
  const getPlaceholders = (type: string) => {
    switch (type) {
      case 'evolution':
        return {
          apiUrl: 'https://api.evolution.seudominio.com',
          apiKey: 'Ex: B6D7C8...',
          globalApiKey: 'Ex: 4F5A1B... (Master Key)'
        }
      case 'official':
        return {
          apiUrl: 'https://graph.facebook.com/v18.0',
          apiKey: 'Ex: EAAG...',
          globalApiKey: '' 
        }
      case 'gowa':
        return {
          apiUrl: 'https://seu-servidor-gowa.com',
          apiKey: 'Não necessário para algumas versões',
          globalApiKey: ''
        }
      case 'zapi':
        return {
          apiUrl: 'https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN',
          apiKey: 'Client Token',
          globalApiKey: ''
        }
      default:
        return {
          apiUrl: 'https://api.exemplo.com',
          apiKey: 'Sua chave de API',
          globalApiKey: 'Chave Mestra (Opcional)'
        }
    }
  }

  const placeholders = getPlaceholders(formData.provider)

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Provedores WhatsApp"
        description="Gerencie as conexões com APIs de WhatsApp. Configure provedores para envio de mensagens automáticas e notificações."
      />

      {/* Alerta informativo */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Settings2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">Configuração de Sistema</p>
              <p className="mt-1 text-blue-700 dark:text-blue-300">
                Estes provedores são a base para a comunicação do sistema. O provedor marcado como <strong>Padrão</strong> será utilizado automaticamente para novas instâncias de clientes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão de adicionar */}
      <div className="flex justify-end">
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden xl:inline">Novo Provedor</span>
          <span className="xl:hidden">Novo</span>
        </Button>
      </div>

      {/* Lista de provedores */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : providers.length === 0 ? (
          <Card className="col-span-full border-dashed">
            <CardContent className="py-12 text-center flex flex-col items-center justify-center">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Server className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Nenhum provedor configurado</h3>
              <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                Adicione um provedor de API do WhatsApp para começar a enviar mensagens pelo sistema.
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Provedor
              </Button>
            </CardContent>
          </Card>
        ) : (
          providers.map(provider => (
            <Card key={provider.id} className={`transition-all hover:shadow-md ${!provider.isActive ? 'opacity-70 bg-muted/30' : ''} ${provider.isDefault ? 'border-primary/50' : ''}`}>
              <CardHeader className="pb-3 relative">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {provider.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="outline" className="font-normal">
                        {PROVIDER_OPTIONS.find(p => p.value === provider.provider)?.label || provider.provider}
                      </Badge>
                      {provider.isDefault && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 text-xs">
                          Padrão
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center">
                    {provider.isActive ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse ring-4 ring-green-500/20" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ativo e Operante</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="h-2 w-2 rounded-full bg-gray-300" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Inativo</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm mb-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">URL da API</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono truncate select-all" title={provider.apiUrl}>
                      {provider.apiUrl}
                    </code>
                  </div>
                  
                  {provider.maxInstances && (
                    <div className="flex justify-between items-center bg-muted/30 p-2 rounded">
                      <span className="text-muted-foreground">Limite de instâncias</span>
                      <Badge variant="outline">{provider.maxInstances}</Badge>
                    </div>
                  )}

                  {/* Resultado do teste de conexão */}
                  {testResult && testResult.id === provider.id && (
                    <div className={`flex items-center gap-2 p-2 rounded text-sm ${testResult.success ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'}`}>
                      {testResult.success ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      <span className="flex-1">{testResult.message}</span>
                      {testResult.latency && (
                        <Badge variant="outline" className="text-xs">{testResult.latency}ms</Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Botão de Testar Conexão */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mb-4"
                  onClick={() => handleTestConnection(provider)}
                  disabled={testingId === provider.id}
                >
                  {testingId === provider.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Testar Conexão
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between pt-4 border-t gap-2">
                   <div className="flex gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEditDialog(provider)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {!provider.isDefault && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleSetDefault(provider)}>
                              <Check className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Definir como Padrão</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-8 w-8 ${provider.isActive ? 'text-green-600 hover:text-red-600' : 'text-gray-400 hover:text-green-600'}`}
                            onClick={() => handleToggleActive(provider)}
                          >
                            {provider.isActive ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{provider.isActive ? 'Desativar' : 'Ativar'}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                   </div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedId(provider.id)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Excluir Provedor</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingProvider ? <Edit className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              {editingProvider ? 'Editar Provedor' : 'Novo Provedor WhatsApp'}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes de conexão com a API do WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Provedor *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Servidor Principal"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="provider">Tipo de Integração *</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => setFormData({ ...formData, provider: value })}
                >
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex flex-col py-1">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground">{opt.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="apiUrl" className="flex items-center gap-2">
                URL da API *
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Endereço base da API onde as requisições serão enviadas.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="relative">
                <Input
                  id="apiUrl"
                  placeholder={placeholders.apiUrl}
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                  className="pl-9 font-mono text-sm"
                />
                <Server className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-[0.8rem] text-muted-foreground">
                Certifique-se de incluir o protocolo (http:// ou https://) e a porta se necessário.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="apiKey">Chave de API (API Key) *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={placeholders.apiKey}
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="globalApiKey" className="flex items-center gap-2">
                  Chave Global (Master Key)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Chave utilizada para criar novas instâncias automaticamente. Se deixado em branco, a criação automática não funcionará.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="globalApiKey"
                  type="password"
                  placeholder={placeholders.globalApiKey}
                  value={formData.globalApiKey}
                  onChange={(e) => setFormData({ ...formData, globalApiKey: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="webhookUrl">URL de Webhook (Callback)</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://seu-sistema.com/api/webhook"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxInstances">Limite de Instâncias</Label>
                <Input
                  id="maxInstances"
                  type="number"
                  placeholder="Ilimitado"
                  value={formData.maxInstances}
                  onChange={(e) => setFormData({ ...formData, maxInstances: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive" className="cursor-pointer">Ativar Provedor</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                />
                <Label htmlFor="isDefault" className="cursor-pointer">Definir como Padrão do Sistema</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Provedor
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Provedor"
        description="Tem certeza que deseja excluir este provedor? Esta ação não pode ser desfeita e pode afetar o envio de mensagens."
        confirmLabel="Excluir Definitivamente"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
