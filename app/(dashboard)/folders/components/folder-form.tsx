// ==========================================
// COMPONENTE: FORMULÁRIO DE PASTA
// ==========================================

'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { folderSchema, type FolderFormData } from '@/lib/validators'
import { Loader2, User } from 'lucide-react'
import { format } from 'date-fns'

interface UserOption {
  id: string
  name: string
}

interface FolderFormProps {
  defaultValues?: Partial<FolderFormData>
  onSubmit: (data: FolderFormData) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

export function FolderForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Salvar Pasta'
}: FolderFormProps) {
  const [selectedColor, setSelectedColor] = useState(defaultValues?.color || '#3B82F6')
  const [users, setUsers] = useState<UserOption[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  // Buscar usuários para o select de responsável
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users?limit=100')
        if (response.ok) {
          const result = await response.json()
          const data = result.data || result
          setUsers(Array.isArray(data) ? data.map((u: any) => ({ id: u.id, name: u.name })) : [])
        }
      } catch (error) {
        console.error('Erro ao buscar usuários:', error)
      } finally {
        setLoadingUsers(false)
      }
    }
    fetchUsers()
  }, [])

  const { register, handleSubmit, formState: { errors }, setValue, control } = useForm<FolderFormData>({
    resolver: zodResolver(folderSchema) as any,
    defaultValues: defaultValues || { color: '#3B82F6' },
  })

  // Cores pré-definidas para facilidade
  const presetColors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16']

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Dados da Pasta</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input placeholder="Nome da pasta" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Responsável</Label>
            <Controller
              name="responsibleId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || ''}
                  onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)}
                  disabled={loadingUsers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingUsers ? "Carregando..." : "Selecione o responsável"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">Nenhum responsável</span>
                    </SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {user.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : undefined)}
                    placeholder="Selecione a data de início"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : undefined)}
                    placeholder="Selecione a data de fim"
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea placeholder="Descrição da pasta" {...register('description')} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => { setSelectedColor(color); setValue('color', color) }}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Selecionar cor ${color}`}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={selectedColor}
                onChange={(e) => { setSelectedColor(e.target.value); setValue('color', e.target.value) }}
                className="w-20 h-10 p-1"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Preview:</span>
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: selectedColor }} />
              <span className="text-sm font-mono">{selectedColor}</span>
            </div>
            {errors.color && <p className="text-sm text-destructive">{errors.color.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : submitLabel}
      </Button>
    </form>
  )
}
