interface ViaCEPResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

interface AddressData {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
}

export async function fetchAddressByCEP(cep: string): Promise<AddressData | null> {
  const cleanedCEP = cep.replace(/\D/g, '')

  if (cleanedCEP.length !== 8) {
    return null
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanedCEP}/json/`)
    const data: ViaCEPResponse = await response.json()

    if (data.erro) {
      return null
    }

    return {
      cep: data.cep,
      logradouro: data.logradouro,
      complemento: data.complemento,
      bairro: data.bairro,
      cidade: data.localidade,
      estado: data.uf,
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    return null
  }
}
