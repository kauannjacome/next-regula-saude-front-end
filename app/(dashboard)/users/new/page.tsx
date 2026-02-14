'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared'
import { UserForm } from '../components/user-form'
import { type UserFormData } from '@/lib/validators'
import { toast } from 'sonner'
import apiClient from '@/lib/api/api-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search, UserPlus, ArrowLeft } from 'lucide-react'
import { formatCPF } from '@/lib/format'

interface LookupResult {
  exists: boolean
  user?: {
    id: string
    name: string
    email: string
    cpf: string
    phoneNumber: string
  }
  hasEmployment?: boolean
  employmentStatus?: string | null
}

interface TenantRole {
  id: string
  name: string
  displayName: string
  priority: number
}

export default function NewUserPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // CPF pre-check state
  const [cpfInput, setCpfInput] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null)
  const [showFullForm, setShowFullForm] = useState(false)

  // Invite state
  const [roles, setRoles] = useState<TenantRole[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)

  const handleCpfLookup = async () => {
    if (cpfInput.length < 14) {
      toast.error('Digite um CPF completo')
      return
    }

    setLookupLoading(true)
    setLookupResult(null)

    try {
      const res = await apiClient.get(`/users/lookup?cpf=${encodeURIComponent(cpfInput)}`)
      const data = res.data as LookupResult

      setLookupResult(data)

      if (data.exists) {
        // Fetch available roles for invite
        const rolesRes = await apiClient.get('/roles')
        setRoles(rolesRes.data || [])
      }
    } catch (error) {
      console.error('Error looking up CPF:', error)
      toast.error('Erro ao buscar CPF')
    } finally {
      setLookupLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!lookupResult?.user?.id || !selectedRoleId) {
      toast.error('Selecione um papel para o convite')
      return
    }

    setInviteLoading(true)
    try {
      await apiClient.post('/users/invite', {
        userId: lookupResult.user.id,
        roleId: selectedRoleId,
      })
      toast.success('Convite enviado com sucesso!')
      router.push('/users')
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Erro ao enviar convite'
      toast.error(message)
    } finally {
      setInviteLoading(false)
    }
  }

  const handleSubmit = async (data: UserFormData) => {
    setIsLoading(true)
    try {
      await apiClient.post('/users', {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        cpf: data.cpf,
        phoneNumber: data.phoneNumber,
        council: data.council,
        councilNumber: data.councilNumber,
        councilUf: data.councilUf,
        specialty: data.specialty,

        // Personal Data
        birthDate: data.birthDate,
        sex: data.sex,
        maritalStatus: data.maritalStatus,
        motherName: data.motherName,
        fatherName: data.fatherName,
        nationality: data.nationality,

        // Identification
        rg: data.rg,

        // Address
        address: data.address,

        isPasswordTemp: data.isPasswordTemp,
      })
      toast.success('Usuario cadastrado com sucesso!')
      router.push('/users')
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Erro ao cadastrar usuario')
    } finally {
      setIsLoading(false)
    }
  }

  // Show full form (skip pre-check)
  if (showFullForm) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader
          title="Novo Usuario"
          description="Cadastre um novo usuario no sistema"
          backHref="/users"
        />
        <UserForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Cadastrar Usuario"
          isEditMode={false}
          defaultValues={cpfInput.length === 14 ? { cpf: cpfInput } : undefined}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Novo Usuario"
        description="Verifique se o usuario ja existe antes de cadastrar"
        backHref="/users"
      />

      {/* CPF Pre-check Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Verificar CPF
          </CardTitle>
          <CardDescription>
            Digite o CPF para verificar se o usuário já existe no sistema.
            Se existir, você poderá convidá-lo diretamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="cpfLookup">CPF</Label>
              <Input
                id="cpfLookup"
                placeholder="000.000.000-00"
                maxLength={14}
                value={cpfInput}
                onChange={(e) => setCpfInput(formatCPF(e.target.value))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCpfLookup() } }}
              />
            </div>
            <Button onClick={handleCpfLookup} disabled={lookupLoading || cpfInput.length < 14}>
              {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Buscar
            </Button>
          </div>

          {/* Lookup result: user exists */}
          {lookupResult?.exists && lookupResult.user && (
            <div className="mt-4 p-4 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 space-y-4">
              <div>
                <p className="font-medium text-sm">Usuário encontrado:</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>{' '}
                    <span className="font-medium">{lookupResult.user.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>{' '}
                    <span className="font-medium">{lookupResult.user.email}</span>
                  </div>
                </div>
              </div>

              {lookupResult.hasEmployment ? (
                <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-950/30 text-sm">
                  <p>
                    Este usuário já possui vínculo ({lookupResult.employmentStatus === 'PENDING' ? 'pendente' : lookupResult.employmentStatus === 'ACCEPTED' ? 'ativo' : 'rejeitado'}).
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Papel para o convite</Label>
                    <Select onValueChange={setSelectedRoleId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o papel" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleInvite} disabled={inviteLoading || !selectedRoleId}>
                      {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                      Convidar
                    </Button>
                    <Button variant="outline" onClick={() => { setLookupResult(null); setCpfInput('') }}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lookup result: user does not exist */}
          {lookupResult && !lookupResult.exists && (
            <div className="mt-4 p-4 rounded-lg border bg-muted/50 space-y-3">
              <p className="text-sm text-muted-foreground">
                Nenhum usuário encontrado com este CPF. Você pode cadastrar um novo.
              </p>
              <Button onClick={() => setShowFullForm(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastrar Novo Usuário
              </Button>
            </div>
          )}

          {/* Skip pre-check button */}
          {!lookupResult && (
            <div className="pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowFullForm(true)} className="text-muted-foreground">
                Pular verificação e cadastrar diretamente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
