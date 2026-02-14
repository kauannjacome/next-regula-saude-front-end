'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  ArrowLeft,
  Phone,
  Mail,
  CreditCard,
  Edit,
  Briefcase,
  Loader2,
} from 'lucide-react'
import { formatDate, getInitials } from '@/lib/format'
import { toast } from 'sonner'
import Link from 'next/link'

interface UserData {
  id: string
  name: string | null
  email: string | null
  cpf: string | null
  phoneNumber: string | null
  position: string | null
  registryType: string | null
  registryNumber: string | null
  registryState: string | null
  createdAt: string
  employments?: Array<{
    tenantRole?: { name: string; displayName: string }
  }>
}

export default function UserDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`/api/users/${userId}`)
        if (!response.ok) throw new Error('Erro ao carregar profissional')
        const data = await response.json()
        setUser(data)
      } catch {
        toast.error('Erro ao carregar dados do profissional')
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) fetchUser()
  }, [userId])

  if (isLoading) {
    return (
      <div className="container py-6 max-w-5xl">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container py-6 max-w-5xl">
        <p className="text-center text-muted-foreground py-20">
          Profissional nao encontrado
        </p>
      </div>
    )
  }

  return (
    <div className="container py-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Detalhes do Profissional</h1>
      </div>

      {/* User Info Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {getInitials(user.name || '')}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{user.name}</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/users/${userId}/employments`}>
                      <Briefcase className="mr-2 h-4 w-4" />
                      Vínculos
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/users/${userId}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {user.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                )}
                {user.cpf && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    {user.cpf}
                  </div>
                )}
                {user.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {user.phoneNumber}
                  </div>
                )}
                {user.position && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    {user.position}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
