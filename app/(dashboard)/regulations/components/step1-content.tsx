'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, User, Check, Loader2, AlertCircle, Edit2 } from 'lucide-react'
import { formatCPF, formatPhone } from '@/lib/format'
import { CITIZEN_PDF_REQUIRED_FIELDS } from '@/lib/constants'
import { format, differenceInYears } from 'date-fns'
import { CitizenForm } from '../../citizens/components/citizen-form'
import { type CitizenFormData } from '@/lib/validators'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Citizen {
  id: string
  name: string
  socialName?: string | null
  cpf: string
  cns?: string | null
  birthDate: string
  gender?: string | null
  race?: string | null
  sex?: string | null
  phone: string
  email?: string | null
  motherName?: string | null
  fatherName?: string | null
  postalCode?: string | null
  address?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  nationality?: string | null
  placeOfBirth?: string | null
  maritalStatus?: string | null
  bloodType?: string | null
  rg?: string | null
  rgIssuer?: string | null
  rgState?: string | null
  rgIssueDate?: string | null
  quality?: number
}

interface Step1ContentProps {
  selectedCitizen: Citizen | null
  onCitizenSelect: (citizen: Citizen | null) => void
  selectedResponsible: Citizen | null
  onResponsibleSelect: (citizen: Citizen | null) => void
  relationship: string | null
  onRelationshipChange: (value: string | null) => void
  onAdvance?: () => void
}

// Campos obrigatórios para geração de documentos PDF (importado de constants.ts)
const PDF_REQUIRED_FIELDS = CITIZEN_PDF_REQUIRED_FIELDS.map(f => f.field as keyof Citizen)

// Labels para exibição dos campos faltantes (derivado de constants.ts)
const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  CITIZEN_PDF_REQUIRED_FIELDS.map(f => [f.field, f.label])
)

const RELATIONSHIP_OPTIONS = [
  { value: 'PARENT', label: 'Pai/Mae' },
  { value: 'SPOUSE', label: 'Conjuge' },
  { value: 'CAREGIVER', label: 'Cuidador(a)' },
  { value: 'SIBLING', label: 'Irmao(a)' },
  { value: 'UNCLE_AUNT', label: 'Tio(a)' },
  { value: 'COUSIN', label: 'Primo(a)' },
  { value: 'NEPHEW_NIECE', label: 'Sobrinho(a)' },
  { value: 'BOYFRIEND_GIRLFRIEND', label: 'Namorado(a)' },
  { value: 'FRIEND', label: 'Amigo(a)' },
]

const computeQuality = (data: Partial<Citizen>) => {
  const total = PDF_REQUIRED_FIELDS.length
  const filled = PDF_REQUIRED_FIELDS.reduce((acc, field) => {
    const value = data[field]
    if (value === null || value === undefined || value === "") {
      return acc
    }
    return acc + 1
  }, 0)
  return Math.round((filled / total) * 100)
}

// Retorna lista de campos obrigatórios não preenchidos
const getMissingFields = (data: Partial<Citizen>): string[] => {
  return PDF_REQUIRED_FIELDS
    .filter(field => {
      const value = data[field]
      return value === null || value === undefined || value === ""
    })
    .map(field => FIELD_LABELS[field] || field)
}

const getQualityMeta = (value: number) => {
  if (value >= 100) {
    return { label: 'Completo', className: 'bg-green-100 text-green-800' }
  }
  if (value >= 60) {
    return { label: 'Parcial', className: 'bg-yellow-100 text-yellow-800' }
  }
  return { label: 'Incompleto', className: 'bg-red-100 text-red-800' }
}

const formatCitizen = (raw: any): Citizen => {
  const quality = computeQuality(raw)
  return {
    id: String(raw.id),
    name: raw.name,
    socialName: raw.socialName,
    cpf: raw.cpf ? formatCPF(raw.cpf) : "",
    cns: raw.cns || null,
    birthDate: raw.birthDate ? format(new Date(raw.birthDate), 'dd/MM/yyyy') : '',
    gender: raw.gender || null,
    race: raw.race || null,
    sex: raw.sex || null,
    phone: raw.phone ? formatPhone(raw.phone) : "Nao informado",
    email: raw.email || null,
    motherName: raw.motherName || null,
    fatherName: raw.fatherName || null,
    postalCode: raw.postalCode || null,
    address: raw.address || null,
    number: raw.number || null,
    complement: raw.complement || null,
    neighborhood: raw.neighborhood || null,
    city: raw.city || null,
    state: raw.state || null,
    nationality: raw.nationality || null,
    placeOfBirth: raw.placeOfBirth || null,
    maritalStatus: raw.maritalStatus || null,
    bloodType: raw.bloodType || null,
    rg: raw.rg || null,
    rgIssuer: raw.rgIssuer || null,
    rgState: raw.rgState || null,
    rgIssueDate: raw.rgIssueDate || null,
    quality,
  }
}

const fetchCitizens = async (term: string, signal?: AbortSignal) => {
  const response = await fetch(`/api/citizens?search=${encodeURIComponent(term)}&limit=10`, { signal })
  if (!response.ok) throw new Error('Erro ao buscar cidadaos')
  const result = await response.json()
  const items: Record<string, unknown>[] = result.data || result || []
  return items.map(formatCitizen)
}

const useCitizenSearch = (enabled: boolean) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Citizen[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const handleSearch = useCallback(async (term: string) => {
    if (!enabled) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setIsSearching(true)
    try {
      const results = await fetchCitizens(term, controller.signal)
      setSearchResults(results)
      setShowResults(true)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('Erro ao buscar cidadaos:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setSearchResults([])
      setShowResults(false)
      return
    }
    const timer = setTimeout(() => {
      if (searchTerm.length >= 3) {
        handleSearch(searchTerm)
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 500)
    return () => {
      clearTimeout(timer)
      abortRef.current?.abort()
    }
  }, [searchTerm, handleSearch, enabled])

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    showResults,
    setShowResults,
    isSearching,
  }
}

export function Step1Content({
  selectedCitizen,
  onCitizenSelect,
  selectedResponsible,
  onResponsibleSelect,
  relationship,
  onRelationshipChange,
  onAdvance,
}: Step1ContentProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [responsibleEnabled, setResponsibleEnabled] = useState(!!selectedResponsible)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const citizenSearch = useCitizenSearch(true)
  const responsibleSearch = useCitizenSearch(responsibleEnabled)

  // Limpar busca quando cidadão for selecionado
  useEffect(() => {
    if (selectedCitizen) {
      citizenSearch.setSearchTerm('')
      citizenSearch.setShowResults(false)
    }
  }, [selectedCitizen])

  // Limpar busca quando responsável for selecionado
  useEffect(() => {
    if (selectedResponsible) {
      responsibleSearch.setSearchTerm('')
      responsibleSearch.setShowResults(false)
    }
  }, [selectedResponsible])

  const citizenAge = useMemo(() => {
    if (!selectedCitizen?.birthDate) return null
    try {
      const [day, month, year] = selectedCitizen.birthDate.split('/')
      const birthDate = new Date(Number(year), Number(month) - 1, Number(day))
      return differenceInYears(new Date(), birthDate)
    } catch {
      return null
    }
  }, [selectedCitizen])

  const needsResponsible = useMemo(() => {
    if (citizenAge === null) return false
    return citizenAge < 18 || citizenAge > 65
  }, [citizenAge])

  const handleSelectCitizen = (citizen: Citizen) => {
    onCitizenSelect(citizen)
    // Limpar a busca após seleção
    citizenSearch.setSearchTerm('')
    citizenSearch.setShowResults(false)
  }

  const handleSelectResponsible = (citizen: Citizen) => {
    onResponsibleSelect(citizen)
    // Limpar a busca após seleção
    responsibleSearch.setSearchTerm('')
    responsibleSearch.setShowResults(false)
  }

  const handleToggleResponsible = (enabled: boolean) => {
    setResponsibleEnabled(enabled)
    if (!enabled) {
      onResponsibleSelect(null)
      onRelationshipChange(null)
      responsibleSearch.setSearchTerm("")
      responsibleSearch.setShowResults(false)
    }
  }

  const handleCreateCitizen = async (data: CitizenFormData) => {
    setIsCreating(true)
    try {
      let sex: string = 'MALE'
      if (data.gender === 'F') sex = 'FEMALE'
      else if (data.gender === 'O') sex = 'OTHER'

      const apiBody = {
        name: data.name,
        cpf: data.cpf,
        birthDate: data.birthDate,
        gender: data.gender,
        sex,
        phone: data.phone,
        email: data.email || null,
        cns: data.cartaoSus || null,
        rg: data.rg || null,
        rgIssuer: data.rgIssuer || null,
        rgState: data.rgState || null,
        rgIssueDate: data.rgIssueDate || null,
        motherName: data.motherName || null,
        fatherName: data.fatherName || null,
        socialName: data.socialName || null,
        race: data.race || null,
        nationality: data.nationality || null,
        placeOfBirth: data.placeOfBirth || null,
        maritalStatus: data.maritalStatus || null,
        bloodType: data.bloodType || null,
        address: data.address,
      }

      const response = await fetch('/api/citizens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiBody),
      })

      if (!response.ok) throw new Error('Erro ao cadastrar cidadao')
      const created = await response.json()
      const formatted = formatCitizen(created)
      onCitizenSelect(formatted)
      toast.success('Cidadao cadastrado com sucesso!')
      onAdvance?.()
    } catch (error) {
      console.error('Erro ao cadastrar cidadao:', error)
      toast.error('Erro ao cadastrar cidadao')
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateCitizen = async (data: CitizenFormData) => {
    if (!selectedCitizen) return
    setIsUpdating(true)
    try {
      let sex: string = 'MALE'
      if (data.gender === 'F') sex = 'FEMALE'
      else if (data.gender === 'O') sex = 'OTHER'

      const apiBody = {
        name: data.name,
        cpf: data.cpf,
        birthDate: data.birthDate,
        gender: data.gender,
        sex,
        phone: data.phone,
        email: data.email || null,
        cns: data.cartaoSus || null,
        rg: data.rg || null,
        rgIssuer: data.rgIssuer || null,
        rgState: data.rgState || null,
        rgIssueDate: data.rgIssueDate || null,
        motherName: data.motherName || null,
        fatherName: data.fatherName || null,
        socialName: data.socialName || null,
        race: data.race || null,
        nationality: data.nationality || null,
        placeOfBirth: data.placeOfBirth || null,
        maritalStatus: data.maritalStatus || null,
        bloodType: data.bloodType || null,
        address: data.address,
      }

      const response = await fetch(`/api/citizens/${selectedCitizen.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(apiBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', response.status, errorData)
        throw new Error(errorData.error || 'Erro ao atualizar cidadao')
      }
      const updated = await response.json()
      const formatted = formatCitizen(updated)
      onCitizenSelect(formatted)
      toast.success('Cadastro atualizado com sucesso!')
      setIsEditModalOpen(false)
    } catch (error) {
      console.error('Erro ao atualizar cidadao:', error)
      toast.error('Erro ao atualizar cidadao')
    } finally {
      setIsUpdating(false)
    }
  }

  const renderSearchResults = (
    results: Citizen[],
    onSelect: (citizen: Citizen) => void
  ) => (
    <div className="absolute z-10 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-60 overflow-auto">
      {results.map((citizen) => {
        const quality = citizen.quality ?? 0
        const qualityMeta = getQualityMeta(quality)
        return (
          <button
            key={citizen.id}
            onClick={() => onSelect(citizen)}
            className="w-full p-3 text-left hover:bg-muted flex items-center gap-3 border-b last:border-0"
          >
            <User className="h-8 w-8 text-muted-foreground bg-muted rounded-full p-1.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium truncate">{citizen.name}</p>
                <Badge className={qualityMeta.className}>
                  {qualityMeta.label} {quality}%
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">CPF: {citizen.cpf}</p>
              <p className="text-sm text-muted-foreground">Tel: {citizen.phone}</p>
            </div>
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-6">
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Buscar Cidadao</TabsTrigger>
          <TabsTrigger value="new">Cadastrar Novo</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CPF (minimo 3 caracteres)..."
                value={citizenSearch.searchTerm}
                onChange={(e) => citizenSearch.setSearchTerm(e.target.value)}
                className="pl-10"
              />

              {citizenSearch.isSearching && (
                <div className="absolute z-10 w-full mt-1 bg-card border rounded-lg shadow-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Buscando cidadaos...</span>
                  </div>
                </div>
              )}

              {!citizenSearch.isSearching && citizenSearch.showResults && citizenSearch.searchResults.length > 0 &&
                renderSearchResults(citizenSearch.searchResults, handleSelectCitizen)}
            </div>

            {selectedCitizen && (
              <Card className={cn(
                "border-2 transition-colors",
                (selectedCitizen.quality || 0) < 100 
                  ? "bg-red-50 border-red-200" 
                  : "bg-primary/5 border-primary/20"
              )}>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center text-white",
                        (selectedCitizen.quality || 0) < 100 ? "bg-red-500" : "bg-primary"
                      )}>
                        {(selectedCitizen.quality || 0) < 100 ? <AlertCircle className="h-6 w-6" /> : <Check className="h-6 w-6" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">{selectedCitizen.name}</p>
                          {typeof selectedCitizen.quality === "number" && (
                            <Badge className={getQualityMeta(selectedCitizen.quality).className}>
                              {getQualityMeta(selectedCitizen.quality).label} {selectedCitizen.quality}%
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          CPF: {selectedCitizen.cpf} - Nasc: {selectedCitizen.birthDate}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Tel: {selectedCitizen.phone}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditModalOpen(true)}
                          className="gap-2"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          { (selectedCitizen.quality || 0) < 100 ? "Completar Cadastro" : "Editar" }
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onCitizenSelect(null)
                            citizenSearch.setSearchTerm("")
                          }}
                        >
                          Alterar
                        </Button>
                      </div>
                    </div>

                    {(selectedCitizen.quality || 0) < 100 && (
                      <div className="flex items-start gap-2 p-3 bg-red-100 text-red-800 rounded-md text-sm border border-red-200">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <div className="space-y-2">
                          <p className="font-semibold">Cadastro Incompleto para Gerar PDFs</p>
                          <p>Os seguintes campos obrigatórios precisam ser preenchidos:</p>
                          <div className="flex flex-wrap gap-1">
                            {getMissingFields(selectedCitizen).map((field) => (
                              <span key={field} className="px-2 py-0.5 bg-red-200 rounded text-xs">
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {needsResponsible && !selectedResponsible && (
                      <div className="flex items-start gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm border border-yellow-200">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <div>
                          <p className="font-semibold">Atencao ao Responsavel</p>
                          <p>O cidadao selecionado possui {citizenAge} anos. Recomendamos a adicao de um responsavel.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {!selectedCitizen && !citizenSearch.isSearching && citizenSearch.searchTerm.length >= 3 && citizenSearch.searchResults.length === 0 && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Nenhum cidadao encontrado com "{citizenSearch.searchTerm}"
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    Use a aba "Cadastrar Novo" para adicionar um novo cidadao.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          <CitizenForm
            onSubmit={handleCreateCitizen}
            isLoading={isCreating}
            submitLabel="Cadastrar Cidadao"
          />
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Adicionar responsavel</p>
              <p className="text-sm text-muted-foreground">Selecione um responsavel e a relacao familiar.</p>
            </div>
            <Switch
              checked={responsibleEnabled}
              onCheckedChange={handleToggleResponsible}
            />
          </div>

          {responsibleEnabled && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar responsavel (minimo 3 caracteres)..."
                  value={responsibleSearch.searchTerm}
                  onChange={(e) => responsibleSearch.setSearchTerm(e.target.value)}
                  className="pl-10"
                />

                {responsibleSearch.isSearching && (
                  <div className="absolute z-10 w-full mt-1 bg-card border rounded-lg shadow-lg p-4">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Buscando responsaveis...</span>
                    </div>
                  </div>
                )}

                {!responsibleSearch.isSearching && responsibleSearch.showResults && responsibleSearch.searchResults.length > 0 &&
                  renderSearchResults(responsibleSearch.searchResults, handleSelectResponsible)}
              </div>

              {selectedResponsible && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div>
                    <p className="font-medium">{selectedResponsible.name}</p>
                    <p className="text-sm text-muted-foreground">CPF: {selectedResponsible.cpf}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onResponsibleSelect(null)
                      responsibleSearch.setSearchTerm("")
                    }}
                  >
                    Alterar
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label>Relacao familiar</Label>
                <Select
                  value={relationship || ""}
                  onValueChange={(value) => onRelationshipChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a relacao" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle>Atualizar Cadastro do Cidadao</DialogTitle>
          </DialogHeader>
          {selectedCitizen && (
            <CitizenForm
              defaultValues={{
                name: selectedCitizen.name,
                socialName: selectedCitizen.socialName || "",
                cpf: selectedCitizen.cpf,
                cartaoSus: selectedCitizen.cns || "",
                birthDate: selectedCitizen.birthDate ? selectedCitizen.birthDate.split('/').reverse().join('-') : "",
                gender: (selectedCitizen.gender as any) || "O",
                race: selectedCitizen.race || "",
                phone: selectedCitizen.phone,
                email: selectedCitizen.email || "",
                motherName: selectedCitizen.motherName || "",
                fatherName: selectedCitizen.fatherName || "",
                nationality: selectedCitizen.nationality || "",
                placeOfBirth: selectedCitizen.placeOfBirth || "",
                maritalStatus: selectedCitizen.maritalStatus || "",
                bloodType: selectedCitizen.bloodType || "",
                rg: selectedCitizen.rg || "",
                rgIssuer: selectedCitizen.rgIssuer || "",
                rgState: selectedCitizen.rgState || "",
                rgIssueDate: selectedCitizen.rgIssueDate ? selectedCitizen.rgIssueDate.split('T')[0] : "",
                address: {
                  cep: selectedCitizen.postalCode || "",
                  logradouro: selectedCitizen.address || "",
                  numero: selectedCitizen.number || "",
                  complemento: selectedCitizen.complement || "",
                  bairro: selectedCitizen.neighborhood || "",
                  cidade: selectedCitizen.city || "",
                  estado: selectedCitizen.state || "",
                }
              }}
              onSubmit={handleUpdateCitizen}
              isLoading={isUpdating}
              submitLabel="Salvar Alteracoes"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
