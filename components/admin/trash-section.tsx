'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, RotateCcw, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { ENTITY_TYPE_LABELS } from '@/lib/translations'

interface TrashItem {
  type: string
  id: string
  name: string
  deletedAt: string
}

export function TrashSection() {
  const [items, setItems] = useState<TrashItem[]>([])
  const [loading, setLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  useEffect(() => {
    loadTrash()
  }, [])

  async function loadTrash() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/trash')
      if (!response.ok) throw new Error('Erro ao carregar lixeira')
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error('Error loading trash:', error)
      toast.error('Erro ao carregar lixeira')
    } finally {
      setLoading(false)
    }
  }

  async function handleRestore(item: TrashItem) {
    setRestoringId(`${item.type}-${item.id}`)
    try {
      const response = await fetch('/api/admin/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: item.type, id: item.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao restaurar')
      }

      toast.success(`${ENTITY_TYPE_LABELS[item.type] || item.type} "${item.name}" restaurado com sucesso`)
      loadTrash()
    } catch (error: any) {
      console.error('Error restoring item:', error)
      toast.error(error.message || 'Erro ao restaurar item')
    } finally {
      setRestoringId(null)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Lixeira
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadTrash} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trash2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>Nenhum item na lixeira</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {items.map((item) => {
              const itemKey = `${item.type}-${item.id}`
              const isRestoring = restoringId === itemKey
              return (
                <div
                  key={itemKey}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="secondary" className="shrink-0">
                      {ENTITY_TYPE_LABELS[item.type] || item.type}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Excluído em {formatDate(item.deletedAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(item)}
                    disabled={isRestoring}
                    className="shrink-0 ml-2"
                  >
                    <RotateCcw className={`h-4 w-4 mr-1 ${isRestoring ? 'animate-spin' : ''}`} />
                    Restaurar
                  </Button>
                </div>
              )
            })}
          </div>
        )}
        {items.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {items.length} item(ns) na lixeira
          </p>
        )}
      </CardContent>
    </Card>
  )
}
