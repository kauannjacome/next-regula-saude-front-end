'use client'

/**
 * HOOK DE PERMISSÕES PARA FRONTEND
 *
 * Use este hook para verificar permissões em componentes React
 */

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import {
  canPerformAction,
  getAccessibleResources,
  PermissionAction,
  ResourceDefinition,
  RESOURCE_MAP
} from '@/lib/permissions/resource-map'

export interface UsePermissionReturn {
  // Se o usuário está autenticado
  isAuthenticated: boolean
  // Se está carregando a sessão
  isLoading: boolean
  // Se é System Manager
  isSystemManager: boolean
  // Nome do role do usuário
  roleName: string | null
  // Lista de permissões do usuário
  permissions: string[]
  // Verifica se pode executar uma ação em um recurso
  can: (resourceName: string, action: PermissionAction) => boolean
  // Verifica se tem uma permissão específica
  hasPermission: (permission: string) => boolean
  // Verifica se pode ver um item no menu
  canAccessMenu: (resourceName: string) => boolean
  // Retorna recursos acessíveis para o menu
  accessibleResources: ResourceDefinition[]
}

/**
 * Hook para verificar permissões no frontend
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { can, hasPermission } = usePermission()
 *
 *   return (
 *     <div>
 *       {can('regulations', 'create') && (
 *         <Button>Nova Regulação</Button>
 *       )}
 *       {can('regulations', 'delete') && (
 *         <Button variant="destructive">Excluir</Button>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function usePermission(): UsePermissionReturn {
  const { data: session, status } = useSession()

  const isLoading = status === 'loading'
  const isAuthenticated = !!session?.user
  const isSystemManager = session?.user?.isSystemManager ?? false
  const permissions = (session?.user?.permissions as string[]) ?? []

  // Nome do role vem direto da sessão (TenantRole.name do JWT)
  const roleName = useMemo(() => {
    if (isSystemManager) return 'system_manager'
    return (session?.user?.role as string) || null
  }, [isSystemManager, session?.user?.role])

  /**
   * Verifica se o usuário pode executar uma ação em um recurso
   */
  const can = useMemo(() => {
    return (resourceName: string, action: PermissionAction): boolean => {
      if (!isAuthenticated) return false

      return canPerformAction(
        resourceName,
        action,
        permissions,
        roleName,
        isSystemManager
      )
    }
  }, [isAuthenticated, permissions, roleName, isSystemManager])

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  const hasPermission = useMemo(() => {
    return (permission: string): boolean => {
      if (!isAuthenticated) return false
      if (isSystemManager) return true

      // Verificar bypass por role
      const [resourceName] = permission.split('.')
      const resource = RESOURCE_MAP[resourceName]
      if (resource && roleName && resource.bypassRoles?.includes(roleName)) {
        return true
      }

      return permissions.includes(permission)
    }
  }, [isAuthenticated, permissions, roleName, isSystemManager])

  /**
   * Verifica se o usuário pode ver um item no menu
   */
  const canAccessMenu = useMemo(() => {
    return (resourceName: string): boolean => {
      if (!isAuthenticated) return false

      const resource = RESOURCE_MAP[resourceName]
      if (!resource) return false

      // System Manager só vê menus admin
      if (isSystemManager) {
        return resource.href.startsWith('/admin/')
      }

      // Não mostrar menus admin para usuários normais
      if (resource.href.startsWith('/admin/')) {
        return false
      }

      // Settings é sempre acessível
      if (resource.name === 'settings') {
        return true
      }

      // Verificar bypass por role
      if (roleName && resource.bypassRoles?.includes(roleName)) {
        return true
      }

      // Verificar permissões de menu
      if (resource.menuPermissions.length === 0) {
        return false
      }

      return resource.menuPermissions.some(perm => permissions.includes(perm))
    }
  }, [isAuthenticated, permissions, roleName, isSystemManager])

  /**
   * Lista de recursos acessíveis para montar o menu
   */
  const accessibleResources = useMemo(() => {
    if (!isAuthenticated) return []

    return getAccessibleResources(permissions, roleName, isSystemManager)
  }, [isAuthenticated, permissions, roleName, isSystemManager])

  return {
    isAuthenticated,
    isLoading,
    isSystemManager,
    roleName,
    permissions,
    can,
    hasPermission,
    canAccessMenu,
    accessibleResources,
  }
}

/**
 * Hook simplificado para verificar uma permissão específica
 *
 * @example
 * ```tsx
 * function DeleteButton() {
 *   const canDelete = useCanPerform('regulations', 'delete')
 *   if (!canDelete) return null
 *   return <Button>Excluir</Button>
 * }
 * ```
 */
export function useCanPerform(resourceName: string, action: PermissionAction): boolean {
  const { can, isLoading } = usePermission()

  if (isLoading) return false

  return can(resourceName, action)
}

/**
 * Hook para verificar se pode acessar um menu
 */
export function useCanAccessMenu(resourceName: string): boolean {
  const { canAccessMenu, isLoading } = usePermission()

  if (isLoading) return false

  return canAccessMenu(resourceName)
}
