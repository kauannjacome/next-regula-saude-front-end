'use client'

/**
 * COMPONENTE DE CONTROLE DE PERMISSÕES
 *
 * Use este componente para mostrar/esconder elementos baseado em permissões
 */

import { ReactNode } from 'react'
import { usePermission, useCanPerform } from '@/hooks/use-permission'
import { PermissionAction } from '@/lib/permissions/resource-map'

interface PermissionGateProps {
  children: ReactNode
  // Fallback para quando não tem permissão (opcional)
  fallback?: ReactNode
}

interface ResourcePermissionGateProps extends PermissionGateProps {
  // Nome do recurso (ex: 'regulations', 'citizens')
  resource: string
  // Ação necessária (ex: 'read', 'create', 'delete')
  action: PermissionAction
}

interface SpecificPermissionGateProps extends PermissionGateProps {
  // Permissão específica (ex: 'regulations.delete')
  permission: string
}

interface RoleGateProps extends PermissionGateProps {
  // Roles permitidas
  roles: string[]
}

/**
 * Mostra conteúdo apenas se o usuário pode executar uma ação em um recurso
 *
 * @example
 * ```tsx
 * <CanPerform resource="regulations" action="create">
 *   <Button>Nova Regulação</Button>
 * </CanPerform>
 *
 * <CanPerform resource="regulations" action="delete" fallback={<span>Sem permissão</span>}>
 *   <Button variant="destructive">Excluir</Button>
 * </CanPerform>
 * ```
 */
export function CanPerform({
  resource,
  action,
  children,
  fallback = null,
}: ResourcePermissionGateProps) {
  const canPerform = useCanPerform(resource, action)

  if (!canPerform) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Mostra conteúdo apenas se o usuário tem uma permissão específica
 *
 * @example
 * ```tsx
 * <HasPermission permission="reports.export">
 *   <Button>Exportar CSV</Button>
 * </HasPermission>
 * ```
 */
export function HasPermission({
  permission,
  children,
  fallback = null,
}: SpecificPermissionGateProps) {
  const { hasPermission, isLoading } = usePermission()

  if (isLoading || !hasPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Mostra conteúdo apenas se o usuário é System Manager
 *
 * @example
 * ```tsx
 * <IsSystemManager>
 *   <Link href="/admin/dashboard">Admin Dashboard</Link>
 * </IsSystemManager>
 * ```
 */
export function IsSystemManager({
  children,
  fallback = null,
}: PermissionGateProps) {
  const { isSystemManager, isLoading } = usePermission()

  if (isLoading || !isSystemManager) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Mostra conteúdo apenas se o usuário é admin do tenant
 *
 * @example
 * ```tsx
 * <IsAdmin>
 *   <Link href="/tenant-settings">Configurações da Prefeitura</Link>
 * </IsAdmin>
 * ```
 */
export function IsAdmin({
  children,
  fallback = null,
}: PermissionGateProps) {
  const { roleName, isSystemManager, isLoading } = usePermission()

  if (isLoading) {
    return <>{fallback}</>
  }

  // System Manager também é considerado admin
  if (isSystemManager || roleName === 'admin_municipal') {
    return <>{children}</>
  }

  return <>{fallback}</>
}

/**
 * Mostra conteúdo apenas se o usuário tem um dos roles especificados
 *
 * @example
 * ```tsx
 * <HasRole roles={['admin_municipal', 'doctor']}>
 *   <Button>Aprovar Regulação</Button>
 * </HasRole>
 * ```
 */
export function HasRole({
  roles,
  children,
  fallback = null,
}: RoleGateProps) {
  const { roleName, isSystemManager, isLoading } = usePermission()

  if (isLoading) {
    return <>{fallback}</>
  }

  // System Manager tem acesso a tudo
  if (isSystemManager) {
    return <>{children}</>
  }

  if (!roleName || !roles.includes(roleName)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Mostra conteúdo apenas se o usuário está autenticado
 *
 * @example
 * ```tsx
 * <IsAuthenticated fallback={<LoginButton />}>
 *   <UserMenu />
 * </IsAuthenticated>
 * ```
 */
export function IsAuthenticated({
  children,
  fallback = null,
}: PermissionGateProps) {
  const { isAuthenticated, isLoading } = usePermission()

  if (isLoading || !isAuthenticated) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Wrapper para links que só devem aparecer se o usuário tem permissão
 *
 * @example
 * ```tsx
 * <PermissionLink
 *   href="/regulations/new"
 *   resource="regulations"
 *   action="create"
 * >
 *   <Button>Nova Regulação</Button>
 * </PermissionLink>
 * ```
 */
export function PermissionLink({
  href,
  resource,
  action,
  children,
  fallback = null,
}: ResourcePermissionGateProps & { href: string }) {
  const canPerform = useCanPerform(resource, action)

  if (!canPerform) {
    return <>{fallback}</>
  }

  // Retorna os children, que devem ser um Link
  return <>{children}</>
}
