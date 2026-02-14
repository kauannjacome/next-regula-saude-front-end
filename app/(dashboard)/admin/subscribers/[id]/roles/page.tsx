'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Users, Shield } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared'

interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description: string | null
}

interface TenantRole {
  id: string
  name: string
  displayName: string
  description: string | null
  color: string
  priority: number
  isSystem: boolean
  createdAt: string
  updatedAt: string
  permissionsCount: number
  permissions: Permission[]
  usersCount: number
}

export default function SubscriberRolesPage() {
  const router = useRouter()
  const params = useParams()
  const subscriberId = params?.id as string

  const [roles, setRoles] = useState<TenantRole[]>([])
  const [loading, setLoading] = useState(true)
  const [subscriberName, setSubscriberName] = useState('')

  const loadSubscriber = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/subscribers/${subscriberId}`)
      if (response.ok) {
        const data = await response.json()
        setSubscriberName(data.name || '')
      }
    } catch (error) {
      console.error('Error loading subscriber:', error)
    }
  }, [subscriberId])

  const loadRoles = useCallback(async () => {
    try {
      const response = await fetch(`/api/tenant/roles?subscriberId=${subscriberId}`)
      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.message?.includes('create a subscriber')) {
          setRoles([])
          setLoading(false)
          return
        }
        throw new Error(errorData.error || 'Failed to load roles')
      }
      const data = await response.json()
      setRoles(data.roles || [])
    } catch (error) {
      console.error('Error loading roles:', error)
      toast.error('Erro ao carregar roles')
    } finally {
      setLoading(false)
    }
  }, [subscriberId])

  useEffect(() => {
    loadRoles()
    loadSubscriber()
  }, [loadRoles, loadSubscriber])

  async function handleDelete(roleId: string, roleName: string) {
    if (!confirm(`Tem certeza que deseja deletar a role "${roleName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/tenant/roles/${roleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete role')
      }

      toast.success('Role deletada com sucesso')
      loadRoles()
    } catch (error: any) {
      console.error('Error deleting role:', error)
      toast.error(error.message || 'Erro ao deletar role')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando roles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title={`Roles - ${subscriberName}`}
          description="Gerencie roles e permissões deste assinante"
          backHref="/admin/subscribers"
        />
        <Button onClick={() => router.push(`/admin/subscribers/${subscriberId}/roles/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Role
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...roles].sort((a, b) => b.priority - a.priority).map((role) => (
          <Card key={role.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: role.color }}
                  />
                  <div>
                    <CardTitle className="text-xl">{role.displayName}</CardTitle>
                    <CardDescription className="mt-1">
                      {role.name}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" title="Prioridade (maior = mais poder)">
                    Nível {role.priority}
                  </Badge>
                  {role.isSystem && (
                    <Badge variant="secondary">
                      <Shield className="mr-1 h-3 w-3" />
                      Sistema
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {role.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {role.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  <span>{role.permissionsCount} permissões</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{role.usersCount} usuários</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/admin/subscribers/${subscriberId}/roles/${role.id}`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {role.isSystem ? 'Ver' : 'Editar'}
                </Button>
                {!role.isSystem && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(role.id, role.displayName)}
                    disabled={role.usersCount > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {!role.isSystem && role.usersCount > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  * Não é possível deletar roles com usuários atribuídos
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {roles.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma role encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece criando uma nova role para este assinante
            </p>
            <Button onClick={() => router.push(`/admin/subscribers/${subscriberId}/roles/new`)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Role
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
