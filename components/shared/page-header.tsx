// ==========================================
// COMPONENTE COMPARTILHADO: CABEÇALHO DE PÁGINA
// ==========================================
// Este componente mostra o cabeçalho padrão de uma página
// Inclui: título, descrição, botão de voltar (opcional) e botão de ação (opcional)
// É reutilizado em várias páginas do sistema

import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, LucideIcon } from 'lucide-react'  // Ícones de seta e plus
import Link from 'next/link'

// TIPO: Define quais propriedades o componente aceita
interface PageHeaderProps {
  title: string             // Título da página (obrigatório)
  description?: string      // Descrição/subtítulo (opcional)
  icon?: LucideIcon         // Ícone ao lado do título (opcional)
  backHref?: string         // Link do botão "Voltar" (opcional)
  actionLabel?: string      // Texto do botão de ação (ex: "Novo Cidadão")
  actionHref?: string       // Link do botão de ação (para navegação)
  onAction?: () => void     // OU função do botão de ação (para executar código)
  actions?: React.ReactNode // Ações customizadas (alternativa a actionLabel/actionHref)
}

// COMPONENTE PRINCIPAL
// Renderiza cabeçalho com título, descrição e botões opcionais
export function PageHeader({
  title,
  description,
  icon: Icon,
  backHref,
  actionLabel,
  actionHref,
  onAction,
  actions,
}: PageHeaderProps) {
  return (
    <div className="space-y-4">
      {/* BOTÃO VOLTAR (só aparece se backHref foi fornecido) */}
      {backHref && (
        <Button variant="ghost" asChild className="mb-2">
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      )}

      {/* LAYOUT: Responsivo - coluna no mobile, linha no desktop */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* LADO ESQUERDO: Título e descrição */}
        <div>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          </div>
          {/* Descrição (só aparece se foi fornecida) */}
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        {/* LADO DIREITO: Ações customizadas ou botão de ação padrão */}
        {actions ? (
          actions
        ) : actionLabel && (actionHref || onAction) ? (
          <>
            {/* OPÇÃO 1: Se tem actionHref, criar link de navegação */}
            {actionHref ? (
              <Button asChild className="w-full md:w-auto">
                <Link href={actionHref}>
                  <Plus className="mr-2 h-4 w-4" />
                  {actionLabel}
                </Link>
              </Button>
            ) : (
              /* OPÇÃO 2: Se tem onAction, criar botão que executa função */
              <Button className="w-full md:w-auto" onClick={onAction}>
                <Plus className="mr-2 h-4 w-4" />
                {actionLabel}
              </Button>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
