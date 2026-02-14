'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader, ConfirmDialog } from '@/components/shared'
import {
  Building2,
  Edit,
  Trash2,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/api/api-client'

interface SupplierData {
  id: number
  name: string
  tradeName?: string | null
  cnpj?: string | null
  stateRegistration?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  postalCode?: string | null
  address?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  createdAt: string
  updatedAt: string
}

const formatCNPJ = (cnpj: string | null | undefined) => {
  if (!cnpj) return '-'
  const cleaned = cnpj.replace(/\D/g, '')
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

const formatPhone = (phone: string | null | undefined) => {
  if (!phone) return '-'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export default function SupplierDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const supplierId = Array.isArray(params.id) ? params.id[0] : params.id

  const [supplier, setSupplier] = useState<SupplierData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.get(`/suppliers/${supplierId}`)
        setSupplier(response.data || response)
      } catch (error) {
        console.error('Erro ao carregar fornecedor:', error)
        toast.error('Erro ao carregar fornecedor')
        router.push('/suppliers')
      } finally {
        setIsLoading(false)
      }
    }

    if (supplierId) {
      fetchSupplier()
    }
  }, [supplierId, router])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await apiClient.delete(`/suppliers/${supplierId}`)
      toast.success('Fornecedor excluido com sucesso')
      router.push('/suppliers')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir fornecedor')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-6 max-w-5xl">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="container py-6 max-w-5xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Fornecedor nao encontrado</p>
          <Link href="/suppliers">
            <Button variant="link" className="mt-4">Voltar para fornecedores</Button>
          </Link>
        </div>
      </div>
    )
  }

  const hasAddress = supplier.address || supplier.city || supplier.state

  return (
    <div className="container py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <PageHeader
          title={supplier.name}
          description={supplier.tradeName || 'Detalhes do fornecedor'}
          backHref="/suppliers"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Card: Dados Cadastrais */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Dados Cadastrais</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Razao Social</p>
                  <p className="font-medium">{supplier.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                  <p className="font-medium">{supplier.tradeName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CNPJ</p>
                  <p className="font-mono font-medium">{formatCNPJ(supplier.cnpj)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inscricao Estadual</p>
                  <p className="font-mono font-medium">{supplier.stateRegistration || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Contato */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <CardTitle>Contato</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{formatPhone(supplier.phone)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">E-mail</p>
                    <p className="font-medium">
                      {supplier.email ? (
                        <a href={`mailto:${supplier.email}`} className="text-primary hover:underline">
                          {supplier.email}
                        </a>
                      ) : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:col-span-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <p className="font-medium">
                      {supplier.website ? (
                        <a
                          href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {supplier.website}
                        </a>
                      ) : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Endereco */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle>Endereco</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {hasAddress ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">CEP</p>
                    <p className="font-medium">{supplier.postalCode || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Logradouro</p>
                    <p className="font-medium">
                      {supplier.address}
                      {supplier.number && `, ${supplier.number}`}
                      {supplier.complement && ` - ${supplier.complement}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bairro</p>
                    <p className="font-medium">{supplier.neighborhood || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cidade/Estado</p>
                    <p className="font-medium">
                      {supplier.city || '-'}
                      {supplier.state && ` - ${supplier.state}`}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Endereco nao cadastrado</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Acoes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Acoes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/suppliers/${supplier.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Fornecedor
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Fornecedor
              </Button>
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Informacoes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">ID</p>
                <p className="font-medium">#{supplier.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">{formatDate(supplier.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Atualizado em</p>
                <p className="font-medium">{formatDate(supplier.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog: Confirmar Exclusao */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Fornecedor"
        description={`Tem certeza que deseja excluir o fornecedor "${supplier.name}"?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  )
}
