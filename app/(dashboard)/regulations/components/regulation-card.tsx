// ==========================================
// COMPONENTE: CARD DE REGULAÇÃO
// ==========================================
// Este componente mostra uma regulação em formato de card (cartão)
// Usado na listagem de regulações para mostrar resumo de cada uma
// É clicável para abrir os detalhes completos
// 'use client' = este código roda no NAVEGADOR (frontend)

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge, PriorityBadge } from '@/components/shared'  // Badges coloridas de status e prioridade
import Link from 'next/link'  // Para navegação entre páginas

// TIPO: Define quais informações uma regulação deve ter
interface RegulationCardProps {
  id: string          // ID único da regulação
  citizen: string     // Nome do cidadão
  cpf: string         // CPF do cidadão
  procedure: string   // Procedimento solicitado
  unit: string        // Unidade de saúde de destino
  status: string      // Status atual (Aguardando, Agendado, etc)
  priority: string    // Prioridade (Alta, Média, Baixa)
  createdAt: string   // Data de criação
}

// COMPONENTE PRINCIPAL
// Recebe os dados da regulação e renderiza um card
export function RegulationCard({
  id,
  citizen,
  cpf,
  procedure,
  unit,
  status,
  priority,
  createdAt,
}: RegulationCardProps) {
  return (
    // Card com efeito hover (sombra ao passar mouse)
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        {/* Layout responsivo: coluna no mobile, linha no desktop */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          {/* LADO ESQUERDO: Informações do cidadão e procedimento */}
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                {/* Nome do cidadão (clicável - abre detalhes) */}
                <Link
                  href={`/regulations/${id}`}
                  className="text-lg font-semibold hover:text-primary transition-colors"
                >
                  {citizen}
                </Link>
                {/* CPF do cidadão */}
                <p className="text-sm text-muted-foreground">CPF: {cpf}</p>
                {/* Procedimento solicitado */}
                <p className="text-sm mt-1">
                  <strong>Procedimento:</strong> {procedure}
                </p>
                {/* Unidade de destino */}
                <p className="text-sm text-muted-foreground">{unit}</p>
              </div>
            </div>
          </div>

          {/* LADO DIREITO: Status, Prioridade e Data */}
          <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
            {/* Badge de status (colorida) */}
            <StatusBadge status={status} />
            {/* Badge de prioridade (colorida) */}
            <PriorityBadge priority={priority} />
            {/* Data de criação */}
            <p className="text-xs text-muted-foreground w-full md:w-auto text-right">
              Criado em {createdAt}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
