'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared'
import { searchCID, type CIDCode } from '@/lib/cid-utils'
import { cn } from '@/lib/utils'

interface DeadlineCheck {
  hasMinDeadline: boolean
  eligible: boolean
  minDeadlineDays: number
  daysRemaining?: number | null
  lastRequestDate?: string | null
  nextAllowedDate?: string | null
}

interface SelectedCare {
  careId: number
  name: string
  acronym?: string | null
  quantity: number
  unitMeasure?: string | null
  minDeadlineDays?: number | null
  priority?: string | null
  resourceOrigin?: string | null
  userId?: string | null
  supplierId?: number | null
  templateId?: number | null
  deadlineCheck?: DeadlineCheck | null
}

interface Step2Data {
  requestingProfessional: string
  requestDate: string
  notes: string
  clinicalIndication: string
  cid: string
  cares: SelectedCare[]
}

interface Step2ContentProps {
  data: Step2Data
  onChange: (data: Step2Data) => void
  citizenId?: string | null
}

interface CareOption {
  id: number
  name: string
  acronym?: string | null
  unitMeasure?: string | null
  minDeadlineDays?: number | null
  priority?: string | null
  resourceOrigin?: string | null
  userId?: string | null
  supplierId?: number | null
  templateId?: number | null
}

const UNIT_MEASURE_LABELS: Record<string, string> = {
  MG: 'mg',
  G: 'g',
  MCG: 'mcg',
  KG: 'kg',
  ML: 'ml',
  L: 'L',
  AMP: 'Ampola',
  COMP: 'Comprimido',
  CAPS: 'Capsula',
  FR: 'Frasco',
  TUB: 'Tubo',
  DOSE: 'Dose',
  UI: 'UI',
  CX: 'Caixa',
  UN: 'Unidade',
  SESSION: 'Sessao',
  DAILY: 'Diario',
  MEASURE: 'Medida',
  OINTMENT: 'Pomada',
  CREAM: 'Creme',
  GEL: 'Gel',
}

const formatUnitMeasure = (value?: string | null) => {
  if (!value) return '-'
  return UNIT_MEASURE_LABELS[value] || value
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR')
}

export function Step2Content({ data, onChange, citizenId }: Step2ContentProps) {
  const normalizedData: Step2Data = {
    requestingProfessional: data?.requestingProfessional ?? '',
    requestDate: data?.requestDate ?? '',
    notes: data?.notes ?? '',
    clinicalIndication: data?.clinicalIndication ?? '',
    cid: data?.cid ?? '',
    cares: Array.isArray(data?.cares) ? data.cares : [],
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<CareOption[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  
  const [cidSearchTerm, setCidSearchTerm] = useState(normalizedData.cid)
  const [cidResults, setCidResults] = useState<CIDCode[]>([])
  const [showCidResults, setShowCidResults] = useState(false)

  const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false)
  const [pendingCare, setPendingCare] = useState<CareOption | null>(null)
  const [pendingDeadline, setPendingDeadline] = useState<DeadlineCheck | null>(null)

  const updateField = (field: keyof Step2Data, value: string) => {
    onChange({ ...normalizedData, [field]: value })
  }

  const abortRef = useRef<AbortController | null>(null)

  const handleSearch = useCallback(async (term: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setIsSearching(true)
    try {
      const response = await fetch(`/api/care?search=${encodeURIComponent(term)}&limit=15`, {
        signal: controller.signal,
      })
      if (!response.ok) throw new Error('Erro ao buscar cuidados')
      const result = await response.json()
      const items = Array.isArray(result) ? result : result.data || []
      setSearchResults(items)
      setShowResults(true)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('Erro ao buscar cuidados:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        handleSearch(searchTerm)
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 400)
    return () => {
      clearTimeout(timer)
      abortRef.current?.abort()
    }
  }, [searchTerm, handleSearch])

  // CID Search Logic
  useEffect(() => {
    if (cidSearchTerm.length >= 2) {
      const results = searchCID(cidSearchTerm)
      setCidResults(results)
      setShowCidResults(true)
    } else {
      setCidResults([])
      setShowCidResults(false)
    }
  }, [cidSearchTerm])

  const checkMinDeadline = async (careId: number) => {
    if (!citizenId) return null
    try {
      const params = new URLSearchParams()
      params.set('citizenId', String(citizenId))
      if (normalizedData.requestDate) params.set('requestDate', normalizedData.requestDate)
      const response = await fetch(`/api/care/${careId}/min-deadline?${params.toString()}`)
      if (!response.ok) return null
      return (await response.json()) as DeadlineCheck
    } catch (error) {
      console.error('Erro ao verificar prazo minimo:', error)
      return null
    }
  }

  const addCare = (care: CareOption, deadlineCheck?: DeadlineCheck | null) => {
    const newCare: SelectedCare = {
      careId: care.id,
      name: care.name,
      acronym: care.acronym,
      quantity: 1,
      unitMeasure: care.unitMeasure,
      minDeadlineDays: care.minDeadlineDays,
      priority: care.priority,
      resourceOrigin: care.resourceOrigin,
      userId: care.userId,
      supplierId: care.supplierId,
      templateId: care.templateId,
      deadlineCheck: deadlineCheck || null,
    }
    onChange({ ...normalizedData, cares: [...normalizedData.cares, newCare] })
    setSearchTerm('')
    setShowResults(false)
  }

  const handleSelectCare = async (care: CareOption) => {
    if (normalizedData.cares.some((item) => item.careId === care.id)) {
      setSearchTerm('')
      setShowResults(false)
      return
    }
    const deadlineCheck = await checkMinDeadline(care.id)
    if (deadlineCheck && deadlineCheck.hasMinDeadline && !deadlineCheck.eligible) {
      setPendingCare(care)
      setPendingDeadline(deadlineCheck)
      setDeadlineDialogOpen(true)
      return
    }
    addCare(care, deadlineCheck)
  }

  const handleConfirmDeadline = () => {
    if (pendingCare) {
      addCare(pendingCare, pendingDeadline)
    }
    setPendingCare(null)
    setPendingDeadline(null)
    setDeadlineDialogOpen(false)
  }

  const handleRemoveCare = (careId: number) => {
    onChange({ ...normalizedData, cares: normalizedData.cares.filter((care) => care.careId !== careId) })
  }

  const handleQuantityChange = (careId: number, value: string) => {
    const quantity = Math.max(1, Number(value) || 1)
    const updated = normalizedData.cares.map((care) =>
      care.careId === careId ? { ...care, quantity } : care
    )
    onChange({ ...normalizedData, cares: updated })
  }

  const handleSelectCID = (cid: CIDCode) => {
    updateField('cid', cid.code)
    setCidSearchTerm(cid.code)
    setShowCidResults(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            Data da Solicitacao <span className="text-red-500">*</span>
          </Label>
          <Input
            type="date"
            value={normalizedData.requestDate}
            onChange={(e) => updateField('requestDate', e.target.value)}
            className={cn(!normalizedData.requestDate && "border-red-200 bg-red-50/10")}
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            Profissional Solicitante <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Nome do profissional"
            value={normalizedData.requestingProfessional}
            onChange={(e) => updateField('requestingProfessional', e.target.value)}
            className={cn(!normalizedData.requestingProfessional && "border-red-200 bg-red-50/10")}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            Indicacao Clinica <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Motivo ou indicacao"
            value={normalizedData.clinicalIndication}
            onChange={(e) => updateField('clinicalIndication', e.target.value)}
            className={cn(!normalizedData.clinicalIndication && "border-red-200 bg-red-50/10")}
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            CID <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              placeholder="Busque por codigo ou nome (Ex: J18.9)"
              value={cidSearchTerm}
              onChange={(e) => {
                setCidSearchTerm(e.target.value)
                updateField('cid', e.target.value)
              }}
              className={cn(!normalizedData.cid && "border-red-200 bg-red-50/10")}
            />
            {showCidResults && cidResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-60 overflow-auto">
                {cidResults.map((cid) => (
                  <button
                    key={cid.code}
                    onClick={() => handleSelectCID(cid)}
                    className="w-full p-2 text-left hover:bg-muted flex items-center justify-between gap-3 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">{cid.code}</p>
                      <p className="text-xs text-muted-foreground">{cid.name}</p>
                    </div>
                    {normalizedData.cid === cid.code && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observacoes / Notas</Label>
        <Textarea
          placeholder="Informacoes adicionais relevantes"
          value={normalizedData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-4 pt-4 border-t">
        <div className="space-y-2">
          <Label>Buscar cuidado</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite nome, sigla ou codigo do cuidado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />

            {isSearching && (
              <div className="absolute z-10 w-full mt-1 bg-card border rounded-lg shadow-lg p-4">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Buscando cuidados...</span>
                </div>
              </div>
            )}

            {!isSearching && showResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-60 overflow-auto">
                {searchResults.map((care) => (
                  <button
                    key={care.id}
                    onClick={() => handleSelectCare(care)}
                    className="w-full p-3 text-left hover:bg-muted flex items-center justify-between gap-3 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">
                        {care.acronym ? `${care.acronym} - ${care.name}` : care.name}
                      </p>
                      <p className="text-xs text-muted-foreground">Unidade: {formatUnitMeasure(care.unitMeasure)}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">Selecionar</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            Cuidados selecionados
            <Badge variant="secondary" className="font-normal">{normalizedData.cares.length}</Badge>
          </Label>
          
          {normalizedData.cares.length === 0 && (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="h-24 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Nenhum cuidado selecionado ainda.</p>
              </CardContent>
            </Card>
          )}

          {normalizedData.cares.map((care) => (
            <Card key={care.careId} className="border-l-4 border-l-primary/50">
              <CardContent className="pt-4 space-y-2">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-12 md:col-span-5">
                    <p className="font-medium">
                      {care.acronym ? `${care.acronym} - ${care.name}` : care.name}
                    </p>
                    <p className="text-xs text-muted-foreground">Unidade: {formatUnitMeasure(care.unitMeasure)}</p>
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <Label className="text-xs">Quantidade</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        value={care.quantity}
                        onChange={(e) => handleQuantityChange(care.careId, e.target.value)}
                        className="h-8"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatUnitMeasure(care.unitMeasure)}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-4 md:col-span-2 hidden md:block">
                    <Label className="text-xs invisible">Status</Label>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Selecionado
                    </Badge>
                  </div>
                  <div className="col-span-2 md:col-span-2 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveCare(care.careId)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {care.deadlineCheck && !care.deadlineCheck.eligible && (
                  <div className="flex items-start gap-2 rounded-md bg-yellow-50 border border-yellow-200 p-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-xs text-yellow-800">
                      <p>Prazo minimo de recalculo: faltam {care.deadlineCheck.daysRemaining ?? 0} dias.</p>
                      <p>Ultima solicitacao: {formatDate(care.deadlineCheck.lastRequestDate)}.</p>
                      <p>Proxima data permitida seguindo a regra: {formatDate(care.deadlineCheck.nextAllowedDate)}.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={deadlineDialogOpen}
        onOpenChange={setDeadlineDialogOpen}
        onConfirm={handleConfirmDeadline}
        title="Regra de Prazo Minimo"
        description="Este cuidado possui um prazo minimo entre solicitacoes que ainda nao foi atendido. Deseja prosseguir com a inclusao?"
        confirmLabel="Sim, prosseguir"
      >
        {pendingDeadline && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-sm text-yellow-900 space-y-2">
            <p><strong>Prazo minimo configurado:</strong> {pendingDeadline.minDeadlineDays} dias.</p>
            <p><strong>Faltam para atingir a regra:</strong> {pendingDeadline.daysRemaining ?? 0} dias.</p>
            <p><strong>Ultima solicitacao registrada:</strong> {formatDate(pendingDeadline.lastRequestDate)}.</p>
            <p><strong>Data recomendada para nova solicitacao:</strong> {formatDate(pendingDeadline.nextAllowedDate)}.</p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}
