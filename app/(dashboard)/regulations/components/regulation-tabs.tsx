'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Stethoscope, FileText, AlertTriangle, Hash } from 'lucide-react'
import RegulationDocuments from './regulation-documents'
import { formatDate } from '@/lib/format'
import { StatusBadge, PriorityBadge } from '@/components/shared'

interface RegulationTabsProps {
  regulation: any
}

// Formatar número de protocolo
const formatProtocol = (num?: number | null) => {
  if (!num) return '-'
  const year = new Date().getFullYear()
  return `${String(num).padStart(6, '0')}/${year}`
}

export default function RegulationTabs({ regulation }: RegulationTabsProps) {
  return (
    <Tabs defaultValue="details" className="w-full">
      <div className="w-full overflow-x-auto pb-2 mb-6">
        <TabsList className="w-full justify-start h-auto p-1 bg-transparent border-b rounded-none min-w-max">
          <TabsTrigger
            value="details"
            className="rounded-t-lg data-[state=active]:bg-background data-[state=active]:border-b-primary data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-b-none px-6 py-3"
          >
            Detalhes
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="rounded-t-lg data-[state=active]:bg-background data-[state=active]:border-b-primary data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-b-none px-6 py-3"
          >
            Documentos
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-t-lg data-[state=active]:bg-background data-[state=active]:border-b-primary data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-b-none px-6 py-3"
          >
            Histórico
          </TabsTrigger>
        </TabsList>
      </div>

      {/* DETALHES */}
      <TabsContent value="details" forceMount className="space-y-6 data-[state=inactive]:hidden">
        {/* Card: Informações da Regulação */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              <CardTitle>Informações da Regulação</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Protocolo</p>
              <p className="font-mono text-lg font-bold text-primary mt-1">
                {formatProtocol(regulation.protocolNumber || regulation.id)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Código</p>
              <p className="font-mono font-medium mt-1">{regulation.idCode || '-'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="mt-1">
                <StatusBadge status={regulation.status || ''} type="regulation" />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Prioridade</p>
              <div className="mt-1">
                <PriorityBadge priority={regulation.priority || ''} />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Criação</p>
              <p className="font-medium mt-1">
                {regulation.createdAt ? formatDate(regulation.createdAt, "dd/MM/yyyy 'às' HH:mm") : '-'}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Data da Solicitação</p>
              <p className="font-medium mt-1">
                {regulation.requestDate ? formatDate(regulation.requestDate, 'dd/MM/yyyy') : '-'}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Criado por</p>
              <p className="font-medium mt-1">{regulation.creator?.name || '-'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Profissional Solicitante</p>
              <p className="font-medium mt-1">{regulation.requestingProfessional || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card: Dados da Solicitação */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <CardTitle>Dados Clínicos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">CID</p>
              <p className="font-mono font-medium mt-1">{regulation.cid || '-'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Indicação Clínica</p>
              <p className="mt-1 text-sm">{regulation.clinicalIndication || '-'}</p>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Procedimento(s)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {regulation.cares?.map((careItem: any) => (
                  <Badge key={careItem.care.id} variant="outline" className="text-sm">
                    {careItem.care.acronym ? `${careItem.care.acronym} - ` : ''}{careItem.care.name}
                    {careItem.quantity > 1 && <span className="ml-1 text-muted-foreground">x{careItem.quantity}</span>}
                  </Badge>
                ))}
                {(!regulation.cares || regulation.cares.length === 0) && <p className="text-muted-foreground">-</p>}
              </div>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Observações</p>
              <p className="mt-1 text-sm">{regulation.notes || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* DOCUMENTOS */}
      <TabsContent value="documents" forceMount className="data-[state=inactive]:hidden">
        <RegulationDocuments
          regulationId={regulation.id}
          initialUploads={regulation.uploads || []}
        />
      </TabsContent>

      {/* HISTÓRICO */}
      <TabsContent value="history" forceMount className="data-[state=inactive]:hidden">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle>Histórico de Eventos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 border-l ml-6 space-y-8">
              {regulation.notifications?.map((notification: any) => (
                <div key={notification.id} className="relative">
                  <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-primary border-4 border-background" />
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <time className="text-xs text-muted-foreground">
                      {formatDate(notification.createdAt, "dd 'de' MMMM 'às' HH:mm")}
                    </time>
                  </div>
                </div>
              ))}
              {(!regulation.notifications || regulation.notifications.length === 0) && (
                <div className="text-sm text-muted-foreground">Nenhum evento registrado.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
