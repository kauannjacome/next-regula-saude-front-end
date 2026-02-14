// ==========================================
// COMPONENTES COMPARTILHADOS: SKELETONS DE LOADING
// ==========================================
// Estes componentes mostram placeholders animados enquanto carrega dados
// "Skeleton" = esqueleto/estrutura vazia que pulsa (efeito shimmer)
// Melhora UX mostrando onde o conteúdo vai aparecer
// Existem 4 tipos: TableRow, Card, Form e PageHeader

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TableCell, TableRow } from '@/components/ui/table'

// ==========================================
// SKELETON 1: LINHA DE TABELA
// ==========================================
// Usado para mostrar loading em tabelas (ex: lista de cidadãos)
// Parâmetro: columns = quantas colunas a tabela tem (padrão: 5)

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <TableRow>
      {/* Array.from({ length: columns }) = criar array com N elementos */}
      {/* .map() = renderizar skeleton para cada coluna */}
      {Array.from({ length: columns }).map((_, i) => (
        <TableCell key={i}>
          {/* Skeleton cinza pulsante de 4px altura */}
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </TableCell>
      ))}
    </TableRow>
  )
}

// ==========================================
// SKELETON 2: CARD SIMPLES
// ==========================================
// Usado para mostrar loading de cards (ex: resumo, informações)
// Simula: título + 3 linhas de texto de tamanhos variados

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        {/* Título: 6px altura, 32px largura (128px) */}
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 3 linhas de texto com larguras diferentes */}
        <Skeleton className="h-4 w-full" />        {/* Linha 1: 100% */}
        <Skeleton className="h-4 w-3/4" />         {/* Linha 2: 75% */}
        <Skeleton className="h-4 w-1/2" />         {/* Linha 3: 50% */}
      </CardContent>
    </Card>
  )
}

// ==========================================
// SKELETON 3: FORMULÁRIO
// ==========================================
// Usado para mostrar loading de formulários (ex: editar cidadão)
// Simula: título + campos de formulário (labels + inputs)

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          {/* Título do formulário */}
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Grid com 2 colunas (2 campos lado a lado) */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Campo 1 */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />    {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Input */}
            </div>
            {/* Campo 2 */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />    {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Input */}
            </div>
          </div>
          {/* Campo 3: largura total */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />      {/* Label */}
            <Skeleton className="h-10 w-full" />   {/* Input */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// SKELETON 4: CABEÇALHO DE PÁGINA
// ==========================================
// Usado para mostrar loading do cabeçalho (PageHeader)
// Simula: título + descrição + botão de ação

export function PageHeaderSkeleton() {
  return (
    // Layout responsivo: coluna no mobile, linha no desktop
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Lado esquerdo: Título + Descrição */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />   {/* Título (8px altura, 192px largura) */}
        <Skeleton className="h-4 w-72" />   {/* Descrição (4px altura, 288px largura) */}
      </div>
      {/* Lado direito: Botão de ação */}
      <Skeleton className="h-10 w-32" />    {/* Botão (10px altura, 128px largura) */}
    </div>
  )
}
