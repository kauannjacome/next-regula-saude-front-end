// ==========================================
// PÁGINA: EDITAR PLANO DE CUIDADO
// ==========================================
// Esta é a tela onde o usuário edita dados de um plano de cuidado existente
// Mostra formulário preenchido com dados atuais e permite salvar alterações
// Rota: /care/[id]/edit (ex: /care/123/edit)
// [id] = parâmetro dinâmico (ID do cuidado)
// 'use client' = página interativa que roda no navegador

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PageHeader, FormSkeleton } from '@/components/shared'
import { CareForm, type CareFormData } from '../../components/care-form'
import { toast } from 'sonner'
import apiClient from '@/lib/api/api-client'

// COMPONENTE PRINCIPAL DA PÁGINA
export default function EditCarePage() {
  // HOOK: Navegação programática (redirecionar via código)
  const router = useRouter()

  // HOOK: Pegar parâmetros da URL
  // Ex: /care/123/edit → params.id = '123'
  const params = useParams()

  // ESTADO 1: Controla se está SALVANDO alterações (loading do submit)
  const [isLoading, setIsLoading] = useState(false)

  // ESTADO 2: Controla se está CARREGANDO dados do cuidado (loading inicial)
  // isFetching = true → mostrar skeleton (placeholder animado)
  // isFetching = false → mostrar formulário com dados
  const [isFetching, setIsFetching] = useState(true)

  // ESTADO 3: Dados do cuidado carregados do banco
  // null = ainda não carregou ou não encontrou
  // CareFormData = dados carregados com sucesso
  const [care, setCare] = useState<CareFormData | null>(null)

  // EFEITO: Executado automaticamente quando página carrega
  // [params.id] = executar novamente se ID mudar na URL
  useEffect(() => {
    // FUNÇÃO: Buscar dados do cuidado do banco via API
    const fetchCare = async () => {
      setIsFetching(true)  // Ativar loading
      try {
        // REQUISIÇÃO: Buscar dados do cuidado da API
        const response = await apiClient.get(`/care/${params.id}`)

        // MAPEAR: Status do banco (ACTIVE/INACTIVE) para frontend (Ativo/Inativo)
        const careData = {
          ...response.data,
          status: response.data.status === 'ACTIVE' ? 'Ativo' : 'Inativo',
          duration: response.data.duration?.toString() || ''
        }

        setCare(careData)
      } catch (error) {
        // ERRO: Mostrar notificação vermelha
        console.error('Error fetching care:', error)
        toast.error('Erro ao carregar dados do cuidado')
      } finally {
        // SEMPRE executado no final (erro ou sucesso)
        setIsFetching(false)  // Desativar loading
      }
    }

    fetchCare()  // Executar função
  }, [params.id])  // Dependência: re-executar se params.id mudar

  // FUNÇÃO: Chamada quando usuário clica em "Atualizar Cuidado"
  // Recebe dados alterados do formulário
  // FLUXO:
  // 1. Ativar loading
  // 2. Fazer requisição PUT para API atualizar no banco
  // 3. Mostrar mensagem de sucesso e voltar para lista
  // 4. Se erro: mostrar mensagem de erro
  const handleSubmit = async (data: CareFormData) => {
    setIsLoading(true)  // Ativar loading
    try {
      // REQUISIÇÃO: Enviar dados atualizados para API
      await apiClient.put(`/care/${params.id}`, data)

      // SUCESSO: Mostrar notificação verde e voltar para lista
      toast.success('Plano de cuidado atualizado com sucesso!')
      router.push('/care')  // Redirecionar para /care
    } catch (error) {
      // ERRO: Mostrar notificação vermelha
      console.error('Error updating care:', error)
      toast.error('Erro ao atualizar plano de cuidado')
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
      <PageHeader
        title="Editar Plano de Cuidado"
        description="Atualize os dados do plano de cuidado"
        backHref="/care"
      />

      {/* RENDERIZAÇÃO CONDICIONAL: 3 possíveis estados */}

      {/* ESTADO 1: Carregando dados (isFetching = true) */}
      {/* Mostra skeleton (placeholder animado) */}
      {isFetching ? (
        <FormSkeleton />

      /* ESTADO 2: Dados carregados com sucesso (care existe) */
      ) : care ? (
        // FORMULÁRIO: Campos preenchidos com dados atuais
        // defaultValues = valores iniciais do formulário
        <CareForm
          defaultValues={care}          // Preencher campos com dados atuais
          onSubmit={handleSubmit}       // Função ao clicar em "Atualizar"
          isLoading={isLoading}         // Se true, desabilita botão
          submitLabel="Atualizar Cuidado"  // Texto do botão
        />

      /* ESTADO 3: Erro ao carregar (care = null após fetch) */
      ) : (
        // Mensagem de erro simples
        <p className="text-muted-foreground">Plano de cuidado não encontrado</p>
      )}
    </div>
  )
}
