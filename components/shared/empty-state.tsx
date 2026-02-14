// ==========================================
// COMPONENTE COMPARTILHADO: ESTADO VAZIO
// ==========================================
// Este componente é mostrado quando não há dados para exibir
// Agora com mensagens contextuais e mais amigáveis

import { LucideIcon, FileX, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// TIPO: Define quais propriedades o componente aceita
interface EmptyStateProps {
  icon?: LucideIcon       // Ícone a ser exibido (opcional, padrão: FileX)
  title: string           // Título principal (ex: "Nenhum cidadão encontrado")
  description?: string    // Descrição explicativa (opcional)
  actionLabel?: string    // Texto do botão de ação (ex: "Novo Cidadão")
  actionHref?: string     // Link do botão de ação (para navegação)
  onAction?: () => void   // OU função do botão de ação (para executar código)
  tip?: string            // Dica adicional para ajudar o usuário
  variant?: 'default' | 'search' | 'filter' // Variante visual
}

// Mensagens de dica padrão baseadas no contexto
const DEFAULT_TIPS: Record<string, string> = {
  regulations: 'Clique em "Nova Regulação" para criar sua primeira solicitação.',
  citizens: 'Use o botão "Novo Cidadão" acima para cadastrar um paciente.',
  schedules: 'Os agendamentos aparecem aqui quando regulações são aprovadas.',
  search: 'Tente usar menos filtros ou termos mais genéricos na busca.',
  filter: 'Limpe os filtros para ver todos os registros disponíveis.',
}

// COMPONENTE PRINCIPAL
export function EmptyState({
  icon: Icon = FileX,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  tip,
  variant = 'default',
}: EmptyStateProps) {
  // Determinar a mensagem de dica
  const tipMessage = tip || (variant === 'search' ? DEFAULT_TIPS.search : variant === 'filter' ? DEFAULT_TIPS.filter : undefined)

  return (
    // Container centralizado vertical e horizontalmente
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {/* ÍCONE: Grande e com cor neutra, em um círculo de fundo */}
      <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>

      {/* TÍTULO: Texto principal */}
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>

      {/* DESCRIÇÃO: Texto explicativo (só aparece se fornecida) */}
      {description && (
        <p className="text-muted-foreground mt-1 max-w-md leading-relaxed">{description}</p>
      )}

      {/* DICA: Mensagem adicional para orientar o usuário */}
      {tipMessage && (
        <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-4 py-2 rounded-lg">
          <Sparkles className="h-4 w-4 flex-shrink-0" />
          <span>{tipMessage}</span>
        </div>
      )}

      {/* BOTÃO DE AÇÃO: Para criar novo registro ou executar ação */}
      {actionLabel && (actionHref || onAction) && (
        <>
          {actionHref ? (
            <Button asChild className="mt-6" size="lg">
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : (
            <Button className="mt-6" size="lg" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </>
      )}
    </div>
  )
}

// ==========================================
// VARIANTES PRÉ-CONFIGURADAS
// ==========================================

interface ContextualEmptyStateProps {
  context: 'regulations' | 'citizens' | 'schedules' | 'units' | 'suppliers' | 'care' | 'folders' | 'templates'
  hasFilters?: boolean
  hasSearch?: boolean
  onClearFilters?: () => void
}

const CONTEXT_CONFIG: Record<string, {
  title: string
  description: string
  actionLabel: string
  actionHref: string
  tip: string
}> = {
  regulations: {
    title: 'Nenhuma regulação encontrada',
    description: 'Parece que você ainda não tem regulações cadastradas.',
    actionLabel: 'Nova Regulação',
    actionHref: '/regulations?action=new',
    tip: 'Clique em "Nova Regulação" para criar sua primeira solicitação.',
  },
  citizens: {
    title: 'Nenhum cidadão encontrado',
    description: 'Nenhum paciente foi cadastrado ainda.',
    actionLabel: 'Cadastrar Cidadão',
    actionHref: '/citizens/new',
    tip: 'Cadastre pacientes para poder criar regulações para eles.',
  },
  schedules: {
    title: 'Nenhum agendamento encontrado',
    description: 'Não há atendimentos programados para exibir.',
    actionLabel: 'Ver Regulações',
    actionHref: '/regulations',
    tip: 'Agendamentos são criados quando regulações são aprovadas.',
  },
  units: {
    title: 'Nenhuma unidade encontrada',
    description: 'Nenhuma unidade de saúde foi cadastrada.',
    actionLabel: 'Nova Unidade',
    actionHref: '/units/new',
    tip: 'Cadastre unidades de saúde para vincular a regulações.',
  },
  suppliers: {
    title: 'Nenhum fornecedor encontrado',
    description: 'Nenhum fornecedor foi cadastrado ainda.',
    actionLabel: 'Novo Fornecedor',
    actionHref: '/suppliers/new',
    tip: 'Fornecedores são prestadores de serviço externos.',
  },
  care: {
    title: 'Nenhum procedimento encontrado',
    description: 'Nenhum tipo de cuidado foi cadastrado.',
    actionLabel: 'Novo Procedimento',
    actionHref: '/care/new',
    tip: 'Cadastre os tipos de procedimentos oferecidos.',
  },
  folders: {
    title: 'Nenhuma pasta encontrada',
    description: 'Organize suas regulações em pastas.',
    actionLabel: 'Nova Pasta',
    actionHref: '/folders/new',
    tip: 'Pastas ajudam a organizar regulações por categoria.',
  },
  templates: {
    title: 'Nenhum template encontrado',
    description: 'Crie modelos de documentos para impressão.',
    actionLabel: 'Novo Template',
    actionHref: '/templates/new',
    tip: 'Templates são usados para gerar documentos personalizados.',
  },
}

export function ContextualEmptyState({
  context,
  hasFilters = false,
  hasSearch = false,
  onClearFilters,
}: ContextualEmptyStateProps) {
  const config = CONTEXT_CONFIG[context]

  if (!config) {
    return (
      <EmptyState
        title="Nenhum resultado"
        description="Não encontramos nada para exibir."
      />
    )
  }

  // Se tem filtros ou busca ativos, mostra mensagem diferente
  if (hasFilters || hasSearch) {
    return (
      <EmptyState
        title="Nenhum resultado encontrado"
        description={hasSearch
          ? "Sua busca não retornou resultados. Tente termos diferentes."
          : "Nenhum registro corresponde aos filtros selecionados."
        }
        variant={hasSearch ? 'search' : 'filter'}
        actionLabel={onClearFilters ? "Limpar Filtros" : undefined}
        onAction={onClearFilters}
      />
    )
  }

  return (
    <EmptyState
      title={config.title}
      description={config.description}
      actionLabel={config.actionLabel}
      actionHref={config.actionHref}
      tip={config.tip}
    />
  )
}
