// ==========================================
// COMPONENTE: ABA DE HISTÓRICO DO CIDAD?O
// ==========================================
// Este componente mostra histórico de atendimentos do cidadão
// Formato: TIMELINE (linha do tempo) com eventos ordenados por data
// Exibe: Consultas, procedimentos, exames realizados ou agendados
// Visual: Linha vertical com bolinhas coloridas + cards de informação
// Usado na página de detalhes do cidadão (dentro de Tabs)
// 'use client' = este código roda no NAVEGADOR (frontend)

'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { History, ClipboardList, Calendar, User, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/format';  // Função helper
import { EmptyState } from '@/components/shared';
import { toast } from 'sonner';

// TIPO: Define a estrutura de um item do histórico
interface HistoryItem {
  id: string
  date: string                                    // Data do evento (formato ISO)
  type: 'regulation' | 'appointment' | 'procedure'  // Tipo de evento
  description: string                             // Descrição (ex: "Consulta Cardiologia")
  professional?: string                           // Nome do profissional (opcional)
  unit?: string                                   // Nome da unidade/local (opcional)
  status: string                                  // Status (ex: "Realizado", "Agendado", "Pendente")
}

// PROPS: O componente recebe o ID do cidadão e opcionalmente os dados já carregados
interface CitizenHistoryTabProps {
  citizenId: string
  initialData?: {
    regulations?: any[]
    schedules?: any[]
  }
}

// FUNÇÃO: Mapear status da regulação da API para texto legível
function mapRegulationStatus(status: string | null): string {
  switch (status) {
    case 'APPROVED': return 'Realizado'
    case 'IN_PROGRESS': return 'Pendente'
    case 'DENIED': return 'Negado'
    case 'RETURNED': return 'Devolvido'
    default: return 'Pendente'
  }
}

// Função auxiliar para mapear dados para o formato do histórico
function mapDataToHistory(regulations: any[], schedules: any[]): HistoryItem[] {
  const mappedRegulations: HistoryItem[] = regulations.map((reg: any) => ({
    id: `reg-${reg.id}`,
    date: reg.requestDate || reg.createdAt,
    type: 'regulation' as const,
    description: reg.clinicalIndication || reg.notes || `Regulação #${reg.idCode || reg.id}`,
    professional: reg.requestingProfessional || undefined,
    status: mapRegulationStatus(reg.status),
  }))

  const mappedSchedules: HistoryItem[] = schedules.map((sch: any) => ({
    id: `sch-${sch.id}`,
    date: sch.scheduledDate,
    type: 'appointment' as const,
    description: sch.notes || 'Consulta / Atendimento',
    professional: sch.professional?.name || undefined,
    status: sch.status === 'COMPLETED' ? 'Realizado' : sch.status === 'CANCELED' ? 'Cancelado' : 'Agendado',
  }))

  return [...mappedRegulations, ...mappedSchedules].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

// COMPONENTE PRINCIPAL
export function CitizenHistoryTab({ citizenId, initialData }: CitizenHistoryTabProps) {
  // Se dados iniciais foram passados, usá-los diretamente (evita fetch)
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (initialData) {
      return mapDataToHistory(initialData.regulations || [], initialData.schedules || [])
    }
    return []
  })
  const [isLoading, setIsLoading] = useState(!initialData)

  // EFEITO: Só buscar se não tiver dados iniciais
  useEffect(() => {
    // Se já tem dados iniciais, não fazer fetch
    if (initialData) {
      setHistory(mapDataToHistory(initialData.regulations || [], initialData.schedules || []))
      setIsLoading(false)
      return
    }

    const fetchHistory = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/citizens/${citizenId}`)
        if (!response.ok) {
          throw new Error('Erro ao carregar histórico')
        }
        const data = await response.json()
        setHistory(mapDataToHistory(data.regulations || [], data.schedules || []))
      } catch (error) {
        console.error('History fetch error:', error)
        toast.error('Erro ao carregar histórico')
      } finally {
        setIsLoading(false)
      }
    }

    if (citizenId) {
      fetchHistory()
    }
  }, [citizenId, initialData])

  // RENDERIZAÇÃO CONDICIONAL: Carregando
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // RENDERIZAÇÃO CONDICIONAL 1: Nenhum histórico
  // Se lista está vazia, mostrar estado vazio
  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          {/* EmptyState: Componente visual para lista vazia */}
          <EmptyState
            icon={History}
            title="Nenhum histórico disponível"
            description="O histórico de atendimentos aparecerá aqui"
          />
        </CardContent>
      </Card>
    )
  }

  // RENDERIZAÇÃO PRINCIPAL: Tem histórico (mostrar timeline)
  return (
    <Card>
      <CardContent className="pt-6">

        {/* CONTAINER DA TIMELINE */}
        {/* relative = posicionamento relativo para elementos filhos absolute */}
        <div className="relative">

          {/* LINHA VERTICAL: Linha cinza que conecta todos os eventos */}
          {/* absolute = posicionamento absoluto (não ocupa espaço) */}
          {/* left-4 = 16px da esquerda */}
          {/* top-0 bottom-0 = altura total do container */}
          {/* w-px = largura de 1px */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          {/* LISTA DE EVENTOS */}
          <div className="space-y-6">
            {/* .map() = renderizar card para cada evento do histórico */}
            {history.map((item) => (
              // CONTAINER DO EVENTO
              // pl-10 = padding left de 40px (espaço para bolinha e linha)
              <div key={item.id} className="relative pl-10">

                {/* BOLINHA COLORIDA: Indicador visual na timeline */}
                {/* Cores diferentes por tipo:
                    - regulation (regulação/consulta) = azul (primary)
                    - procedure (procedimento/exame) = cinza (secondary)
                    - appointment (agendamento) = verde (success) */}
                <div
                  className={`absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center ${
                    item.type === 'regulation'
                      ? 'bg-primary'          // Azul
                      : item.type === 'procedure'
                      ? 'bg-secondary'        // Cinza
                      : 'bg-success'          // Verde
                  }`}
                >
                  {/* Ícone branco dentro da bolinha */}
                  <ClipboardList className="h-3 w-3 text-white" />
                </div>

                {/* CARD DO EVENTO: Fundo cinza claro com informações */}
                <div className="bg-muted/50 rounded-lg p-4">
                  {/* Layout: Informações (esquerda) + Badge de status (direita) */}
                  <div className="flex items-start justify-between">

                    {/* LADO ESQUERDO: Descrição + Data + Profissional + Unidade */}
                    <div>
                      {/* Título/Descrição do evento */}
                      <p className="font-medium">{item.description}</p>

                      {/* Metadados (data, profissional, unidade) */}
                      {/* flex-wrap = quebrar linha se não couber */}
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                        {/* Data com ícone de calendário */}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.date)}  {/* Ex: "25/01/2026" */}
                        </span>

                        {/* Profissional (se houver) */}
                        {item.professional && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.professional}
                          </span>
                        )}

                        {/* Unidade (se houver) */}
                        {item.unit && (
                          <span className="text-muted-foreground">
                            {item.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* LADO DIREITO: Badge de status */}
                    {/* Cores diferentes por status:
                        - Realizado = verde (emerald)
                        - Agendado = azul (blue)
                        - Pendente = amarelo (yellow) */}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'Realizado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Agendado'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
