// ==========================================
// PÁGINA: EDITAR CIDAD?O
// ==========================================
// Esta é a tela onde o usuário edita dados de um cidadão existente
// Mostra formulário preenchido com dados atuais e permite salvar alterações
// Rota: /citizens/[id]/edit (ex: /citizens/123/edit)
// [id] = parâmetro dinâmico (ID do cidadão)
// 'use client' = página interativa que roda no navegador

'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader, FormSkeleton } from '@/components/shared';
import { CitizenForm } from '../../components/citizen-form';
import { type CitizenFormData } from '@/lib/validators';
import { toast } from 'sonner';

// FUNÇÃO: Mapear dados da API para o formato do formulário (CitizenFormData)
function mapApiToFormData(apiData: any): CitizenFormData {
  // Converter sexo da API (ex: MALE/FEMALE/OTHER ou M/F/O) para o formato do form (M/F/O)
  let gender: 'M' | 'F' | 'O' = 'M'
  const sex = apiData.sex
  if (sex === 'FEMALE' || sex === 'F') {
    gender = 'F'
  } else if (sex === 'OTHER' || sex === 'O') {
    gender = 'O'
  }

  // Formatar data de nascimento para YYYY-MM-DD (formato do input date)
  const birthDate = apiData.birthDate
    ? new Date(apiData.birthDate).toISOString().split('T')[0]
    : ''

  return {
    name: apiData.name || '',
    cpf: apiData.cpf || '',
    birthDate,
    gender,
    phone: apiData.phone || '',
    email: apiData.email || '',
    cartaoSus: apiData.cns || '',

    // Campos de identificação
    rg: apiData.rg || '',
    rgIssuer: apiData.rgIssuer || '',
    rgState: apiData.rgState || '',
    rgIssueDate: apiData.rgIssueDate || '',

    // Filiação (motherName é obrigatório)
    motherName: apiData.motherName || '',
    fatherName: apiData.fatherName || '',

    // Outros campos opcionais
    socialName: apiData.socialName || '',
    race: apiData.race || '',
    nationality: apiData.nationality || '',
    placeOfBirth: apiData.placeOfBirth || '',
    maritalStatus: apiData.maritalStatus || '',
    bloodType: apiData.bloodType || '',
    sex: apiData.sex || '',

    address: {
      cep: apiData.postalCode || '',
      logradouro: apiData.address || '',
      numero: apiData.number || '',
      complemento: apiData.complement || '',
      bairro: apiData.neighborhood || '',
      cidade: apiData.city || '',
      estado: apiData.state || '',
    },
  }
}

// FUNÇÃO: Mapear dados do formulário para o formato da API (PUT body)
function mapFormDataToApi(formData: CitizenFormData) {
  let sex: string = 'MALE'
  if (formData.gender === 'F') sex = 'FEMALE'
  else if (formData.gender === 'O') sex = 'OTHER'

  return {
    name: formData.name,
    cpf: formData.cpf,
    birthDate: formData.birthDate,
    sex,
    phone: formData.phone,
    email: formData.email || null,
    cns: formData.cartaoSus || null,

    // Campos de identificação
    rg: formData.rg || null,
    rgIssuer: formData.rgIssuer || null,
    rgState: formData.rgState || null,
    rgIssueDate: formData.rgIssueDate || null,

    // Filiação
    motherName: formData.motherName || null,
    fatherName: formData.fatherName || null,

    // Outros campos
    socialName: formData.socialName || null,
    race: formData.race || null,
    nationality: formData.nationality || null,
    placeOfBirth: formData.placeOfBirth || null,
    maritalStatus: formData.maritalStatus || null,
    bloodType: formData.bloodType || null,

    // Endereço
    postalCode: formData.address.cep,
    address: formData.address.logradouro,
    number: formData.address.numero,
    complement: formData.address.complemento || null,
    neighborhood: formData.address.bairro,
    city: formData.address.cidade,
    state: formData.address.estado,
  }
}

// COMPONENTE PRINCIPAL DA PÁGINA
export default function EditCitizenPage() {
  // HOOK: Navegação programática (redirecionar via código)
  const router = useRouter()

  // HOOK: Pegar parâmetros da URL
  // Ex: /citizens/123/edit → params.id = '123'
  const params = useParams()

  // ESTADO 1: Controla se está SALVANDO alterações (loading do submit)
  const [isLoading, setIsLoading] = useState(false)

  // ESTADO 2: Controla se está CARREGANDO dados do cidadão (loading inicial)
  // isFetching = true → mostrar skeleton (placeholder animado)
  // isFetching = false → mostrar formulário com dados
  const [isFetching, setIsFetching] = useState(true)

  // ESTADO 3: Dados do cidadão carregados do banco
  // null = ainda não carregou ou não encontrou
  // CitizenFormData = dados carregados com sucesso
  const [citizen, setCitizen] = useState<CitizenFormData | null>(null)

  // EFEITO: Executado automaticamente quando página carrega
  // [params.id] = executar novamente se ID mudar na URL
  useEffect(() => {
    // FUNÇÃO: Buscar dados do cidadão do banco via API
    const fetchCitizen = async () => {
      setIsFetching(true)  // Ativar loading
      try {
        const response = await fetch(`/api/citizens/${params.id}`)
        if (!response.ok) {
          throw new Error('Cidadão não encontrado')
        }
        const data = await response.json()
        setCitizen(mapApiToFormData(data))
      } catch {
        // ERRO: Mostrar notificação vermelha
        toast.error('Erro ao carregar dados do cidadão')
      } finally {
        // SEMPRE executado no final (erro ou sucesso)
        setIsFetching(false)  // Desativar loading
      }
    }

    fetchCitizen()  // Executar função
  }, [params.id])  // Dependência: re-executar se params.id mudar

  // FUNÇÃO: Chamada quando usuário clica em "Atualizar Cidadão"
  // Recebe dados alterados do formulário
  // FLUXO:
  // 1. Ativar loading
  // 2. Fazer requisição PUT para API atualizar no banco
  // 3. Mostrar mensagem de sucesso e ir para página de detalhes
  // 4. Se erro: mostrar mensagem de erro
  const handleSubmit = async (data: CitizenFormData) => {
    setIsLoading(true)  // Ativar loading
    try {
      const apiBody = mapFormDataToApi(data)
      const response = await fetch(`/api/citizens/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiBody),
      })
      if (!response.ok) {
        throw new Error('Erro ao atualizar cidadão')
      }

      // SUCESSO: Mostrar notificação verde e ir para página de detalhes
      toast.success('Cidadão atualizado com sucesso!')
      router.push(`/citizens/${params.id}`)  // Redirecionar para /citizens/123
    } catch {
      // ERRO: Mostrar notificação vermelha
      toast.error('Erro ao atualizar cidadão')
    } finally {
      // SEMPRE executado no final (erro ou sucesso)
      setIsLoading(false)  // Desativar loading
    }
  }

  // RENDERIZAÇÃO: O que é mostrado na tela
  return (
    // Container centralizado com largura máxima
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* CABEÇALHO: Título + Descrição + Botão Voltar */}
      {/* backHref = link dinâmico para página de detalhes do cidadão */}
      <PageHeader
        title="Editar Cidadão"
        description="Atualize os dados do cidadão"
        backHref={`/citizens/${params.id}`}
      />

      {/* RENDERIZAÇÃO CONDICIONAL: 3 possíveis estados */}

      {/* ESTADO 1: Carregando dados (isFetching = true) */}
      {/* Mostra skeleton (placeholder animado) */}
      {isFetching ? (
        <FormSkeleton />

        /* ESTADO 2: Dados carregados com sucesso (citizen existe) */
      ) : citizen ? (
        // FORMULÁRIO: Campos preenchidos com dados atuais
        // defaultValues = valores iniciais do formulário
        <CitizenForm
          defaultValues={citizen}      // Preencher campos com dados atuais
          onSubmit={handleSubmit}      // Função ao clicar em "Atualizar"
          isLoading={isLoading}         // Se true, desabilita botão
          submitLabel="Atualizar Cidadão"  // Texto do botão
        />

        /* ESTADO 3: Erro ao carregar (citizen = null após fetch) */
      ) : (
        // Mensagem de erro simples
        <p className="text-muted-foreground">Cidadão não encontrado</p>
      )}
    </div>
  )
}
