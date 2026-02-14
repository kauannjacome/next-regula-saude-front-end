'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, QrCode, RefreshCw, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import apiClient from '@/lib/api/api-client'

interface WhatsAppConfig {
  isActive: boolean
  provider: string
  apiUrl: string
  apiKey: string
  instanceName: string
  instanceStatus?: string
  lastConnectedAt?: string
}

interface AvailableProvider {
  id: number
  uuid: string
  name: string
  provider: string
  isDefault: boolean
}

export function SettingsTab() {
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [config, setConfig] = useState<WhatsAppConfig | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([])
  const [hasMultipleProviders, setHasMultipleProviders] = useState(false)
  const [changingProvider, setChangingProvider] = useState(false)

  // Load config and providers on mount
  useEffect(() => {
    loadConfig()
    loadProviders()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/whatsapp/config')
      if (res.data) setConfig(res.data)
    } catch {
      // Config não existe ainda
      setConfig({
        isActive: false,
        provider: 'evolution',
        apiUrl: '',
        apiKey: '',
        instanceName: '',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadProviders = async () => {
    try {
      const res = await apiClient.get('/whatsapp/available-providers')
      if (res.data) {
        setAvailableProviders(res.data.providers || [])
        setHasMultipleProviders(res.data.hasMultipleProviders || false)
      }
    } catch {
      // Usar evolution como fallback
      setAvailableProviders([
        {
          id: 0,
          uuid: 'default-evolution',
          name: 'Evolution API',
          provider: 'evolution',
          isDefault: true,
        },
      ])
      setHasMultipleProviders(false)
    }
  }

  const handleToggleActive = async () => {
    if (!config) return

    const newActive = !config.isActive
    setConfig((prev) => (prev ? { ...prev, isActive: newActive } : null))

    try {
      await apiClient.post('/whatsapp/config', { ...config, isActive: newActive })
      toast.success(newActive ? 'WhatsApp ativado!' : 'WhatsApp desativado')
    } catch {
      // Reverter
      setConfig((prev) => (prev ? { ...prev, isActive: !newActive } : null))
      toast.error('Erro ao alterar configuração')
    }
  }

  const handleProviderChange = async (newProvider: string) => {
    if (!config || newProvider === config.provider) return

    setChangingProvider(true)
    const oldProvider = config.provider

    try {
      // Atualizar estado otimisticamente
      setConfig((prev) => (prev ? { ...prev, provider: newProvider } : null))

      // Salvar no backend
      await apiClient.post('/whatsapp/config', { ...config, provider: newProvider })

      toast.success(`Provedor alterado para ${getProviderLabel(newProvider)}`)

      // Limpar QR code pois mudou de provedor
      setQrCode(null)
    } catch {
      // Reverter
      setConfig((prev) => (prev ? { ...prev, provider: oldProvider } : null))
      toast.error('Erro ao alterar provedor')
    } finally {
      setChangingProvider(false)
    }
  }

  const handleConnect = async () => {
    if (!config) return

    setConnecting(true)
    setQrCode(null)

    try {
      const res = await apiClient.post('/whatsapp/connect', { provider: config.provider })

      if (res.data.connected) {
        toast.success('WhatsApp já está conectado!')
        loadConfig()
      } else if (res.data.qrcode) {
        setQrCode(res.data.qrcode)
        toast.success('QR Code gerado! Escaneie com seu WhatsApp.')
      } else {
        toast.error('Não foi possível gerar o QR Code')
      }
    } catch (error: unknown) {
      console.error('Erro:', error)
      const err = error as { response?: { data?: { error?: string } } }
      const message = err?.response?.data?.error || 'Erro ao conectar'
      toast.error(message)
    } finally {
      setConnecting(false)
    }
  }

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'evolution':
        return 'Evolution API'
      case 'official':
        return 'WhatsApp Business API (Oficial)'
      default:
        return provider || 'Não configurado'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const isConnected = config?.instanceStatus === 'connected'
  const providerLabel = getProviderLabel(config?.provider || '')

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Info card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">Conexao WhatsApp</p>
              <p className="mt-1 text-blue-700 dark:text-blue-300">
                {hasMultipleProviders
                  ? 'Escolha o provedor desejado e escaneie o QR Code para conectar seu numero.'
                  : 'O provedor de WhatsApp e configurado pelo administrador do sistema. Voce so precisa escanear o QR Code para conectar seu numero.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status e Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {config?.isActive ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-gray-400" />
            )}
            Status do WhatsApp
          </CardTitle>
          <CardDescription>Ative ou desative o envio de mensagens automaticas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toggle de ativacao */}
          <div className="flex items-center justify-between border p-4 rounded-lg">
            <div className="space-y-0.5">
              <Label className="font-medium">Mensagens Automaticas</Label>
              <p className="text-sm text-muted-foreground">
                {config?.isActive
                  ? 'Mensagens serao enviadas conforme suas preferencias'
                  : 'Nenhuma mensagem sera enviada automaticamente'}
              </p>
            </div>
            <Switch checked={config?.isActive || false} onCheckedChange={handleToggleActive} />
          </div>

          {/* Info do provedor */}
          <div className="border p-4 rounded-lg space-y-3">
            {/* Seletor de provedor - só aparece se houver múltiplos */}
            {hasMultipleProviders ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Provedor</span>
                <Select
                  value={config?.provider || 'evolution'}
                  onValueChange={handleProviderChange}
                  disabled={changingProvider}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Selecione o provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProviders.map((p) => (
                      <SelectItem key={p.uuid} value={p.provider}>
                        {p.name}
                        {p.isDefault && ' (Padrao)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Provedor</span>
                <Badge variant="secondary">{providerLabel}</Badge>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Instancia</span>
              <span className="text-sm font-mono">{config?.instanceName || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status da Conexao</span>
              {isConnected ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Desconectado
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conexao QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Conectar WhatsApp
          </CardTitle>
          <CardDescription>Escaneie o QR Code com seu WhatsApp para conectar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrCode ? (
              <>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Escaneie o QR Code</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Abra o WhatsApp no seu celular &gt; Menu &gt; Aparelhos conectados &gt;
                    Conectar
                  </p>
                </div>
                <Button variant="outline" onClick={handleConnect} disabled={connecting}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${connecting ? 'animate-spin' : ''}`} />
                  Gerar Novo QR Code
                </Button>
              </>
            ) : (
              <>
                <div className="text-center py-8">
                  <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Clique no botao abaixo para gerar um QR Code de conexao
                  </p>
                  <Button onClick={handleConnect} disabled={connecting}>
                    {connecting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4 mr-2" />
                        Gerar QR Code
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
