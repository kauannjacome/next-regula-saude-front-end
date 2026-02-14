// ==========================================
// FUNÇÕES UTILITÁRIAS PARA TEMPLATES
// ==========================================
// Este arquivo contém funções auxiliares usadas pelos templates
// Inclui formatação de dados, máscaras e cálculos

/**
 * formatCPF - Formata CPF com máscara
 * @param cpf - CPF sem formatação
 * @param masked - Se true, oculta parte do CPF (333.***.***-**)
 * @returns CPF formatado
 *
 * Exemplo:
 * formatCPF('12345678901', false) => '123.456.789-01'
 * formatCPF('12345678901', true)  => '123.***.***-01'
 */
export function formatCPF(cpf: string | null | undefined, masked = false): string {
  if (!cpf) return '-'

  // Remove caracteres não numéricos
  const numbers = cpf.replace(/\D/g, '')

  if (numbers.length !== 11) return cpf

  if (masked) {
    // Formato mascarado: 123.***.***-** (mostra apenas os 3 primeiros dígitos)
    return `${numbers.slice(0, 3)}.***.***-**`
  }

  // Formato completo: 123.456.789-01
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
}

/**
 * formatCNS - Formata Cartão Nacional de Saúde
 * @param cns - CNS sem formatação
 * @returns CNS formatado (000 0000 0000 0000)
 */
export function formatCNS(cns: string | null | undefined): string {
  if (!cns) return '-'

  const numbers = cns.replace(/\D/g, '')

  if (numbers.length !== 15) return cns

  return `${numbers.slice(0, 3)} ${numbers.slice(3, 7)} ${numbers.slice(7, 11)} ${numbers.slice(11, 15)}`
}

/**
 * formatPhone - Formata telefone
 * @param phone - Telefone sem formatação
 * @returns Telefone formatado ((00) 00000-0000)
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-'

  const numbers = phone.replace(/\D/g, '')

  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
  }

  return phone
}

/**
 * formatDate - Formata data para exibição
 * @param date - Data a ser formatada
 * @param format - Formato desejado ('short' = 01/01/2024, 'long' = 01 de Janeiro de 2024)
 * @returns Data formatada
 */
export function formatDate(
  date: Date | string | null | undefined,
  format: 'short' | 'long' = 'short'
): string {
  if (!date) return '-'

  const d = new Date(date)

  if (isNaN(d.getTime())) return '-'

  if (format === 'long') {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]

    const day = d.getDate().toString().padStart(2, '0')
    const month = months[d.getMonth()]
    const year = d.getFullYear()

    return `${day} de ${month} de ${year}`
  }

  // Formato curto: DD/MM/YYYY
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()

  return `${day}/${month}/${year}`
}

/**
 * formatDateTime - Formata data e hora
 * @param date - Data a ser formatada
 * @returns Data e hora formatada (01/01/2024 às 14:30:45)
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-'

  const d = new Date(date)

  if (isNaN(d.getTime())) return '-'

  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const seconds = d.getSeconds().toString().padStart(2, '0')

  return `${day}/${month}/${year} às ${hours}:${minutes}:${seconds}`
}

/**
 * formatTime - Formata apenas hora
 * @param date - Data a ser formatada
 * @returns Hora formatada (14:30:45)
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '-'

  const d = new Date(date)

  if (isNaN(d.getTime())) return '-'

  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const seconds = d.getSeconds().toString().padStart(2, '0')

  return `${hours}:${minutes}:${seconds}`
}

/**
 * calculateAge - Calcula idade a partir da data de nascimento
 * @param birthDate - Data de nascimento
 * @returns Idade em anos
 */
export function calculateAge(birthDate: Date | string | null | undefined): number {
  if (!birthDate) return 0

  const birth = new Date(birthDate)
  const today = new Date()

  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

/**
 * formatAddress - Formata endereço completo
 * @param data - Dados do endereço
 * @returns Endereço formatado em uma linha
 */
export function formatAddress(data: {
  address?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
}): string {
  const parts: string[] = []

  if (data.address) {
    let addr = data.address
    if (data.number) addr += `, ${data.number}`
    if (data.complement) addr += ` - ${data.complement}`
    parts.push(addr)
  }

  if (data.neighborhood) parts.push(data.neighborhood)

  if (data.city) {
    let cityState = data.city
    if (data.state) cityState += `/${data.state}`
    parts.push(cityState)
  }

  if (data.postalCode) {
    const cep = data.postalCode.replace(/\D/g, '')
    if (cep.length === 8) {
      parts.push(`CEP: ${cep.slice(0, 5)}-${cep.slice(5, 8)}`)
    }
  }

  return parts.length > 0 ? parts.join(' - ') : '-'
}

/**
 * formatCurrency - Formata valor em reais
 * @param value - Valor numérico
 * @returns Valor formatado (R$ 1.234,56)
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

/**
 * truncateText - Trunca texto longo com reticências
 * @param text - Texto a ser truncado
 * @param maxLength - Tamanho máximo
 * @returns Texto truncado
 */
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return '-'

  if (text.length <= maxLength) return text

  return text.slice(0, maxLength - 3) + '...'
}

/**
 * getStatusColor - Retorna cor do status
 * @param status - Status da regulação
 * @returns Cor em hexadecimal
 */
export function getStatusColor(status: string | null | undefined): string {
  const colors: Record<string, string> = {
    'IN_PROGRESS': '#FFA500',  // Laranja - Em andamento
    'SCHEDULED': '#3B82F6',    // Azul - Agendado
    'APPROVED': '#22C55E',     // Verde - Aprovado
    'DENIED': '#EF4444',       // Vermelho - Negado
    'RETURNED': '#8B5CF6',     // Roxo - Devolvido
  }

  return colors[status || ''] || '#6B7280'
}

/**
 * getStatusLabel - Retorna label do status em português
 * @param status - Status da regulação
 * @returns Label traduzido
 */
export function getStatusLabel(status: string | null | undefined): string {
  const labels: Record<string, string> = {
    'IN_PROGRESS': 'Em Andamento',
    'SCHEDULED': 'Agendado',
    'APPROVED': 'Aprovado',
    'DENIED': 'Negado',
    'RETURNED': 'Devolvido',
  }

  return labels[status || ''] || status || '-'
}

/**
 * getPriorityLabel - Retorna label da prioridade em português
 * @param priority - Prioridade
 * @returns Label traduzido
 */
export function getPriorityLabel(priority: string | null | undefined): string {
  const labels: Record<string, string> = {
    'EMERGENCY': 'Emergência',
    'URGENCY': 'Urgência',
    'ELECTIVE': 'Eletiva',
  }

  return labels[priority || ''] || priority || '-'
}

/**
 * getUnitMeasureLabel - Retorna label da unidade de medida em português
 * @param unitMeasure - Unidade de medida
 * @returns Label traduzido
 */
export function getUnitMeasureLabel(unitMeasure: string | null | undefined): string {
  const labels: Record<string, string> = {
    'UN': 'Un.',
    'SESSION': 'Sessão',
    'HOUR': 'Hora',
    'DAY': 'Dia',
    'WEEK': 'Semana',
    'MONTH': 'Mês',
    'KG': 'Kg',
    'ML': 'mL',
    'MG': 'mg',
    'DOSE': 'Dose',
    'PACKAGE': 'Pacote',
    'BOX': 'Caixa',
    'UNIT': 'Un.',
  }

  return labels[unitMeasure || ''] || unitMeasure || '-'
}

/**
 * generateProtocolCode - Gera código de protocolo formatado
 * @param protocolNumber - Número do protocolo
 * @param prefix - Prefixo (ex: 'PROT')
 * @param year - Ano
 * @returns Código formatado (PROT-2024-000001)
 */
export function generateProtocolCode(
  protocolNumber: string | null | undefined,
  prefix = 'PROT',
  year?: number
): string {
  // Se já está formatado (contém "-"), retornar como está
  if (protocolNumber && protocolNumber.includes('-')) {
    return protocolNumber
  }

  // Validar se é um número válido (para compatibilidade com dados antigos)
  if (protocolNumber === null || protocolNumber === undefined || isNaN(Number(protocolNumber))) {
    return 'Aguardando'
  }

  const y = year || new Date().getFullYear()
  const num = Number(protocolNumber).toString().padStart(6, '0')

  return `${prefix}-${y}-${num}`
}

/**
 * getAllStatuses - Retorna todos os status disponíveis
 * @returns Array com status e suas cores
 */
export function getAllStatuses(): Array<{ value: string; label: string; color: string }> {
  return [
    { value: 'IN_PROGRESS', label: 'Em Andamento', color: '#FFA500' },
    { value: 'SCHEDULED', label: 'Agendado', color: '#3B82F6' },
    { value: 'APPROVED', label: 'Aprovado', color: '#22C55E' },
    { value: 'DENIED', label: 'Negado', color: '#EF4444' },
    { value: 'RETURNED', label: 'Devolvido', color: '#8B5CF6' },
  ]
}
