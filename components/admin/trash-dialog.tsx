'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Trash2, RotateCcw, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { ENTITY_TYPE_LABELS } from '@/lib/translations'

interface TrashItem {
  type: string
  id: string
  name: string
  deletedAt: string
}

export function TrashDialog() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<TrashItem[]>([])
  const [loading, setLoading] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const subscriberId = session?.user?.subscriberId

  const loadTrash = useCallback(async () => {
    setLoading(true)
    try {
      const url = subscriberId
        ? `/api/admin/trash?subscriberId=${subscriberId}`
        : '/api/admin/trash'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Erro ao carregar lixeira')
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error('Error loading trash:', error)
      toast.error('Erro ao carregar lixeira')
    } finally {
      setLoading(false)
    }
  }, [subscriberId])

  useEffect(() => {
    if (open) {
      loadTrash()
    }
  }, [open, loadTrash])

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-red-400 dark:border-red-700 bg-white dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 font-semibold"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Lixeira
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Lixeira
              {subscriberId && session?.user?.subscriberName && (
                <span className="text-sm font-normal text-muted-foreground">
                  - {session.user.subscriberName}
                </span>
              )}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={loadTrash} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trash2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Lixeira vazia</p>
              <p className="text-sm mt-1">Nenhum item excluído encontrado</p>
            </div>
          ) : (
            <div className="space-y-2 pr-2">
              {items.map((item) => {
                const itemKey = `${item.type}-${item.id}`
                const isRestoring = restoringId === itemKey
                return (
                  <div
                    key={itemKey}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {ENTITY_TYPE_LABELS[item.type] || item.type}
                      </Badge>
                      <div className="min-w-0 flex-1">
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
        </div>

        {items.length > 0 && (
          <p className="text-xs text-muted-foreground text-center pt-2 border-t">
            {items.length} item(ns) na lixeira
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
