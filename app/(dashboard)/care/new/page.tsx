// ==========================================
// PÁGINA: CADASTRAR NOVO PLANO DE CUIDADO
// ==========================================
// Esta é a tela onde o usuário cadastra um novo plano de cuidado
// Mostra formulário vazio para preencher dados e salvar no banco
// Campos: Nome, Tipo, Descrição, Protocolo, Duração, Status
// Rota: /care/new
// 'use client' = página interativa que roda no navegador

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'        // Navegação programática
import { PageHeader } from '@/components/shared'
import { CareForm, type CareFormData } from '../components/care-form'  // Formulário compartilhado
import { toast } from 'sonner'                     // Biblioteca para notificações
import apiClient from '@/lib/api/api-client'           // Cliente HTTP para requisições

// COMPONENTE PRINCIPAL DA PÁGINA
export default function NewCarePage() {
  // HOOK: Navegação programática (redirecionar via código)
  // router.push('/care') = voltar para lista de cuidados
  const router = useRouter()

  // ESTADO: Controla se está salvando dados (loading)
  // isLoading = true → mostra "Salvando..." e desabilita botão
  // isLoading = false → botão normal, pode clicar
  const [isLoading, setIsLoading] = useState(false)

  // FUNÇÃO: Chamada quando usuário clica em "Cadastrar Cuidado"
  // Recebe dados validados do formulário
  // FLUXO:
  // 1. Ativar loading
  // 2. Fazer requisição para API salvar no banco
  // 3. Mostrar mensagem de sucesso e voltar para lista
  // 4. Se erro: mostrar mensagem de erro
  const handleSubmit = async (data: CareFormData) => {
    setIsLoading(true)  // Ativar loading
    try {
      // REQUISIÇÃO: Enviar dados para API criar cuidado
      await apiClient.post('/care', data)

      // SUCESSO: Mostrar notificação verde e voltar para lista
      toast.success('Plano de cuidado cadastrado com sucesso!')
      router.push('/care')  // Redirecionar para /care
    } catch (error) {
      // ERRO: Mostrar notificação vermelha
      console.error('Error creating care:', error)
      toast.error('Erro ao cadastrar plano de cuidado')
    } finally {
      // SEMPRE executado no final (erro ou sucesso)
      setIsLoading(false)  // Desativar loading
    }
  }

  // RENDERIZAÇÃO: O que é mostrado na tela
  return (
    // Container centralizado com largura máxima
    // max-w-4xl = largura máxima de 896px
    // mx-auto = centralizar horizontalmente
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* CABEÇALHO: Título + Descrição + Botão Voltar */}
      {/* backHref = link para voltar (seta <-) */}
      <PageHeader
        title="Novo Plano de Cuidado"
        description="Cadastre um novo plano de cuidado no sistema"
        backHref="/care"
      />

      {/* FORMULÁRIO: Campos de dados do cuidado */}
      {/* CareForm = componente compartilhado (usado também no editar) */}
      {/* onSubmit = função chamada ao enviar formulário */}
      {/* isLoading = se true, desabilita botão e mostra "Salvando..." */}
      {/* submitLabel = texto do botão de submit */}
      <CareForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Cadastrar Cuidado"
      />
    </div>
  )
}
