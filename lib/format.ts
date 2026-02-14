// =============================================================================
// Arquivo: format.ts
// Descrição: Funções utilitárias para formatação e limpeza de dados comuns
//            no Brasil, como CPF, CNPJ, CEP, telefone, datas, moeda, etc.
// =============================================================================

import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// -----------------------------------------------------------------------------
// formatCPF - Formata um CPF (Cadastro de Pessoa Física) com pontos e traço.
//
// Entrada: uma string com os dígitos do CPF (pode conter caracteres não numéricos).
// Saída:   uma string formatada no padrão "XXX.XXX.XXX-XX".
//
// Exemplo: formatCPF('12345678900') => '123.456.789-00'
//          formatCPF('123.456.789-00') => '123.456.789-00' (já formatado)
// -----------------------------------------------------------------------------
export function formatCPF(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  return cleaned
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14)
}

// -----------------------------------------------------------------------------
// formatCNPJ - Formata um CNPJ (Cadastro Nacional da Pessoa Jurídica).
//
// Entrada: uma string com os dígitos do CNPJ (pode conter caracteres não numéricos).
// Saída:   uma string formatada no padrão "XX.XXX.XXX/XXXX-XX".
//
// Exemplo: formatCNPJ('12345678000195') => '12.345.678/0001-95'
// -----------------------------------------------------------------------------
export function formatCNPJ(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  return cleaned
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    .slice(0, 18)
}

// -----------------------------------------------------------------------------
// formatCEP - Formata um CEP (Código de Endereçamento Postal) com traço.
//
// Entrada: uma string com os dígitos do CEP (pode conter caracteres não numéricos).
// Saída:   uma string formatada no padrão "XXXXX-XXX".
//
// Exemplo: formatCEP('01001000') => '01001-000'
// -----------------------------------------------------------------------------
export function formatCEP(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  return cleaned.replace(/(\d{5})(\d{1,3})$/, '$1-$2').slice(0, 9)
}

// -----------------------------------------------------------------------------
// formatPhone - Formata um número de telefone brasileiro (fixo ou celular).
//
// Entrada: uma string com os dígitos do telefone (pode conter caracteres não numéricos).
// Saída:   - Telefone fixo (10 dígitos): "(XX) XXXX-XXXX"
//          - Celular (11 dígitos):        "(XX) XXXXX-XXXX"
//
// Exemplo: formatPhone('1133334444')  => '(11) 3333-4444'  (fixo)
//          formatPhone('11999887766') => '(11) 99988-7766' (celular)
// -----------------------------------------------------------------------------
export function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length <= 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim()
  }
  return cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').slice(0, 15)
}

// -----------------------------------------------------------------------------
// formatDate - Formata uma data para o padrão brasileiro usando a biblioteca
//              date-fns com o locale pt-BR.
//
// Entrada: "date" pode ser uma string ISO (ex: '2024-03-15') ou um objeto Date.
//          "formatStr" é opcional e define o formato de saída (padrão: 'dd/MM/yyyy').
// Saída:   uma string com a data formatada, ou string vazia ('') se a data for inválida.
//
// Exemplo: formatDate('2024-03-15')              => '15/03/2024'
//          formatDate('2024-03-15', 'MM/yyyy')   => '03/2024'
//          formatDate(new Date(2024, 2, 15))      => '15/03/2024'
//          formatDate('')                          => ''
// -----------------------------------------------------------------------------
export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy'): string {
  if (!date) return ''
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(parsedDate)) return ''
    return format(parsedDate, formatStr, { locale: ptBR })
  } catch {
    return ''
  }
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "dd/MM/yyyy 'às' HH:mm")
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

export function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}

export function cleanCEP(cep: string): string {
  return cep.replace(/\D/g, '')
}

export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function formatRG(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  return cleaned
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1})$/, '$1-$2')
    .slice(0, 12)
}

export function formatCNS(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  return cleaned
    .replace(/(\d{3})(\d)/, '$1 $2')
    .replace(/(\d{4})(\d)/, '$1 $2')
    .replace(/(\d{4})(\d)/, '$1 $2')
    .slice(0, 18)
}
