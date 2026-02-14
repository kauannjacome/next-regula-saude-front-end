// ==========================================
// PÁGINA: CADASTRAR NOVO CIDAD?O
// ==========================================
// Esta é a tela onde o usuário cadastra um novo cidadão
// Mostra formulário vazio para preencher dados e salvar no banco
// Rota: /citizens/new
// 'use client' = página interativa que roda no navegador

'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';        // Navegação programática
import { PageHeader } from '@/components/shared';
import { CitizenForm } from '../components/citizen-form';  // Formulário compartilhado
import { type CitizenFormData } from '@/lib/validators';   // Tipo de dados do formulário
import { toast } from 'sonner';                     // Biblioteca para notificações

// COMPONENTE PRINCIPAL DA PÁGINA
export default function NewCitizenPage() {
  // HOOK: Navegação programática (redirecionar via código)
  // router.push('/citizens') = voltar para lista de cidadãos
  const router = useRouter()

  // ESTADO: Controla se está salvando dados (loading)
  // isLoading = true → mostra "Salvando..." e desabilita botão
  // isLoading = false → botão normal, pode clicar
  const [isLoading, setIsLoading] = useState(false)

  // FUNÇÃO: Chamada quando usuário clica em "Cadastrar Cidadão"
  // Recebe dados validados do formulário
  // FLUXO:
  // 1. Ativar loading
  // 2. Fazer requisição para API salvar no banco
  // 3. Mostrar mensagem de sucesso e voltar para lista
  // 4. Se erro: mostrar mensagem de erro
  const handleSubmit = async (data: CitizenFormData) => {
    setIsLoading(true)
    try {
      // Mapear dados do formulário para o formato da API (igual ao edit page)
      let sex: string = 'MALE'
      if (data.gender === 'F') sex = 'FEMALE'
      else if (data.gender === 'O') sex = 'OTHER'

      const apiBody = {
        name: data.name,
        cpf: data.cpf,
        birthDate: data.birthDate,
        gender: data.gender,
        sex,
        phone: data.phone,
        email: data.email || null,
        cns: data.cartaoSus || null, // Mapeamento correto: cartaoSus -> cns

        // Campos de identificação
        rg: data.rg || null,
        rgIssuer: data.rgIssuer || null,
        rgState: data.rgState || null,
        rgIssueDate: data.rgIssueDate || null,

        // Filiação
        motherName: data.motherName || null,
        fatherName: data.fatherName || null,

        // Outros campos
        socialName: data.socialName || null,
        race: data.race || null,
        nationality: data.nationality || null,
        placeOfBirth: data.placeOfBirth || null,
        maritalStatus: data.maritalStatus || null,
        bloodType: data.bloodType || null,

        // Endereço (A API aceita tanto aninhado quanto plano, mas vamos manter a estrutura)
        address: data.address, // O backend lida com address { cep, logradouro... }
      }

      const response = await fetch('/api/citizens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiBody),
      })
      if (!response.ok) throw new Error('Erro ao cadastrar cidadão')
      toast.success('Cidadão cadastrado com sucesso!')
      router.push('/citizens')
    } catch {
      toast.error('Erro ao cadastrar cidadão')
    } finally {
      setIsLoading(false)
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
        title="Novo Cidadão"
        description="Preencha os dados do cidadão para cadastrá-lo no sistema"
        backHref="/citizens"
      />

      {/* FORMULÁRIO: Campos de dados do cidadão */}
      {/* CitizenForm = componente compartilhado (usado também no editar) */}
      {/* onSubmit = função chamada ao enviar formulário */}
      {/* isLoading = se true, desabilita botão e mostra "Salvando..." */}
      {/* submitLabel = texto do botão de submit */}
      <CitizenForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Cadastrar Cidadão"
      />
    </div>
  )
}
