'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2 } from 'lucide-react'

interface RegulationData {
  id: number
  protocolNumber: string | null
  status: string | null
  priority: string | null
  requestDate: string | null
  requestingProfessional: string | null
  clinicalIndication: string | null
  cid: string | null
  notes: string | null
  relationship: string | null
  createdAt: string
  citizen: {
    id: number
    name: string
    cpf: string | null
    cns: string | null
    birthDate: string | null
    phone: string | null
    motherName: string | null
    address: string | null
    number: string | null
    neighborhood: string | null
    city: string | null
    state: string | null
    postalCode: string | null
  } | null
  responsible: {
    id: number
    name: string
    cpf: string | null
  } | null
  creator: {
    name: string | null
  } | null
  folder: {
    name: string
  } | null
  supplier: {
    name: string
  } | null
  cares: {
    quantity: number
    care: {
      name: string
      acronym: string | null
    }
  }[]
}

const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: 'Em Analise',
  APPROVED: 'Aprovado',
  DENIED: 'Negado',
  RETURNED: 'Devolvido',
}

const PRIORITY_LABELS: Record<string, string> = {
  EMERGENCY: 'Emergencia',
  URGENCY: 'Urgencia',
  ELECTIVE: 'Eletiva',
}

const formatCPF = (cpf: string | null) => {
  if (!cpf) return '-'
  const cleaned = cpf.replace(/\D/g, '')
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return '-'
  }
}

const formatPhone = (phone: string | null) => {
  if (!phone) return '-'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}

export default function RegulationPrintPage() {
  const params = useParams()
  const regulationId = Array.isArray(params.id) ? params.id[0] : params.id
  const [regulation, setRegulation] = useState<RegulationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRegulation = async () => {
      try {
        const response = await fetch(`/api/regulations/${regulationId}`)
        if (!response.ok) throw new Error('Erro ao carregar regulacao')
        const data = await response.json()
        setRegulation(data)
      } catch (err) {
        setError('Erro ao carregar dados da regulacao')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (regulationId) {
      fetchRegulation()
    }
  }, [regulationId])

  // Auto-print when data is loaded
  useEffect(() => {
    if (regulation && !loading) {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [regulation, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando...</span>
      </div>
    )
  }

  if (error || !regulation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error || 'Regulacao nao encontrada'}</p>
      </div>
    )
  }

  const citizen = regulation.citizen

  return (
    <div className="print-page p-8 max-w-4xl mx-auto bg-white">
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            margin: 0;
            padding: 20px;
          }
        }
        @page {
          size: A4;
          margin: 15mm;
        }
      `}</style>

      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold">REGULACAO DE SAUDE</h1>
        <p className="text-lg mt-1">
          Protocolo: {regulation.protocolNumber || `#${regulation.id}`}
        </p>
        <p className="text-sm text-gray-600">
          Emitido em: {format(new Date(), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
        </p>
      </div>

      {/* Status and Priority */}
      <div className="grid grid-cols-3 gap-4 mb-6 border p-4">
        <div>
          <p className="text-sm font-semibold text-gray-600">Status</p>
          <p className="font-bold">{STATUS_LABELS[regulation.status || ''] || regulation.status}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-600">Prioridade</p>
          <p className="font-bold">{PRIORITY_LABELS[regulation.priority || ''] || regulation.priority}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-600">Data Solicitacao</p>
          <p className="font-bold">{formatDate(regulation.requestDate)}</p>
        </div>
      </div>

      {/* Patient Info */}
      <div className="mb-6">
        <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">
          DADOS DO PACIENTE
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div>
            <span className="font-semibold">Nome:</span> {citizen?.name || '-'}
          </div>
          <div>
            <span className="font-semibold">CPF:</span> {formatCPF(citizen?.cpf || null)}
          </div>
          <div>
            <span className="font-semibold">CNS:</span> {citizen?.cns || '-'}
          </div>
          <div>
            <span className="font-semibold">Data Nascimento:</span> {formatDate(citizen?.birthDate)}
          </div>
          <div>
            <span className="font-semibold">Telefone:</span> {formatPhone(citizen?.phone || null)}
          </div>
          <div>
            <span className="font-semibold">Nome da Mae:</span> {citizen?.motherName || '-'}
          </div>
          <div className="col-span-2">
            <span className="font-semibold">Endereco:</span>{' '}
            {citizen?.address ? (
              `${citizen.address}${citizen.number ? `, ${citizen.number}` : ''} - ${citizen.neighborhood || ''}, ${citizen.city || ''} - ${citizen.state || ''}, CEP: ${citizen.postalCode || ''}`
            ) : '-'}
          </div>
        </div>
      </div>

      {/* Responsible (if different from patient) */}
      {regulation.responsible && regulation.responsible.id !== regulation.citizen?.id && (
        <div className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">
            RESPONSAVEL
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="font-semibold">Nome:</span> {regulation.responsible.name}
            </div>
            <div>
              <span className="font-semibold">CPF:</span> {formatCPF(regulation.responsible.cpf)}
            </div>
            <div>
              <span className="font-semibold">Relacao:</span> {regulation.relationship || '-'}
            </div>
          </div>
        </div>
      )}

      {/* Clinical Info */}
      <div className="mb-6">
        <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">
          INFORMACOES CLINICAS
        </h2>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-semibold">Profissional Solicitante:</span>{' '}
            {regulation.requestingProfessional || '-'}
          </div>
          <div>
            <span className="font-semibold">CID:</span> {regulation.cid || '-'}
          </div>
          <div>
            <span className="font-semibold">Indicacao Clinica:</span>{' '}
            {regulation.clinicalIndication || '-'}
          </div>
          {regulation.notes && (
            <div>
              <span className="font-semibold">Observacoes:</span> {regulation.notes}
            </div>
          )}
        </div>
      </div>

      {/* Procedures */}
      {regulation.cares && regulation.cares.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">
            PROCEDIMENTOS SOLICITADOS
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-semibold">#</th>
                <th className="text-left py-2 font-semibold">Procedimento</th>
                <th className="text-left py-2 font-semibold">Codigo</th>
                <th className="text-center py-2 font-semibold">Qtd</th>
              </tr>
            </thead>
            <tbody>
              {regulation.cares.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{index + 1}</td>
                  <td className="py-2">{item.care.name}</td>
                  <td className="py-2">{item.care.acronym || '-'}</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Additional Info */}
      <div className="mb-6">
        <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">
          INFORMACOES ADICIONAIS
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {regulation.folder && (
            <div>
              <span className="font-semibold">Pasta:</span> {regulation.folder.name}
            </div>
          )}
          {regulation.supplier && (
            <div>
              <span className="font-semibold">Prestador:</span> {regulation.supplier.name}
            </div>
          )}
          <div>
            <span className="font-semibold">Criado por:</span>{' '}
            {regulation.creator?.name || '-'}
          </div>
          <div>
            <span className="font-semibold">Data Criacao:</span>{' '}
            {formatDate(regulation.createdAt)}
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-12 pt-6 border-t">
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="border-t border-black pt-2 mx-8">
              <p className="font-semibold">Assinatura do Paciente/Responsavel</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-black pt-2 mx-8">
              <p className="font-semibold">Assinatura e Carimbo do Profissional</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-500 border-t pt-4">
        <p>Documento gerado automaticamente pelo Sistema de Regulacao</p>
        <p>Este documento nao possui validade sem as devidas assinaturas</p>
      </div>

      {/* Print Button (only visible on screen) */}
      <div className="no-print mt-8 text-center">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Imprimir
        </button>
        <button
          onClick={() => window.close()}
          className="ml-4 px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}
