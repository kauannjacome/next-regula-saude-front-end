'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface ScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSchedule: (data: {
    date: string
    time: string
    unitId: string
    professionalId?: string
    observations?: string
  }) => Promise<void>
}

export function ScheduleModal({ open, onOpenChange, onSchedule }: ScheduleModalProps) {
  const [units, setUnits] = useState<{ id: string; name: string }[]>([])
  const [professionals, setProfessionals] = useState<{ id: string; name: string }[]>([])
  const [loadingUnits, setLoadingUnits] = useState(true)
  const [loadingProfessionals, setLoadingProfessionals] = useState(true)

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await fetch('/api/units')
        if (!response.ok) throw new Error('Erro ao buscar unidades')
        const data = await response.json()
        setUnits(data.data || data || [])
      } catch (error) {
        console.error('Erro ao buscar unidades:', error)
      } finally {
        setLoadingUnits(false)
      }
    }
    const fetchProfessionals = async () => {
      try {
        const response = await fetch('/api/professionals')
        if (!response.ok) throw new Error('Erro ao buscar profissionais')
        const data = await response.json()
        setProfessionals(data.data || data || [])
      } catch (error) {
        console.error('Erro ao buscar profissionais:', error)
      } finally {
        setLoadingProfessionals(false)
      }
    }
    fetchUnits()
    fetchProfessionals()
  }, [])
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [unitId, setUnitId] = useState('')
  const [professionalId, setProfessionalId] = useState('')
  const [observations, setObservations] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!date) newErrors.date = 'Data é obrigatória'
    if (!time) newErrors.time = 'Hora é obrigatória'
    if (!unitId) newErrors.unitId = 'Unidade é obrigatória'

    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      newErrors.date = 'Data não pode ser anterior a hoje'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setIsLoading(true)
    try {
      await onSchedule({
        date,
        time,
        unitId,
        professionalId: professionalId || undefined,
        observations: observations || undefined,
      })
      resetForm()
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setDate('')
    setTime('')
    setUnitId('')
    setProfessionalId('')
    setObservations('')
    setErrors({})
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[425px] rounded-lg">
        <DialogHeader>
          <DialogTitle>Agendar Regulação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Data <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value)
                  setErrors({ ...errors, date: '' })
                }}
                min={new Date().toISOString().split('T')[0]}
                className={errors.date ? 'border-destructive' : ''}
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
            </div>

            <div className="space-y-2">
              <Label>
                Hora <span className="text-destructive">*</span>
              </Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value)
                  setErrors({ ...errors, time: '' })
                }}
                className={errors.time ? 'border-destructive' : ''}
              />
              {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Unidade <span className="text-destructive">*</span>
            </Label>
            <Select
              value={unitId}
              onValueChange={(value) => {
                setUnitId(value)
                setErrors({ ...errors, unitId: '' })
              }}
            >
              <SelectTrigger className={errors.unitId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {loadingUnits && (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                )}
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.unitId && <p className="text-sm text-destructive">{errors.unitId}</p>}
          </div>

          <div className="space-y-2">
            <Label>Profissional (opcional)</Label>
            <Select value={professionalId} onValueChange={setProfessionalId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {loadingProfessionals && (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                )}
                {professionals.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações sobre o agendamento..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Agendando...
              </>
            ) : (
              'Agendar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
