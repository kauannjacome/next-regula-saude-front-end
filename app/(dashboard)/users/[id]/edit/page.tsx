'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PageHeader, FormSkeleton } from '@/components/shared'
import { UserForm } from '../../components/user-form'
import { type UserFormData } from '@/lib/validators'
import { toast } from 'sonner'
import apiClient from '@/lib/api/api-client'

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [user, setUser] = useState<UserFormData | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      setIsFetching(true)
      try {
        const response = await apiClient.get(`/users/${params.id}`)
        const data = response.data
        // Get role from employments if available
        const roleFromEmployment = data.employments?.[0]?.tenantRole?.name || 'typist'
        setUser({
          name: data.name || '',
          email: data.email || '',
          role: roleFromEmployment,
          status: data.isBlocked ? 'Inativo' : 'Ativo',
          cpf: data.cpf || '',
          phoneNumber: data.phoneNumber || '',
          birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : '',
          sex: data.sex || '',
          maritalStatus: data.maritalStatus || '',
          motherName: data.motherName || '',
          fatherName: data.fatherName || '',
          nationality: data.nationality || 'Brasileira',
          isPasswordTemp: false, // Default to false in edit mode (password not shown unless changed)

          // Identification
          rg: data.rg || '',
          // Profissional
          council: data.registryType || '',
          councilNumber: data.registryNumber || '',
          councilUf: data.registryState || '',
          specialty: data.position || '',

          // Address
          address: {
            cep: data.postalCode || '',
            logradouro: data.address || '',
            numero: data.number || '',
            complemento: data.complement || '',
            bairro: data.neighborhood || '',
            cidade: data.city || '',
            estado: data.state || '',
          }
        })
      } catch (error: any) {
        if (error.response?.status === 404) {
          toast.error('Usuario nao encontrado')
          router.push('/users')
        } else {
          console.error('Error fetching user:', error)
          toast.error('Erro ao carregar dados do usuario')
        }
      } finally {
        setIsFetching(false)
      }
    }

    fetchUser()
  }, [params.id, router])

  const handleSubmit = async (data: UserFormData) => {
    setIsLoading(true)
    try {
      await apiClient.put(`/users/${params.id}`, {
        name: data.name,
        email: data.email,
        role: data.role,
        isBlocked: data.status === 'Inativo',
        cpf: data.cpf,
        phoneNumber: data.phoneNumber,
        birthDate: data.birthDate || null,
        sex: data.sex || null,
        maritalStatus: data.maritalStatus || null,
        motherName: data.motherName || null,
        fatherName: data.fatherName || null,
        nationality: data.nationality || null,
        rg: data.rg || null,
        council: data.council,
        councilNumber: data.councilNumber,
        councilUf: data.councilUf,
        specialty: data.specialty,
        // Endereço
        postalCode: data.address?.cep || null,
        address: data.address?.logradouro || null,
        number: data.address?.numero || null,
        complement: data.address?.complemento || null,
        neighborhood: data.address?.bairro || null,
        city: data.address?.cidade || null,
        state: data.address?.estado || null,
      })
      toast.success('Usuario atualizado com sucesso!')
      router.push('/users')
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Erro ao atualizar usuario')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Editar Usuario"
        description="Atualize os dados do usuario"
        backHref="/users"
      />

      {isFetching ? (
        <FormSkeleton />
      ) : user ? (
        <UserForm
          defaultValues={user}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Atualizar Usuario"
          isEditMode={true}
        />
      ) : (
        <p className="text-muted-foreground">Usuario nao encontrado</p>
      )}
    </div>
  )
}
