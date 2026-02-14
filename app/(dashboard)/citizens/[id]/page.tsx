// ==========================================
// PÁGINA: DETALHES DO CIDADAO
// ==========================================
// Esta é a tela onde o usuário visualiza todos os dados de um cidadão específico
// Mostra: Avatar + Info pessoal + Endereço + Histórico
// Permite: Editar e Excluir cidadão
// Rota: /citizens/[id] (ex: /citizens/123)
// [id] = parâmetro dinâmico (ID do cidadão)
// 'use client' = página interativa que roda no navegador

'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Trash, History, ArrowLeft, Phone, Mail, MapPin, Calendar, CreditCard, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { StatusBadge, ConfirmDialog, CardSkeleton } from '@/components/shared';
import { CitizenHistoryTab } from '../components/citizen-history-tab';         // Aba de histórico
import { formatDate, getInitials } from '@/lib/format';    // Funções helper de formatação
import { calculateCitizenQuality, getQualityColor } from '@/lib/constants';  // Qualidade do cadastro
import { toast } from 'sonner';
import Link from 'next/link'

// TIPO: Estrutura do cidadão retornado pela API
interface CitizenData {
  id: number
  name: string
  cpf: string
  birthDate: string
  phone: string | null
  email: string | null
  cns: string | null
  sex: string | null
  address: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  motherName: string | null        // Nome da mãe (obrigatório para PDF)
  nationality: string | null       // Nacionalidade (obrigatório para PDF)
  deletedAt: string | null
  regulations?: any[]
  schedules?: any[]
}

// FUNÇÃO: Calcular idade a partir da data de nascimento
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// FUNÇÃO: Mapear valor do sexo da API para texto legível
function mapSex(sex: string | null): string {
  switch (sex) {
    case 'MALE': return 'Masculino'
    case 'FEMALE': return 'Feminino'
    case 'OTHER': return 'Outro'
    case 'M': return 'Masculino'
    case 'F': return 'Feminino'
    case 'O': return 'Outro'
    default: return 'Não informado'
  }
}

// COMPONENTE PRINCIPAL DA PÁGINA
export default function CitizenDetailsPage() {
  // HOOK: Pegar parâmetros da URL
  // Ex: /citizens/123 → params.id = '123'
  const params = useParams()

  // HOOK: Navegação programática
  const router = useRouter()

  // ESTADO 1: Controla se está CARREGANDO dados (loading inicial)
  const [isLoading, setIsLoading] = useState(true)

  // ESTADO 2: Controla se diálogo de exclusão está aberto
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // ESTADO 3: Dados do cidadão carregados do banco
  const [citizen, setCitizen] = useState<CitizenData | null>(null)

  // ESTADO 4: Controla expansão dos campos faltantes na qualidade do cadastro
  const [showMissingFields, setShowMissingFields] = useState(false)

  // EFEITO: Executado automaticamente quando página carrega
  // [params.id] = executar novamente se ID mudar na URL
  useEffect(() => {
    // FUNÇÃO: Buscar dados do cidadão do banco via API
    const fetchCitizen = async () => {
      setIsLoading(true)  // Ativar loading
      try {
        const response = await fetch(`/api/citizens/${params.id}`)
        if (!response.ok) {
          throw new Error('Cidadão não encontrado')
        }
        const data = await response.json()
        setCitizen(data)
      } catch {
        // ERRO: Mostrar notificação vermelha
        toast.error('Erro ao carregar cidadão')
      } finally {
        // SEMPRE executado no final (erro ou sucesso)
        setIsLoading(false)  // Desativar loading
      }
    }

    fetchCitizen()  // Executar função
  }, [params.id])  // Dependência: re-executar se params.id mudar

  // FUNÇÃO: Excluir cidadão do banco
  // Chamada quando usuário confirma exclusão no diálogo
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/citizens/${params.id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Erro ao excluir cidadão')
      }

      // SUCESSO: Mostrar notificação verde e voltar para lista
      toast.success('Cidadão excluído com sucesso')
      router.push('/citizens')  // Redirecionar para /citizens
    } catch {
      // ERRO: Mostrar notificação vermelha
      toast.error('Erro ao excluir cidadão')
    }
    // Fechar diálogo (sempre executado)
    setDeleteDialogOpen(false)
  }

  // RENDERIZAÇÃO CONDICIONAL 1: Carregando dados
  // Se isLoading = true, mostrar skeletons (placeholders animados)
  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />  {/* Skeleton para card de info */}
        <CardSkeleton />  {/* Skeleton para card de abas */}
      </div>
    )
  }

  // RENDERIZAÇÃO CONDICIONAL 2: Cidadão não encontrado
  // Se após carregar, citizen = null (não existe no banco)
  if (!citizen) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Cidadão não encontrado</p>
        <Button asChild className="mt-4">
          <Link href="/citizens">Voltar para lista</Link>
        </Button>
      </div>
    )
  }

  // RENDERIZAÇÃO PRINCIPAL: Cidadão foi carregado com sucesso
  return (
    <div className="space-y-6">
      {/* ===== SEÇÃO 1: CABEÇALHO COM AVATAR E AÇÕES ===== */}
      <div>
        {/* Botão "Voltar" no topo */}
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/citizens">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>

        {/* Layout responsivo: coluna no mobile, linha no desktop */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

          {/* LADO ESQUERDO: Avatar + Nome + CPF + Status */}
          <div className="flex items-center gap-4">
            {/* Avatar circular grande (80x80px) */}
            <Avatar className="h-20 w-20">
              <AvatarImage src="" />  {/* Tentar carregar imagem (vazia aqui) */}
              {/* Fallback: Iniciais do nome se não tiver foto */}
              <AvatarFallback className="bg-primary text-white text-2xl">
                {getInitials(citizen.name)}  {/* Ex: "João Silva" → "JS" */}
              </AvatarFallback>
            </Avatar>

            {/* Nome + CPF + Badge de status */}
            <div>
              <h1 className="text-3xl font-bold">{citizen.name}</h1>
              <p className="text-muted-foreground">CPF: {citizen.cpf}</p>
              {/* Badge colorido (verde=Ativo, vermelho=Inativo, etc) */}
              <StatusBadge status={citizen.deletedAt ? 'Inativo' : 'Ativo'} className="mt-2" />
            </div>
          </div>

          {/* LADO DIREITO: Botões de ação (Editar e Excluir) */}
          <div className="flex gap-2">
            {/* Botão Editar (bordado) */}
            <Button variant="outline" asChild>
              <Link href={`/citizens/${citizen.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>

            {/* Botão Excluir (vermelho/destrutivo) */}
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>
      </div>

      {/* ===== SEÇÃO 2: QUALIDADE DO CADASTRO (PARA PDFs) ===== */}
      {(() => {
        const quality = calculateCitizenQuality(citizen)
        const colors = getQualityColor(quality.percentage)
        return (
          <Card className={`${colors.bg} ${colors.border} border`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {quality.percentage >= 80 ? (
                    <CheckCircle2 className={`h-5 w-5 ${colors.text}`} />
                  ) : (
                    <AlertCircle className={`h-5 w-5 ${colors.text}`} />
                  )}
                  <span className={`font-medium ${colors.text}`}>
                    Qualidade do Cadastro para PDFs
                  </span>
                </div>
                <span className={`text-lg font-bold ${colors.text}`}>
                  {quality.percentage}%
                </span>
              </div>

              {/* Barra de progresso */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`${colors.progressBg} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${quality.percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className={colors.text}>
                  {quality.filled} de {quality.total} campos preenchidos
                </span>

                {quality.missingFields.length > 0 && (
                  <button
                    onClick={() => setShowMissingFields(!showMissingFields)}
                    className={`flex items-center gap-1 ${colors.text} hover:underline`}
                  >
                    {showMissingFields ? 'Ocultar' : 'Ver campos faltantes'}
                    {showMissingFields ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Lista de campos faltantes (expansível) */}
              {showMissingFields && quality.missingFields.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className={`text-sm font-medium ${colors.text} mb-2`}>
                    Campos obrigatórios não preenchidos:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quality.missingFields.map(({ field, label }) => (
                      <span
                        key={field}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-white/50 text-sm"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="mt-3"
                  >
                    <Link href={`/citizens/${citizen.id}/edit`}>
                      <Edit className="mr-2 h-3 w-3" />
                      Completar cadastro
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })()}

      {/* ===== SEÇÃO 3: CARD COM INFORMAÇÕES PESSOAIS ===== */}
      <Card>
        <CardContent className="pt-6">
          {/* Grid responsivo: 1 col (mobile) → 2 cols (tablet) → 3 cols (desktop) */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {/* CAMPO 1: Data de Nascimento + Idade */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                {/* formatDate() = formatar de '1985-03-15' para '15/03/1985' */}
                <p className="font-medium">{formatDate(citizen.birthDate)} ({calculateAge(citizen.birthDate)} anos)</p>
              </div>
            </div>

            {/* CAMPO 2: Sexo */}
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Sexo</p>
                <p className="font-medium">{mapSex(citizen.sex)}</p>
              </div>
            </div>

            {/* CAMPO 3: Telefone */}
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{citizen.phone}</p>
              </div>
            </div>

            {/* CAMPO 4: Email */}
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                {/* || '-' = se não tiver email, mostrar traço */}
                <p className="font-medium">{citizen.email || '-'}</p>
              </div>
            </div>

            {/* CAMPO 5: Cartão SUS */}
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Cartão SUS</p>
                <p className="font-medium">{citizen.cns || '-'}</p>
              </div>
            </div>

            {/* CAMPO 6: Endereço completo */}
            {/* md:col-span-2 lg:col-span-1 = ocupa 2 colunas no tablet, 1 no desktop */}
            <div className="flex items-start gap-3 md:col-span-2 lg:col-span-1">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Endereço</p>
                <p className="font-medium">
                  {/* Linha 1: Rua, número e complemento (se tiver) */}
                  {citizen.address || '-'}{citizen.number ? `, ${citizen.number}` : ''}
                  {citizen.complement && ` - ${citizen.complement}`}
                  <br />
                  {/* Linha 2: Bairro, cidade e estado */}
                  {citizen.neighborhood || ''}{citizen.city ? `, ${citizen.city}` : ''}{citizen.state ? ` - ${citizen.state}` : ''}
                  <br />
                  {/* Linha 3: CEP */}
                  CEP: {citizen.postalCode || '-'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== SEÇÃO 3: HISTÓRICO DO CIDADÃO ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CitizenHistoryTab
            citizenId={String(citizen.id)}
            initialData={{
              regulations: citizen.regulations,
              schedules: citizen.schedules,
            }}
          />
        </CardContent>
      </Card>

      {/* ===== DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO ===== */}
      {/* Modal que aparece quando usuário clica em "Excluir" */}
      {/* Previne exclusões acidentais pedindo confirmação */}
      <ConfirmDialog
        open={deleteDialogOpen}              // Controla se está visível
        onOpenChange={setDeleteDialogOpen}   // Função para abrir/fechar
        title="Excluir Cidadão"             // Título do diálogo
        description="Tem certeza que deseja excluir este cidadão? Esta ação não pode ser desfeita e todos os dados serão perdidos."
        confirmLabel="Excluir"               // Texto do botão de confirmar
        onConfirm={handleDelete}             // Função executada ao confirmar
        variant="destructive"                // Botão vermelho (ação perigosa)
      />
    </div>
  )
}
