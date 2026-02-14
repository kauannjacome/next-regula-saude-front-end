// ==========================================
// COMPONENTE: FILTROS DE REGULAÇÕES
// ==========================================
// Filtros coloridos e modernos para a lista de regulações
// Usa cache Zustand para evitar chamadas repetidas à API

'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, X, Check } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { REGULATION_STATUSES, PRIORITIES, REGULATION_STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/constants'
import { DateRange } from 'react-day-picker'
import { useCachedUnits, useCachedUsers, useCachedSuppliers } from '@/hooks/use-cached-data'

interface RegulationFiltersProps {
  selectedStatuses: string[]
  onStatusChange: (statuses: string[]) => void
  selectedPriority: string
  onPriorityChange: (priority: string) => void
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  requestDateRange?: DateRange | undefined
  onRequestDateRangeChange?: (range: DateRange | undefined) => void
  selectedUnit: string
  onUnitChange: (unit: string) => void
  selectedCreatedBy?: string
  onCreatedByChange?: (userId: string) => void
  selectedResponsible?: string
  onResponsibleChange?: (userId: string) => void
  selectedSupplier?: string
  onSupplierChange?: (supplierId: string) => void
  onClear: () => void
}

export function RegulationFilters({
  selectedStatuses,
  onStatusChange,
  selectedPriority,
  onPriorityChange,
  dateRange,
  onDateRangeChange,
  requestDateRange,
  onRequestDateRangeChange,
  selectedUnit,
  onUnitChange,
  selectedCreatedBy,
  onCreatedByChange,
  selectedResponsible,
  onResponsibleChange,
  selectedSupplier,
  onSupplierChange,
  onClear,
}: RegulationFiltersProps) {
  // Usar cache Zustand em vez de fetch direto (dados são compartilhados entre componentes)
  const { data: unitsData, isLoading: loadingUnits } = useCachedUnits()
  const { data: usersData, isLoading: loadingUsers } = useCachedUsers()
  const { data: suppliersData, isLoading: loadingSuppliers } = useCachedSuppliers()

  // Mapear dados para o formato esperado (com tipagem correta)
  const units = unitsData.map((u) => ({ id: String(u.id), name: u.name }))
  const users = usersData.map((u) => ({ id: String(u.id), name: u.name }))
  const suppliers = suppliersData.map((s) => ({ id: String(s.id), name: s.name }))

  const handleStatusToggle = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter((s) => s !== status))
    } else {
      onStatusChange([...selectedStatuses, status])
    }
  }

  const getStatusConfig = (value: string) => {
    return REGULATION_STATUS_CONFIG[value as keyof typeof REGULATION_STATUS_CONFIG] || {
      label: value,
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200'
    }
  }

  const getPriorityConfig = (value: string) => {
    return PRIORITY_CONFIG[value as keyof typeof PRIORITY_CONFIG] || {
      label: value,
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between pb-4 border-b">
        <h3 className="font-semibold text-lg">Filtros</h3>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-red-500 hover:text-red-600 hover:bg-red-50">
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      </div>

      <div className="space-y-6">
        {/* FILTRO: STATUS - Badges coloridos clicáveis */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-700">Status</Label>
          <div className="flex flex-wrap gap-2">
            {REGULATION_STATUSES.map((status) => {
              const config = getStatusConfig(status.value)
              const isSelected = selectedStatuses.includes(status.value)
              return (
                <button
                  key={status.value}
                  onClick={() => handleStatusToggle(status.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2',
                    isSelected
                      ? `${config.bg} ${config.text} ${config.border} ring-2 ring-offset-1 ring-primary/30`
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  )}
                >
                  {isSelected && <Check className="inline-block w-3 h-3 mr-1" />}
                  {config.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* FILTRO: PRIORIDADE - Badges coloridos */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-700">Prioridade</Label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onPriorityChange('all')}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2',
                selectedPriority === 'all'
                  ? 'bg-gray-200 text-gray-800 border-gray-300 ring-2 ring-offset-1 ring-primary/30'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
              )}
            >
              {selectedPriority === 'all' && <Check className="inline-block w-3 h-3 mr-1" />}
              Todas
            </button>
            {PRIORITIES.map((priority) => {
              const config = getPriorityConfig(priority.value)
              const isSelected = selectedPriority === priority.value
              return (
                <button
                  key={priority.value}
                  onClick={() => onPriorityChange(priority.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2',
                    isSelected
                      ? `${config.bg} ${config.text} ${config.border} ring-2 ring-offset-1 ring-primary/30`
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  )}
                >
                  {isSelected && <Check className="inline-block w-3 h-3 mr-1" />}
                  {config.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* FILTRO: PERÍODO DE CRIAÇÃO */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Período de Criação</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal h-10',
                  !dateRange && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <span className="text-blue-600 font-medium">
                      {format(dateRange.from, 'dd/MM/yy', { locale: ptBR })} - {format(dateRange.to, 'dd/MM/yy', { locale: ptBR })}
                    </span>
                  ) : (
                    <span className="text-blue-600 font-medium">
                      {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  )
                ) : (
                  'Selecione o período'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* FILTRO: DATA DE SOLICITAÇÃO */}
        {onRequestDateRangeChange && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Data da Solicitação</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-10',
                    !requestDateRange && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-green-500" />
                  {requestDateRange?.from ? (
                    requestDateRange.to ? (
                      <span className="text-green-600 font-medium">
                        {format(requestDateRange.from, 'dd/MM/yy', { locale: ptBR })} - {format(requestDateRange.to, 'dd/MM/yy', { locale: ptBR })}
                      </span>
                    ) : (
                      <span className="text-green-600 font-medium">
                        {format(requestDateRange.from, 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    )
                  ) : (
                    'Selecione a data'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={requestDateRange?.from}
                  selected={requestDateRange}
                  onSelect={onRequestDateRangeChange}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* FILTRO: UNIDADE */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Unidade</Label>
          <Select value={selectedUnit} onValueChange={onUnitChange}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Todas as unidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as unidades</SelectItem>
              {loadingUnits ? (
                <SelectItem value="__loading__" disabled>Carregando...</SelectItem>
              ) : null}
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* FILTRO: CRIADO POR */}
        {onCreatedByChange && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Criado por</Label>
            <Select value={selectedCreatedBy || 'all'} onValueChange={onCreatedByChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Todos os usuários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {loadingUsers ? (
                  <SelectItem value="__loading__" disabled>Carregando...</SelectItem>
                ) : null}
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* FILTRO: RESPONSÁVEL */}
        {onResponsibleChange && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Responsável</Label>
            <Select value={selectedResponsible || 'all'} onValueChange={onResponsibleChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Todos os responsáveis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                {loadingUsers ? (
                  <SelectItem value="__loading__" disabled>Carregando...</SelectItem>
                ) : null}
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* FILTRO: FORNECEDOR */}
        {onSupplierChange && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Fornecedor</Label>
            <Select value={selectedSupplier || 'all'} onValueChange={onSupplierChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Todos os fornecedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os fornecedores</SelectItem>
                {loadingSuppliers ? (
                  <SelectItem value="__loading__" disabled>Carregando...</SelectItem>
                ) : null}
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  )
}
