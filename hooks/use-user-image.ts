'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

// Cache global para evitar múltiplos fetches da mesma imagem
const imageCache = new Map<string, string>()
const fetchPromises = new Map<string, Promise<string | null>>()

/**
 * Hook para buscar a imagem do usuário logado
 * Centraliza o fetch evitando requisições duplicadas
 */
export function useUserImage() {
  const { data: session } = useSession()
  const [userImage, setUserImage] = useState<string>('')

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return

    let isMounted = true

    // Se já tem no cache, usa direto
    if (imageCache.has(userId)) {
      setUserImage(imageCache.get(userId) || '')
      return
    }

    // Se já tem uma requisição em andamento, espera ela
    if (fetchPromises.has(userId)) {
      fetchPromises.get(userId)?.then(image => {
        if (isMounted && image) setUserImage(image)
      })
      return
    }

    // Fazer o fetch
    const fetchPromise = fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        const image = data.image || ''
        imageCache.set(userId, image)
        return image
      })
      .catch(() => null)
      .finally(() => {
        fetchPromises.delete(userId)
      })

    fetchPromises.set(userId, fetchPromise)

    fetchPromise.then(image => {
      if (isMounted && image) setUserImage(image)
    })

    return () => {
      isMounted = false
    }
  }, [session?.user?.id])

  return userImage
}
