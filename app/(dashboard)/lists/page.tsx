'use client'

import { useState, useEffect } from 'react';
import { QrCode, Clock, ExternalLink, Trash2, Layers, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTableLayout, ConfirmDialog } from '@/components/shared';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link'

interface List {
  id: number
  hash: string
  type: string
  expiresAt: string
  createdAt: string
  accessCount: number
  accessLimit: number
  _count: {
    regulations: number
    schedules: number
  }
}

export default function ListsPage() {
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteHash, setDeleteHash] = useState<string | null>(null)

  const fetchLists = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/lists')
      const data = await res.json()
      if (!res.ok) {
        const message = data?.error || data?.message || data?.details?.message || 'Erro ao carregar listas'
        throw new Error(message)
      }
      const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setLists(items)
    } catch (err: any) {
      const message = err?.message || 'Erro ao carregar listas'
      toast.error('Erro ao carregar listas: ' + message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLists()
  }, [])

  const handleDelete = async () => {
    if (!deleteHash) return
    try {
      const res = await fetch(`/api/lists/${deleteHash}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const message = data?.error || data?.message || data?.details?.message || 'Erro ao excluir lista'
        throw new Error(message)
      }
      toast.success(data?.message || 'Lista excluída com sucesso')
      fetchLists()
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao excluir lista')
    } finally {
      setDeleteHash(null)
    }
  }

  const getStatus = (expiresAt: string) => {
    const isExpired = new Date() > new Date(expiresAt)
    return isExpired ? (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="w-3 h-3" /> Expirado
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 gap-1">
        <CheckCircle2 className="w-3 h-3" /> Ativo
      </Badge>
    )
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'STATUS': return 'Atualização de Status'
      case 'UPLOAD': return 'Coleta de Documentos'
      case 'SUPPLIER_LIST': return 'Lista Fornecedor'
      default: return type
    }
  }

  return (
    <DataTableLayout
      title="Minhas Listas"
      subtitle="Gerencie os links e QR codes gerados por você"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-slate-50" />
              <CardContent className="h-32" />
            </Card>
          ))
        ) : lists.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
            <Layers className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium">Nenhuma lista encontrada</p>
            <Link href="/regulations">
              <Button variant="link">Crie uma nova lista nas Regulações</Button>
            </Link>
          </div>
        ) : (
          lists.map((list) => (
            <Card key={list.id} className="overflow-hidden group hover:border-indigo-200 transition-colors">
              <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold truncate max-w-[150px]">
                      #{list.id} • {getTypeLabel(list.type)}
                    </CardTitle>
                    {getStatus(list.expiresAt)}
                  </div>
                  <CardDescription className="text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Criado em {format(new Date(list.createdAt), 'dd/MM/yy HH:mm', { locale: ptBR })}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-red-500"
                  onClick={() => setDeleteHash(list.hash)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="flex items-center gap-4 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Itens</span>
                    <span className="text-sm font-bold text-slate-700">
                      {list._count.regulations + list._count.schedules} registros
                    </span>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Acessos</span>
                    <span className="text-sm font-bold text-slate-700">
                      {list.accessCount}/{list.accessLimit}
                    </span>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Expira em</span>
                    <span className="text-sm font-medium text-slate-700">
                      {format(new Date(list.expiresAt), 'HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 h-9 gap-2 text-xs" asChild>
                    <a href={`/list/${list.hash}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Abrir Link
                    </a>
                  </Button>
                  <Button variant="secondary" className="flex-1 h-9 gap-2 text-xs">
                    <QrCode className="w-3.5 h-3.5" />
                    Ver QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deleteHash}
        onOpenChange={(open) => !open && setDeleteHash(null)}
        title="Excluir Lista"
        description="Tem certeza que deseja excluir esta lista? O link e QR code pararão de funcionar imediatamente."
        onConfirm={handleDelete}
        confirmLabel="Excluir"
        variant="destructive"
      />
    </DataTableLayout>
  )
}
