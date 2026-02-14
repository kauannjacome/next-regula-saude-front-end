export interface CIDCode {
  code: string
  name: string
}

// Exemplos de CIDs comuns para busca local inicial.
// Em um sistema real, isso viria de uma base de dados completa.
export const COMMON_CIDS: CIDCode[] = [
  { code: 'J18.9', name: 'Pneumonia não especificada' },
  { code: 'I10', name: 'Hipertensão essencial (primária)' },
  { code: 'E11.9', name: 'Diabetes mellitus não-insulino-dependente - sem complicações' },
  { code: 'A09', name: 'Diarreia e gastroenterite de origem infecciosa presumida' },
  { code: 'B34.9', name: 'Infecção viral não especificada' },
  { code: 'M54.5', name: 'Dor lombar baixa' },
  { code: 'R51', name: 'Cefaleia' },
  { code: 'R50.9', name: 'Febre não especificada' },
  { code: 'K21.9', name: 'Doença de refluxo gastroesofágico sem esofagite' },
  { code: 'N39.0', name: 'Infecção do trato urinário de localização não especificada' },
  { code: 'J06.9', name: 'Infecção aguda das vias aéreas superiores não especificada' },
]

export function searchCID(term: string): CIDCode[] {
  if (!term || term.length < 2) return []

  const normalizedTerm = term.toLowerCase()
  return COMMON_CIDS.filter(cid =>
    cid.code.toLowerCase().includes(normalizedTerm) ||
    cid.name.toLowerCase().includes(normalizedTerm)
  ).slice(0, 10)
}
