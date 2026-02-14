/**
 * Helpers centralizados para uso em toda a aplicação
 */

// ==========================================
// STRING HELPERS
// ==========================================

/**
 * Normaliza uma string removendo acentos e convertendo para minúsculas
 * Útil para buscas case-insensitive
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Trunca uma string para um tamanho máximo, adicionando reticências
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/**
 * Converte string para Title Case (primeira letra de cada palavra maiúscula)
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Converte string para slug (URL-friendly)
 */
export function slugify(str: string): string {
  return normalizeString(str)
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Remove caracteres não numéricos de uma string
 */
export function onlyNumbers(str: string): string {
  return str.replace(/\D/g, '')
}

/**
 * Formata CPF: 123.456.789-00
 */
export function formatCPF(cpf: string): string {
  const digits = onlyNumbers(cpf)
  if (digits.length !== 11) return cpf
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Formata CNPJ: 12.345.678/0001-00
 */
export function formatCNPJ(cnpj: string): string {
  const digits = onlyNumbers(cnpj)
  if (digits.length !== 14) return cnpj
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

/**
 * Formata telefone: (11) 99999-9999 ou (11) 9999-9999
 */
export function formatPhone(phone: string): string {
  const digits = onlyNumbers(phone)
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

/**
 * Formata CEP: 12345-678
 */
export function formatCEP(cep: string): string {
  const digits = onlyNumbers(cep)
  if (digits.length !== 8) return cep
  return digits.replace(/(\d{5})(\d{3})/, '$1-$2')
}

// ==========================================
// DATE HELPERS
// ==========================================

/**
 * Calcula idade a partir de uma data de nascimento
 */
export function calculateAge(birthDate: Date | string): number {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

/**
 * Retorna o início do dia (00:00:00.000)
 */
export function startOfDay(date: Date | string = new Date()): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Retorna o fim do dia (23:59:59.999)
 */
export function endOfDay(date: Date | string = new Date()): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * Adiciona dias a uma data
 */
export function addDays(date: Date | string, days: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/**
 * Adiciona meses a uma data
 */
export function addMonths(date: Date | string, months: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

/**
 * Verifica se uma data está no passado
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return d < new Date()
}

/**
 * Verifica se uma data está no futuro
 */
export function isFuture(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return d > new Date()
}

/**
 * Formata data no padrão brasileiro: DD/MM/YYYY
 */
export function formatDateBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR')
}

/**
 * Formata data e hora no padrão brasileiro: DD/MM/YYYY HH:MM
 */
export function formatDateTimeBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ==========================================
// ARRAY HELPERS
// ==========================================

/**
 * Agrupa array por uma chave
 */
export function groupBy<T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = typeof key === 'function' ? key(item) : String(item[key])
      if (!result[groupKey]) {
        result[groupKey] = []
      }
      result[groupKey].push(item)
      return result
    },
    {} as Record<string, T[]>
  )
}

/**
 * Remove duplicatas de array baseado em uma chave
 */
export function uniqueBy<T>(array: T[], key: keyof T | ((item: T) => any)): T[] {
  const seen = new Set()
  return array.filter((item) => {
    const k = typeof key === 'function' ? key(item) : item[key]
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/**
 * Ordena array por uma chave
 */
export function sortBy<T>(
  array: T[],
  key: keyof T | ((item: T) => any),
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key]
    const bVal = typeof key === 'function' ? key(b) : b[key]

    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * Divide array em chunks de tamanho específico
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Retorna primeiro elemento ou undefined
 */
export function first<T>(array: T[]): T | undefined {
  return array[0]
}

/**
 * Retorna último elemento ou undefined
 */
export function last<T>(array: T[]): T | undefined {
  return array[array.length - 1]
}

// ==========================================
// OBJECT HELPERS
// ==========================================

/**
 * Remove propriedades vazias (null, undefined, string vazia) de um objeto
 */
export function removeEmpty<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== null && v !== undefined && v !== ''
    )
  ) as Partial<T>
}

/**
 * Seleciona apenas as propriedades especificadas de um objeto
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return keys.reduce(
    (result, key) => {
      if (key in obj) {
        result[key] = obj[key]
      }
      return result
    },
    {} as Pick<T, K>
  )
}

/**
 * Remove as propriedades especificadas de um objeto
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  keys.forEach((key) => delete result[key])
  return result
}

/**
 * Faz deep clone de um objeto
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Verifica se dois objetos são iguais (deep comparison)
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Verifica se é um ID válido (número inteiro positivo)
 */
export function isValidId(id: unknown): boolean {
  const num = parseInt(String(id))
  return !isNaN(num) && num > 0 && Number.isInteger(num)
}

/**
 * Verifica se é um UUID válido
 */
export function isValidUuid(uuid: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return regex.test(uuid)
}

/**
 * Verifica se é um email válido
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

/**
 * Verifica se é um CPF válido (apenas formato, não valida dígitos)
 */
export function isValidCPFFormat(cpf: string): boolean {
  const digits = onlyNumbers(cpf)
  return digits.length === 11
}

/**
 * Verifica se é um CNPJ válido (apenas formato, não valida dígitos)
 */
export function isValidCNPJFormat(cnpj: string): boolean {
  const digits = onlyNumbers(cnpj)
  return digits.length === 14
}

/**
 * Verifica se é um CEP válido
 */
export function isValidCEP(cep: string): boolean {
  const digits = onlyNumbers(cep)
  return digits.length === 8
}

/**
 * Verifica se é um telefone válido (10 ou 11 dígitos)
 */
export function isValidPhone(phone: string): boolean {
  const digits = onlyNumbers(phone)
  return digits.length === 10 || digits.length === 11
}

// ==========================================
// NUMBER HELPERS
// ==========================================

/**
 * Formata número como moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Arredonda número para N casas decimais
 */
export function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Clamp: limita um número entre min e max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// ==========================================
// ASYNC HELPERS
// ==========================================

/**
 * Delay/sleep assíncrono
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry com exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; delay?: number; backoff?: number } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options

  let lastError: Error | undefined
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        await sleep(delay * Math.pow(backoff, i))
      }
    }
  }
  throw lastError
}
