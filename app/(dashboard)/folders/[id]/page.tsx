'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader, ConfirmDialog } from '@/components/shared'
import {
  Folder,
  Edit,
  Trash2,
  User,
  Calendar,
  FileText,
  Hash,
} from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/api/api-client'

interface FolderData {
  id: number
  uuid: string
  name: string
  idCode?: string | null
  description?: string | null
  responsibleId?: string | null
  responsible?: {
    id: string
    name: string
  } | null
  startDate?: string | null
  endDate?: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    regulations: number
  }
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function FolderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const folderId = Array.isArray(params.id) ? params.id[0] : params.id

  const [folder, setFolder] = useState<FolderData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const fetchFolder = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.get(`/folders/${folderId}`)
        setFolder(response.data || response)
      } catch (error) {
        console.error('Erro ao carregar pasta:', error)
        toast.error('Erro ao carregar pasta')
        router.push('/folders')
      } finally {
        setIsLoading(false)
      }
    }

    if (folderId) {
      fetchFolder()
    }
  }, [folderId, router])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await apiClient.delete(`/folders/${folderId}`)
      toast.success('Pasta excluida com sucesso')
      router.push('/folders')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir pasta')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-6 max-w-5xl">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!folder) {
    return (
      <div className="container py-6 max-w-5xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Pasta nao encontrada</p>
          <Link href="/folders">
            <Button variant="link" className="mt-4">Voltar</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <PageHeader
          title={folder.name}
          description="Detalhes da pasta"
          backHref="/folders"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Card: Informacoes Gerais */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-primary" />
                <CardTitle>Informacoes Gerais</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{folder.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Codigo</p>
                  <p className="font-medium">{folder.idCode || '-'}</p>
                </div>
                {folder.description && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Descricao</p>
                    <p className="mt-1">{folder.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card: Responsavel e Periodo */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Responsavel e Periodo</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Responsavel</p>
                  <p className="font-medium">{folder.responsible?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Regulacoes Vinculadas</p>
                  <Badge variant="secondary">{folder._count?.regulations || 0}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Inicio</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(folder.startDate)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Fim</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(folder.endDate)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Acoes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Acoes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/folders/${folder.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Pasta
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Pasta
              </Button>
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Informacoes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">ID</p>
                <p className="font-medium">#{folder.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">UUID</p>
                <p className="font-mono text-xs">{folder.uuid}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">{formatDateTime(folder.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Atualizado em</p>
                <p className="font-medium">{formatDateTime(folder.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog: Confirmar Exclusao */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Pasta"
        description={`Tem certeza que deseja excluir a pasta "${folder.name}"?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  )
}
