'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Phone, Briefcase, ArrowRight, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface StepProfileProps {
  userData?: {
    name?: string | null
    email?: string | null
    avatarUrl?: string | null
    phoneNumber?: string | null
    position?: string | null
  }
  onContinue: (data: Record<string, unknown>) => void
  isLoading?: boolean
}

export function StepProfile({ userData, onContinue, isLoading }: StepProfileProps) {
  const [phoneNumber, setPhoneNumber] = useState(userData?.phoneNumber || '')
  const [position, setPosition] = useState(userData?.position || '')
  const [imagePreview, setImagePreview] = useState(userData?.avatarUrl || '')

  // Formatar telefone
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) return cleaned
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
    if (cleaned.length <= 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhone(e.target.value))
  }

  // Upload de imagem para S3
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Maximo 2MB.')
      return
    }

    // Preview local imediato
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload real para S3
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', 'user-avatar')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Falha no upload')

      const data = await response.json()
      if (data.url) {
        setImagePreview(data.url)
      }
    } catch {
      toast.error('Erro ao enviar imagem. Preview local mantido.')
    }
  }

  const handleContinue = () => {
    onContinue({
      phoneNumber: phoneNumber.replace(/\D/g, ''),
      position,
      avatarUrl: imagePreview,
    })
  }

  // Verificar se ja tem dados completos
  const isComplete = userData?.phoneNumber && userData?.position

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 mb-4">
          <User className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold">Complete seu perfil</h1>
        <p className="text-muted-foreground">
          Adicione algumas informacoes para personalizar sua experiencia
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informacoes Pessoais</CardTitle>
          <CardDescription>
            Essas informacoes serao visiveis para outros usuarios do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={imagePreview} />
              <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                {userData?.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="avatar-upload"
              />
              <label htmlFor="avatar-upload">
                <Button variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Alterar foto
                  </span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground">
                JPG, PNG. Max 2MB.
              </p>
            </div>
          </div>

          {/* Nome e email (readonly) */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={userData?.name || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={userData?.email || ''} disabled />
            </div>
          </div>

          {/* Campos editaveis */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="h-4 w-4 inline mr-2" />
                Telefone
              </Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                value={phoneNumber}
                onChange={handlePhoneChange}
                maxLength={15}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">
                <Briefcase className="h-4 w-4 inline mr-2" />
                Cargo/Funcao
              </Label>
              <Input
                id="position"
                placeholder="Ex: Medico, Enfermeiro, Administrativo"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        {isComplete && (
          <Button
            variant="ghost"
            onClick={() => onContinue({})}
            disabled={isLoading}
          >
            Pular
          </Button>
        )}
        <Button onClick={handleContinue} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              Continuar
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
