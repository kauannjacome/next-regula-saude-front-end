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
  FolderOpen,
  Edit,
  Trash2,
  Stethoscope,
  List,
} from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/api/api-client'

interface GroupData {
  id: number
  uuid: string
  name: string
  description?: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    cares: number
  }
  cares?: {
    id: number
    name: string
  }[]
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function GroupDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = Array.isArray(params.id) ? params.id[0] : params.id

  const [group, setGroup] = useState<GroupData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.get(`/groups/${groupId}`)
        setGroup(response.data || response)
      } catch (error) {
        console.error('Erro ao carregar grupo:', error)
        toast.error('Erro ao carregar grupo')
        router.push('/groups')
      } finally {
        setIsLoading(false)
      }
    }

    if (groupId) {
      fetchGroup()
    }
  }, [groupId, router])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await apiClient.delete(`/groups/${groupId}`)
      toast.success('Grupo excluido com sucesso')
      router.push('/groups')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir grupo')
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

  if (!group) {
    return (
      <div className="container py-6 max-w-5xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Grupo nao encontrado</p>
          <Link href="/groups">
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
          title={group.name}
          description="Detalhes do grupo de procedimentos"
          backHref="/groups"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Card: Informacoes Gerais */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <CardTitle>Informacoes Gerais</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome do Grupo</p>
                  <p className="font-medium">{group.name}</p>
                </div>
                {group.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Descricao</p>
                    <p className="mt-1">{group.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Procedimentos Vinculados</p>
                  <Badge variant="secondary" className="mt-1">
                    {group._count?.cares || 0} procedimento(s)
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Procedimentos (se houver) */}
          {group.cares && group.cares.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  <CardTitle>Procedimentos do Grupo</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.cares.map((care) => (
                    <Link
                      key={care.id}
                      href={`/care/${care.id}`}
                      className="flex items-center gap-2 p-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                    >
                      <List className="h-4 w-4 text-muted-foreground" />
                      <span>{care.name}</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
                <Link href={`/groups/${group.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Grupo
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Grupo
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
                <p className="font-medium">#{group.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">UUID</p>
                <p className="font-mono text-xs">{group.uuid}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">{formatDate(group.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Atualizado em</p>
                <p className="font-medium">{formatDate(group.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog: Confirmar Exclusao */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Grupo"
        description={`Tem certeza que deseja excluir o grupo "${group.name}"?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  )
}
