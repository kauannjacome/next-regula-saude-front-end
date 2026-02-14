'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/shared/page-header'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import {
  Settings,
  Building2,
  Mail,
  Phone,
  MapPin,
  Upload,
  Loader2,
  Save,
  Image as ImageIcon,
  X,
} from 'lucide-react'

interface LogoData {
  id: number
  filename: string
  url: string
}

interface TenantSettings {
  id: number
  name: string
  municipalityName: string
  email: string
  telephone: string
  cnpj: string
  postalCode: string
  city: string
  neighborhood: string
  street: string
  number: string
  stateName: string
  stateAcronym: string
  logos: {
    state: LogoData | null
    municipal: LogoData | null
    administration: LogoData | null
  }
}

export default function TenantSettingsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<TenantSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    municipalityName: '',
    email: '',
    telephone: '',
    postalCode: '',
    city: '',
    neighborhood: '',
    street: '',
    number: '',
    stateName: '',
    stateAcronym: '',
  })

  const stateLogoRef = useRef<HTMLInputElement>(null)
  const municipalLogoRef = useRef<HTMLInputElement>(null)
  const adminLogoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session?.user) {
      router.push('/login')
      return
    }
    fetchSettings()
  }, [session, sessionStatus, router])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/tenant/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setFormData({
          name: data.name || '',
          municipalityName: data.municipalityName || '',
          email: data.email || '',
          telephone: data.telephone || '',
          postalCode: data.postalCode || '',
          city: data.city || '',
          neighborhood: data.neighborhood || '',
          street: data.street || '',
          number: data.number || '',
          stateName: data.stateName || '',
          stateAcronym: data.stateAcronym || '',
        })
      } else if (response.status === 403) {
        toast.error('Sem permissão para acessar configurações')
        router.push('/')
      } else {
        toast.error('Erro ao carregar configurações')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/tenant/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        toast.success('Configurações salvas com sucesso!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    logoType: 'state' | 'municipal' | 'administration'
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }

    setUploadingLogo(logoType)

    try {
      // Upload do arquivo
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', `tenant-logo-${logoType}`)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Erro ao fazer upload da imagem')
      }

      const uploadData = await uploadResponse.json()

      // Mapear tipo de logo para campo do banco
      const fieldMap = {
        state: 'logoStateUploadId',
        municipal: 'logoMunicipalUploadId',
        administration: 'logoAdministrationUploadId',
      }

      // Atualizar configurações com o novo logo
      const updateResponse = await fetch('/api/tenant/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [fieldMap[logoType]]: uploadData.id,
        }),
      })

      if (updateResponse.ok) {
        const data = await updateResponse.json()
        setSettings(data)
        toast.success('Logo atualizado com sucesso!')
      } else {
        throw new Error('Erro ao atualizar logo')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao atualizar logo')
    } finally {
      setUploadingLogo(null)
      // Limpar input
      if (logoType === 'state' && stateLogoRef.current) stateLogoRef.current.value = ''
      if (logoType === 'municipal' && municipalLogoRef.current) municipalLogoRef.current.value = ''
      if (logoType === 'administration' && adminLogoRef.current) adminLogoRef.current.value = ''
    }
  }

  const handleRemoveLogo = async (logoType: 'state' | 'municipal' | 'administration') => {
    const fieldMap = {
      state: 'logoStateUploadId',
      municipal: 'logoMunicipalUploadId',
      administration: 'logoAdministrationUploadId',
    }

    try {
      const response = await fetch('/api/tenant/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [fieldMap[logoType]]: null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        toast.success('Logo removido com sucesso!')
      } else {
        toast.error('Erro ao remover logo')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao remover logo')
    }
  }

  if (sessionStatus === 'loading' || isLoading) {
    return <CardSkeleton />
  }

  if (!settings) {
    return null
  }

  const LogoUploadCard = ({
    title,
    description,
    logo,
    logoType,
    inputRef,
  }: {
    title: string
    description: string
    logo: LogoData | null
    logoType: 'state' | 'municipal' | 'administration'
    inputRef: React.RefObject<HTMLInputElement>
  }) => (
    <div className="flex flex-col items-center gap-3 p-4 border rounded-lg">
      <div className="text-center">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {logo ? (
        <div className="relative">
          <img
            src={logo.url}
            alt={title}
            className="w-24 h-24 object-contain border rounded-lg bg-white"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={() => handleRemoveLogo(logoType)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleLogoUpload(e, logoType)}
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploadingLogo === logoType}
      >
        {uploadingLogo === logoType ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            {logo ? 'Trocar' : 'Enviar'}
          </>
        )}
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Configurações da Prefeitura"
          description="Gerencie as informações e identidade visual"
          icon={Settings}
        />
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>

      {/* Identidade Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Identidade Visual
          </CardTitle>
          <CardDescription>
            Logos que aparecem nos documentos e relatórios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <LogoUploadCard
              title="Logo do Estado"
              description="Brasão ou logo estadual"
              logo={settings.logos.state}
              logoType="state"
              inputRef={stateLogoRef}
            />
            <LogoUploadCard
              title="Logo Municipal"
              description="Brasão da prefeitura"
              logo={settings.logos.municipal}
              logoType="municipal"
              inputRef={municipalLogoRef}
            />
            <LogoUploadCard
              title="Logo Administração"
              description="Logo da gestão atual"
              logo={settings.logos.administration}
              logoType="administration"
              inputRef={adminLogoRef}
            />
          </div>
        </CardContent>
      </Card>

      {/* Informações Institucionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informações Institucionais
          </CardTitle>
          <CardDescription>
            Dados cadastrais da prefeitura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Assinante</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="municipalityName">Nome do Município</Label>
              <Input
                id="municipalityName"
                name="municipalityName"
                value={formData.municipalityName}
                onChange={handleInputChange}
                placeholder="Nome do município"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={settings.cnpj}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                CNPJ não pode ser alterado
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contato
          </CardTitle>
          <CardDescription>
            Informações de contato da prefeitura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="email@prefeitura.gov.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Telefone</Label>
              <Input
                id="telephone"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                placeholder="(00) 0000-0000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereço
          </CardTitle>
          <CardDescription>
            Endereço da sede da prefeitura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="postalCode">CEP</Label>
              <Input
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="00000-000"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="street">Logradouro</Label>
              <Input
                id="street"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                placeholder="Rua, Avenida, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                name="number"
                value={formData.number}
                onChange={handleInputChange}
                placeholder="Nº"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleInputChange}
                placeholder="Bairro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Cidade"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stateName">Estado</Label>
              <Input
                id="stateName"
                name="stateName"
                value={formData.stateName}
                onChange={handleInputChange}
                placeholder="Estado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stateAcronym">UF</Label>
              <Input
                id="stateAcronym"
                name="stateAcronym"
                value={formData.stateAcronym}
                onChange={handleInputChange}
                placeholder="UF"
                maxLength={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
