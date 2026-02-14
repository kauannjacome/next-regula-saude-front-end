'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PageHeader, ConfirmDialog } from '@/components/shared'
import { AlertTriangle, Trash2, RotateCcw, Database, Users, FileText, Shield } from 'lucide-react'
import { toast } from 'sonner'

const defaultOptions = [
  { id: 'regulations', label: 'Regulações', description: 'Remove todas as regulações do sistema', icon: FileText, count: '0' },
  { id: 'citizens', label: 'Cidadãos', description: 'Remove todos os cidadãos cadastrados', icon: Users, count: '0' },
  { id: 'documents', label: 'Documentos', description: 'Remove todos os documentos anexados', icon: Database, count: '0' },
  { id: 'logs', label: 'Logs de Auditoria', description: 'Limpa histórico de logs do sistema', icon: Shield, count: '0' },
]

export default function AdminResetPage() {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [confirmText, setConfirmText] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [options, setOptions] = useState(defaultOptions)

  const fetchCounts = async () => {
    setIsFetching(true)
    try {
      const response = await fetch('/api/admin/reset')
      if (response.ok) {
        const counts = await response.json()
        setOptions(prev => prev.map(opt => ({
          ...opt,
          count: counts[opt.id]?.toLocaleString('pt-BR') || '0'
        })))
      }
    } catch (error) {
      console.error('Erro ao buscar contagens:', error)
    } finally {
      setIsFetching(false)
    }
  }

  // Carregar contagens reais ao montar a tela
  useEffect(() => {
    fetchCounts()
  }, [])

  const toggleOption = (id: string) => {
    if (isFetching) return
    setSelectedOptions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleReset = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: selectedOptions, password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao realizar reset')
      }

      toast.success('Reset realizado com sucesso!')
      setSelectedOptions([])
      setConfirmText('')
      setPassword('')
      fetchCounts() // Recarregar contagens após o reset
    } catch (error: any) {
      toast.error(error.message || 'Erro ao realizar reset')
    } finally {
      setIsLoading(false)
      setConfirmDialogOpen(false)
    }
  }

  const canReset = selectedOptions.length > 0 && confirmText === 'CONFIRMAR RESET' && password.length > 0

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Reset do Sistema"
        description="Área crítica para reset de dados do sistema"
        backHref="/admin/subscribers"
      />

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Atenção!</AlertTitle>
        <AlertDescription>
          Esta é uma área de operações críticas. Os dados removidos não poderão ser recuperados.
          Certifique-se de ter um backup antes de prosseguir.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Selecione os dados para resetar
          </CardTitle>
          <CardDescription>
            Marque os itens que deseja remover permanentemente do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {options.map((option: any) => {
            const Icon = option.icon
            const isSelected = selectedOptions.includes(option.id)
            return (
              <div
                key={option.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                  isSelected ? 'border-destructive bg-destructive/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => toggleOption(option.id)}
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleOption(option.id)}
                  />
                  <div className="rounded-full bg-muted p-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
                <span className="text-sm font-mono text-muted-foreground">
                  {option.count} registros
                </span>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {selectedOptions.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Confirmar Reset
            </CardTitle>
            <CardDescription>
              Para confirmar a exclusão, digite "CONFIRMAR RESET" no campo abaixo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Sua Senha</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha para confirmar"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmação</Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digite CONFIRMAR RESET"
                className="font-mono"
              />
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Itens selecionados para exclusão:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {selectedOptions.map((id) => {
                  const option = options.find((o: any) => o.id === id)
                  return option ? (
                    <li key={id}>{option.label} ({option.count} registros)</li>
                  ) : null
                })}
              </ul>
            </div>
            <Button
              variant="destructive"
              className="w-full"
              disabled={!canReset}
              onClick={() => setConfirmDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Executar Reset
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Confirmar Reset do Sistema"
        description="Esta ação é irreversível. Todos os dados selecionados serão permanentemente removidos. Deseja continuar?"
        confirmLabel={isLoading ? 'Processando...' : 'Confirmar Reset'}
        onConfirm={handleReset}
        variant="destructive"
      />
    </div>
  )
}
