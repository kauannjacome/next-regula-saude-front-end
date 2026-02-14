'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { PRIORITIES } from '@/lib/constants'
import { Loader2 } from 'lucide-react'

interface UpdatePriorityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPriority: string
  onUpdate: (priority: string, justification: string) => Promise<void>
}

export function UpdatePriorityModal({
  open,
  onOpenChange,
  currentPriority,
  onUpdate,
}: UpdatePriorityModalProps) {
  const [priority, setPriority] = useState(currentPriority)
  const [justification, setJustification] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!justification.trim()) {
      setError('A justificativa é obrigatória')
      return
    }

    setIsLoading(true)
    setError('')
    try {
      await onUpdate(priority, justification)
      setJustification('')
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle>Atualizar Prioridade</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nova Prioridade</Label>
            <RadioGroup value={priority} onValueChange={setPriority} className="flex gap-4">
              {PRIORITIES.map((p) => (
                <div key={p.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={p.value} id={`priority-modal-${p.value}`} />
                  <label
                    htmlFor={`priority-modal-${p.value}`}
                    className={`text-sm cursor-pointer px-3 py-1 rounded-full ${
                      priority === p.value
                        ? p.value === 'EMERGENCY'
                          ? 'bg-red-100 text-red-800'
                          : p.value === 'URGENCY'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                        : ''
                    }`}
                  >
                    {p.label}
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>
              Justificativa <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="Justifique a mudança de prioridade..."
              value={justification}
              onChange={(e) => {
                setJustification(e.target.value)
                setError('')
              }}
              rows={4}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
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
                Atualizando...
              </>
            ) : (
              'Atualizar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
