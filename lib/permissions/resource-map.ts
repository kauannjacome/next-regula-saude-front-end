/**
 * MAPA CENTRALIZADO DE RECURSOS E PERMISSÕES
 *
 * Este arquivo define todas as regras de acesso do sistema.
 * Quando quiser adicionar um novo recurso ou permissão, adicione aqui.
 */

// Tipos de ações disponíveis para cada recurso
export type PermissionAction = 'read' | 'view' | 'create' | 'update' | 'delete' | 'export' | 'approve' | 'print' | 'confirm' | 'send' | 'configure' | 'movement'

// Definição de um recurso do sistema
export interface ResourceDefinition {
  // Nome técnico do recurso (usado nas permissões)
  name: string
  // Nome amigável para exibição
  displayName: string
  // Ícone do menu (nome do componente Lucide)
  icon: string
  // Rota principal do recurso
  href: string
  // Permissões que dão acesso a este recurso no menu
  // Se o usuário tiver QUALQUER uma dessas, o menu aparece
  menuPermissions: string[]
  // Permissões necessárias para cada ação
  actions: {
    read?: string[]       // Ver listagem
    view?: string[]       // Ver detalhes
    create?: string[]     // Criar novo
    update?: string[]     // Editar
    delete?: string[]     // Excluir
    export?: string[]     // Exportar
    approve?: string[]    // Aprovar (regulações)
    print?: string[]      // Imprimir
    confirm?: string[]    // Confirmar presença (agendamentos)
    send?: string[]       // Enviar (WhatsApp)
    configure?: string[]  // Configurar (WhatsApp)
    movement?: string[]   // Movimentar (estoque)
  }
  // Roles que têm acesso total a este recurso (bypass de permissões)
  bypassRoles?: string[]
}

/**
 * MAPA DE TODOS OS RECURSOS DO SISTEMA
 *
 * Cada recurso define:
 * - Quais permissões dão acesso ao menu
 * - Quais permissões são necessárias para cada ação
 * - Quais roles têm bypass (acesso total)
 */
export const RESOURCE_MAP: Record<string, ResourceDefinition> = {
  // ============================================
  // RECURSOS DE TENANT (Prefeitura)
  // ============================================
  'welcome': {
    name: 'welcome',
    displayName: 'Início',
    icon: 'LayoutDashboard',
    href: '/welcome',
    menuPermissions: ['welcome.read', 'welcome.view'],
    actions: {
      read: ['welcome.read', 'welcome.view'],
    },
    bypassRoles: ['admin_municipal'],
  },

  'municipal-dashboard': {
    name: 'municipal-dashboard',
    displayName: 'Dashboard',
    icon: 'Gauge',
    href: '/municipal-dashboard',
    menuPermissions: ['municipal-dashboard.read', 'municipal-dashboard.view'],
    actions: {
      read: ['municipal-dashboard.read', 'municipal-dashboard.view'],
    },
    bypassRoles: ['admin_municipal'],
  },

  'regulations': {
    name: 'regulations',
    displayName: 'Regulações',
    icon: 'FileText',
    href: '/regulations',
    menuPermissions: ['regulations.read', 'regulations.view', 'regulations.create'],
    actions: {
      read: ['regulations.read', 'regulations.view'],
      view: ['regulations.read', 'regulations.view'],
      create: ['regulations.create'],
      update: ['regulations.update', 'regulations.edit'],
      delete: ['regulations.delete'],
      approve: ['regulations.approve'],
      print: ['regulations.print'],
      export: ['regulations.export'],
    },
    bypassRoles: ['admin_municipal'],
  },

  'citizens': {
    name: 'citizens',
    displayName: 'Cidadãos',
    icon: 'Heart',
    href: '/citizens',
    menuPermissions: ['citizens.read', 'citizens.view', 'citizens.create'],
    actions: {
      read: ['citizens.read', 'citizens.view'],
      view: ['citizens.read', 'citizens.view'],
      create: ['citizens.create'],
      update: ['citizens.update', 'citizens.edit'],
      delete: ['citizens.delete'],
    },
    bypassRoles: ['admin_municipal'],
  },

  'users': {
    name: 'users',
    displayName: 'Usuários',
    icon: 'Users',
    href: '/users',
    menuPermissions: ['users.read', 'users.view', 'users.create'],
    actions: {
      read: ['users.read', 'users.view'],
      view: ['users.read', 'users.view'],
      create: ['users.create'],
      update: ['users.update', 'users.edit'],
      delete: ['users.delete'],
    },
    bypassRoles: ['admin_municipal'],
  },

  'units': {
    name: 'units',
    displayName: 'Unidades',
    icon: 'Building2',
    href: '/units',
    menuPermissions: ['units.read', 'units.view', 'units.create'],
    actions: {
      read: ['units.read', 'units.view'],
      view: ['units.read', 'units.view'],
      create: ['units.create'],
      update: ['units.update', 'units.edit'],
      delete: ['units.delete'],
    },
    bypassRoles: ['admin_municipal'],
  },

  'suppliers': {
    name: 'suppliers',
    displayName: 'Fornecedores',
    icon: 'Package',
    href: '/suppliers',
    menuPermissions: ['suppliers.read', 'suppliers.view', 'suppliers.create'],
    actions: {
      read: ['suppliers.read', 'suppliers.view'],
      view: ['suppliers.read', 'suppliers.view'],
      create: ['suppliers.create'],
      update: ['suppliers.update', 'suppliers.edit'],
      delete: ['suppliers.delete'],
    },
    bypassRoles: ['admin_municipal'],
  },

  'folders': {
    name: 'folders',
    displayName: 'Pastas',
    icon: 'FolderOpen',
    href: '/folders',
    menuPermissions: ['folders.read', 'folders.view', 'folders.create'],
    actions: {
      read: ['folders.read', 'folders.view'],
      view: ['folders.read', 'folders.view'],
      create: ['folders.create'],
      update: ['folders.update', 'folders.edit'],
      delete: ['folders.delete'],
    },
    bypassRoles: ['admin_municipal'],
  },

  'care': {
    name: 'care',
    displayName: 'Cuidados',
    icon: 'Stethoscope',
    href: '/care',
    menuPermissions: ['care.read', 'care.view', 'care.create'],
    actions: {
      read: ['care.read', 'care.view'],
      view: ['care.read', 'care.view'],
      create: ['care.create'],
      update: ['care.update', 'care.edit'],
      delete: ['care.delete'],
    },
    bypassRoles: ['admin_municipal'],
  },



  'groups': {
    name: 'groups',
    displayName: 'Grupos',
    icon: 'Layers',
    href: '/groups',
    menuPermissions: ['groups.read', 'groups.view', 'groups.create'],
    actions: {
      read: ['groups.read', 'groups.view'],
      view: ['groups.read', 'groups.view'],
      create: ['groups.create'],
      update: ['groups.update', 'groups.edit'],
      delete: ['groups.delete'],
    },
    bypassRoles: ['admin_municipal'],
  },

  'care-groups': {
    name: 'care-groups',
    displayName: 'Grupos de Cuidado',
    icon: 'HeartHandshake',
    href: '/care-groups',
    menuPermissions: ['care-groups.read', 'care-groups.view', 'care-groups.create'],
    actions: {
      read: ['care-groups.read', 'care-groups.view'],
      view: ['care-groups.read', 'care-groups.view'],
      create: ['care-groups.create'],
      update: ['care-groups.update', 'care-groups.edit'],
      delete: ['care-groups.delete'],
    },
    bypassRoles: ['admin_municipal'],
  },

  'schedules': {
    name: 'schedules',
    displayName: 'Agendamentos',
    icon: 'Calendar',
    href: '/schedules',
    menuPermissions: ['schedules.read', 'schedules.view', 'schedules.create'],
    actions: {
      read: ['schedules.read', 'schedules.view'],
      view: ['schedules.read', 'schedules.view'],
      create: ['schedules.create'],
      update: ['schedules.update', 'schedules.edit'],
      delete: ['schedules.delete'],
      confirm: ['schedules.confirm'],
    },
    bypassRoles: ['admin_municipal'],
  },

  'reports': {
    name: 'reports',
    displayName: 'Relatórios',
    icon: 'FileBarChart',
    href: '/reports',
    menuPermissions: ['reports.read', 'reports.view'],
    actions: {
      read: ['reports.read', 'reports.view'],
      export: ['reports.export'],
    },
    bypassRoles: ['admin_municipal'],
  },

  'whatsapp': {
    name: 'whatsapp',
    displayName: 'WhatsApp',
    icon: 'MessageCircle',
    href: '/whatsapp-programmed',
    menuPermissions: ['whatsapp.read', 'whatsapp.view', 'whatsapp.create'],
    actions: {
      read: ['whatsapp.read', 'whatsapp.view'],
      view: ['whatsapp.read', 'whatsapp.view'],
      create: ['whatsapp.create'],
      update: ['whatsapp.update', 'whatsapp.edit'],
      delete: ['whatsapp.delete'],
      send: ['whatsapp.send'],
      configure: ['whatsapp.configure'],
    },
    bypassRoles: ['admin_municipal'],
  },

  'settings': {
    name: 'settings',
    displayName: 'Configurações',
    icon: 'Settings',
    href: '/settings',
    menuPermissions: [], // Todos têm acesso às suas próprias configurações
    actions: {
      read: [],
      update: [],
    },
  },

  'tenant-settings': {
    name: 'tenant-settings',
    displayName: 'Config. Prefeitura',
    icon: 'Cog',
    href: '/tenant-settings',
    menuPermissions: ['tenant-settings.read', 'tenant-settings.view'],
    actions: {
      read: ['tenant-settings.read', 'tenant-settings.view'],
      update: ['tenant-settings.update', 'tenant-settings.edit'],
    },
    bypassRoles: ['admin_municipal'],
  },

  'audit': {
    name: 'audit',
    displayName: 'Auditoria',
    icon: 'Activity',
    href: '/audit',
    menuPermissions: ['audit.read', 'audit.view'],
    actions: {
      read: ['audit.read', 'audit.view'],
      export: ['audit.export'],
    },
    bypassRoles: ['admin_municipal'],
  },

  // ============================================
  // RECURSOS DE SYSTEM MANAGER (Admin Global)
  // ============================================
  'admin-dashboard': {
    name: 'admin-dashboard',
    displayName: 'Dashboard',
    icon: 'LayoutDashboard',
    href: '/admin/dashboard',
    menuPermissions: [], // Apenas System Manager
    actions: {
      read: [],
    },
    bypassRoles: [],
  },

  'subscribers': {
    name: 'subscribers',
    displayName: 'Assinantes',
    icon: 'Shield',
    href: '/admin/subscribers',
    menuPermissions: [], // Apenas System Manager
    actions: {
      read: [],
      create: [],
      update: [],
      delete: [],
    },
    bypassRoles: [],
  },
}

/**
 * Retorna a definição de um recurso pelo nome
 */
export function getResourceDefinition(resourceName: string): ResourceDefinition | null {
  return RESOURCE_MAP[resourceName] || null
}

/**
 * Retorna todos os recursos que o usuário pode ver no menu
 */
export function getAccessibleResources(
  userPermissions: string[],
  roleName: string | null,
  isSystemManager: boolean
): ResourceDefinition[] {
  if (isSystemManager) {
    // System Manager vê apenas recursos de admin
    return Object.values(RESOURCE_MAP).filter(r =>
      r.href.startsWith('/admin/')
    )
  }

  return Object.values(RESOURCE_MAP).filter(resource => {
    // Não mostrar recursos de admin para usuários normais
    if (resource.href.startsWith('/admin/')) {
      return false
    }

    // Settings é sempre acessível
    if (resource.name === 'settings') {
      return true
    }

    // Verificar se o role tem bypass
    if (roleName && resource.bypassRoles?.includes(roleName)) {
      return true
    }

    // Verificar se tem alguma permissão de menu
    if (resource.menuPermissions.length === 0) {
      return false
    }

    return resource.menuPermissions.some(perm => userPermissions.includes(perm))
  })
}

/**
 * Verifica se o usuário pode executar uma ação em um recurso
 */
export function canPerformAction(
  resourceName: string,
  action: PermissionAction,
  userPermissions: string[],
  roleName: string | null,
  isSystemManager: boolean
): boolean {
  // System Manager pode tudo
  if (isSystemManager) {
    return true
  }

  const resource = RESOURCE_MAP[resourceName]
  if (!resource) {
    return false
  }

  // Settings é sempre acessível para o próprio usuário
  if (resource.name === 'settings' && (action === 'read' || action === 'update')) {
    return true
  }

  // Verificar bypass por role
  if (roleName && resource.bypassRoles?.includes(roleName)) {
    return true
  }

  // Verificar permissões específicas da ação
  const requiredPermissions = resource.actions[action]
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return false
  }

  return requiredPermissions.some(perm => userPermissions.includes(perm))
}
