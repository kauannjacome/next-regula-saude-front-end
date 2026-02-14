'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import { RESOURCE_LABELS } from '@/lib/translations'

interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description: string | null
}

interface GroupedPermissions {
  [resource: string]: Permission[]
}

export default function SubscriberRoleFormPage() {
  const router = useRouter()
  const params = useParams()
  const subscriberId = params?.id as string
  const roleId = params?.roleId as string
  const isNew = roleId === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({})
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    color: '#3B82F6',
    priority: 1,
  })

  const loadPermissions = useCallback(async () => {
    try {
      const response = await fetch(`/api/tenant/permissions?subscriberId=${subscriberId}`)
      if (!response.ok) throw new Error('Failed to load permissions')

      const data = await response.json()
      setGroupedPermissions(data.groupedPermissions)
    } catch (error) {
      console.error('Error loading permissions:', error)
      toast.error('Erro ao carregar permissões')
    }
  }, [subscriberId])

  const loadRole = useCallback(async () => {
    try {
      const response = await fetch(`/api/tenant/roles/${roleId}`)
      if (!response.ok) throw new Error('Failed to load role')

      const data = await response.json()
      setFormData({
        name: data.role.name,
        displayName: data.role.displayName,
        description: data.role.description || '',
        color: data.role.color,
        priority: data.role.priority || 1,
      })
      setSelectedPermissions(new Set(data.role.permissions.map((p: Permission) => p.id)))
    } catch (error) {
      console.error('Error loading role:', error)
      toast.error('Erro ao carregar role')
    } finally {
      setLoading(false)
    }
  }, [roleId])

  useEffect(() => {
    loadPermissions()
    if (!isNew) {
      loadRole()
    }
  }, [isNew, loadPermissions, loadRole])

  function togglePermission(permissionId: string) {
    const newSelected = new Set(selectedPermissions)
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId)
    } else {
      newSelected.add(permissionId)
    }
    setSelectedPermissions(newSelected)
  }

  function toggleAllInResource(resource: string) {
    const resourcePermissions = groupedPermissions[resource] || []
    const resourcePermissionIds = resourcePermissions.map(p => p.id)
    const allSelected = resourcePermissionIds.every(id => selectedPermissions.has(id))

    const newSelected = new Set(selectedPermissions)
    if (allSelected) {
      resourcePermissionIds.forEach(id => newSelected.delete(id))
    } else {
      resourcePermissionIds.forEach(id => newSelected.add(id))
    }
    setSelectedPermissions(newSelected)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.displayName.trim()) {
      toast.error('Nome de exibição é obrigatório')
      return
    }

    if (selectedPermissions.size === 0) {
      toast.error('Selecione pelo menos uma permissão')
      return
    }

    setSaving(true)

    try {
      const url = isNew ? `/api/tenant/roles?subscriberId=${subscriberId}` : `/api/tenant/roles/${roleId}`
      const method = isNew ? 'POST' : 'PATCH'

      const body: any = {
        displayName: formData.displayName,
        description: formData.description || undefined,
        color: formData.color,
        priority: formData.priority,
        permissionIds: Array.from(selectedPermissions),
      }

      if (isNew) {
        body.name = formData.displayName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')
        body.subscriberId = subscriberId
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save role')
      }

      toast.success(isNew ? 'Role criada com sucesso' : 'Role atualizada com sucesso')
      router.push(`/admin/subscribers/${subscriberId}/roles`)
    } catch (error: any) {
      console.error('Error saving role:', error)
      toast.error(error.message || 'Erro ao salvar role')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => router.push(`/admin/subscribers/${subscriberId}/roles`)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {isNew ? 'Nova Role' : 'Editar Role'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Configure o nome e aparência da role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de Exibição *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Ex: Enfermeiro"

                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da role..."

                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"

                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3B82F6"

                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Input
                id="priority"
                type="number"
                min={1}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground">
                Quanto maior o número, maior o nível de poder. Ao inserir um nível já existente, os demais serão reordenados automaticamente.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissões</CardTitle>
            <CardDescription>
              Selecione as permissões que esta role terá
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([resource, permissions]) => {
                const allSelected = permissions.every(p => selectedPermissions.has(p.id))
                const someSelected = permissions.some(p => selectedPermissions.has(p.id))
                const resourceLabel = RESOURCE_LABELS[resource] || resource

                return (
                  <div key={resource} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`resource-${resource}`}
                          checked={allSelected}
                          onCheckedChange={() => toggleAllInResource(resource)}
          
                        />
                        <Label
                          htmlFor={`resource-${resource}`}
                          className="text-base font-semibold cursor-pointer"
                        >
                          {resourceLabel}
                        </Label>
                      </div>
                      <Badge variant={someSelected ? 'default' : 'secondary'}>
                        {permissions.filter(p => selectedPermissions.has(p.id)).length} / {permissions.length}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-start gap-2">
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissions.has(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
            
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={permission.id}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {permission.action}
                            </Label>
                            {permission.description && (
                              <p className="text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/subscribers/${subscriberId}/roles`)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isNew ? 'Criar Role' : 'Salvar Alterações'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
