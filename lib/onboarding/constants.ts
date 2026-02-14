// Onboarding Steps
export const ONBOARDING_STEPS = {
  WELCOME: 'WELCOME',
  PROFILE: 'PROFILE',
  IMPORT: 'IMPORT',
  TOUR: 'TOUR',
  COMPLETE: 'COMPLETE',
} as const

export type OnboardingStepType = keyof typeof ONBOARDING_STEPS

// Ordem dos steps
export const STEP_ORDER: OnboardingStepType[] = [
  'WELCOME',
  'PROFILE',
  'IMPORT',
  'TOUR',
  'COMPLETE',
]

// Configuracao dos steps
export const STEP_CONFIG: Record<
  OnboardingStepType,
  {
    title: string
    description: string
    canSkip: boolean
  }
> = {
  WELCOME: {
    title: 'Boas-vindas',
    description: 'Bem-vindo ao NextSaude',
    canSkip: false,
  },
  PROFILE: {
    title: 'Seu Perfil',
    description: 'Complete suas informacoes',
    canSkip: false,
  },
  IMPORT: {
    title: 'Importar Dados',
    description: 'Importe seus dados iniciais',
    canSkip: true,
  },
  TOUR: {
    title: 'Tour do Sistema',
    description: 'Conheca as funcionalidades',
    canSkip: true,
  },
  COMPLETE: {
    title: 'Concluido',
    description: 'Tudo pronto para comecar',
    canSkip: false,
  },
}

// Tipos de importacao
export const IMPORT_TYPES = {
  CITIZENS: 'CITIZENS',
  PROFESSIONALS: 'PROFESSIONALS',
  UNITS: 'UNITS',
} as const

export type ImportType = keyof typeof IMPORT_TYPES

// Configuracao das tabs de importacao
export const IMPORT_TAB_CONFIG: Record<
  ImportType,
  {
    label: string
    description: string
    templateFileName: string
    exampleRows: number
  }
> = {
  CITIZENS: {
    label: 'Cidadaos',
    description: 'Importe a lista de cidadaos/pacientes',
    templateFileName: 'template_cidadaos.xlsx',
    exampleRows: 3,
  },
  PROFESSIONALS: {
    label: 'Profissionais',
    description: 'Importe a lista de profissionais de saude',
    templateFileName: 'template_profissionais.xlsx',
    exampleRows: 3,
  },
  UNITS: {
    label: 'Unidades',
    description: 'Importe a lista de unidades de saude',
    templateFileName: 'template_unidades.xlsx',
    exampleRows: 3,
  },
}

// Colunas esperadas para cada tipo de importacao
export const IMPORT_COLUMNS: Record<ImportType, string[]> = {
  CITIZENS: [
    'nome',
    'cpf',
    'data_nascimento',
    'sexo',
    'telefone',
    'email',
    'cep',
    'logradouro',
    'numero',
    'complemento',
    'bairro',
    'cidade',
    'estado',
    'nome_mae',
  ],
  PROFESSIONALS: [
    'nome',
    'cpf',
    'email',
    'telefone',
    'cargo',
    'conselho',
    'numero_conselho',
    'uf_conselho',
  ],
  UNITS: [
    'nome',
    'tipo',
    'cnes',
    'telefone',
    'email',
    'cep',
    'logradouro',
    'numero',
    'complemento',
    'bairro',
    'cidade',
    'estado',
  ],
}

// Tour Steps
export const TOUR_STEPS = [
  {
    id: 'sidebar',
    target: '[data-tour="sidebar"]',
    title: 'Menu Principal',
    description: 'Aqui voce encontra acesso a todas as funcionalidades do sistema.',
    videoUrl: null,
    docUrl: null,
  },
  {
    id: 'regulations',
    target: '[data-tour="regulations"]',
    title: 'Regulacoes',
    description: 'Gerencie todas as regulacoes de saude. Crie, acompanhe e aprove solicitacoes.',
    videoUrl: null,
    docUrl: null,
  },
  {
    id: 'citizens',
    target: '[data-tour="citizens"]',
    title: 'Cidadaos',
    description: 'Cadastre e gerencie os cidadaos/pacientes do municipio.',
    videoUrl: null,
    docUrl: null,
  },
  {
    id: 'schedules',
    target: '[data-tour="schedules"]',
    title: 'Agendamentos',
    description: 'Visualize e gerencie todos os agendamentos de consultas e procedimentos.',
    videoUrl: null,
    docUrl: null,
  },
  {
    id: 'notifications',
    target: '[data-tour="notifications"]',
    title: 'Notificacoes',
    description: 'Receba alertas sobre prazos, aprovacoes e atualizacoes importantes.',
    videoUrl: null,
    docUrl: null,
  },
  {
    id: 'user-menu',
    target: '[data-tour="user-menu"]',
    title: 'Menu do Usuario',
    description: 'Acesse suas configuracoes, perfil e opcoes de logout.',
    videoUrl: null,
    docUrl: null,
  },
] as const

// Recursos de ajuda
export const HELP_RESOURCES = [
  {
    title: 'Central de Ajuda',
    description: 'Documentacao completa do sistema',
    url: '/docs',
    icon: 'book',
  },
  {
    title: 'Videos Tutoriais',
    description: 'Aprenda com videos passo a passo',
    url: '/videos',
    icon: 'video',
  },
  {
    title: 'Suporte',
    description: 'Entre em contato com nossa equipe',
    url: '/support',
    icon: 'headphones',
  },
]
