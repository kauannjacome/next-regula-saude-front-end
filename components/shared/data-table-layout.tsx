import { ReactNode } from 'react';
import { SearchInput } from './search-input';

interface DataTableLayoutProps {
  title: string
  subtitle?: string
  search?: string
  onSearch?: (details: string) => void
  searchPlaceholder?: string
  actions?: ReactNode
  filters?: ReactNode
  bottomBar?: ReactNode
  children: ReactNode
}

export function DataTableLayout({
  title,
  subtitle,
  search,
  onSearch,
  searchPlaceholder = "Buscar...",
  actions,
  filters,
  bottomBar,
  children
}: DataTableLayoutProps) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 rounded-lg shadow-sm border">
      {/* TOOLBAR SUPERIOR */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b gap-4">
        {/* Lado Esquerdo: Título e Busca */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{title}</h1>
            {subtitle && (
              <span className="text-xs text-muted-foreground hidden lg:block">
                {subtitle}
              </span>
            )}
          </div>

          <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block mx-2"></div>

          {onSearch && (
            <div className="relative w-full sm:w-64 lg:w-96">
              <SearchInput
                value={search || ''}
                onChange={onSearch}
                placeholder={searchPlaceholder}
                className="h-9 w-full bg-gray-50 dark:bg-zinc-900 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
              />
            </div>
          )}
        </div>

        {/* Lado Direito: Filtros e Ações */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {filters}
          {actions}
        </div>
      </div>

      {/* ÁREA DA TABELA (CONTEÚDO PRINCIPAL) */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>

      {/* BARRA INFERIOR (PAGINAÇÃO, TOTAIS, ETC) */}
      {bottomBar && (
        <div className="border-t bg-gray-50/50 dark:bg-zinc-900/50 p-4">
          {bottomBar}
        </div>
      )}
    </div>
  )
}
