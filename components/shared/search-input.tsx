// ==========================================
// COMPONENTE COMPARTILHADO: CAMPO DE BUSCA
// ==========================================
// Este componente é um input de texto com ícones de busca e limpar
// Ícone de lupa (esquerda) + Input + Botão X para limpar (direita)
// Usado em listas para filtrar/buscar itens
// 'use client' = este código roda no NAVEGADOR (frontend)

'use client'

import { Search, X } from 'lucide-react'        // Ícones: lupa e X
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'                // Combinar classes CSS

// TIPO: Define quais propriedades este componente aceita
interface SearchInputProps {
  value: string                         // Texto atual da busca
  onChange: (value: string) => void     // Função chamada quando texto muda
  placeholder?: string                  // Texto placeholder (padrão: "Buscar...")
  className?: string                    // Classes CSS adicionais (opcional)
}

// COMPONENTE PRINCIPAL
// Renderiza input com ícone de lupa e botão X para limpar
export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',    // Valor padrão se não passar
  className,
}: SearchInputProps) {
  return (
    // Container relativo (para posicionar ícones absolutamente)
    <div className={cn('relative', className)}>
      {/* ÍCONE DE LUPA (esquerda) */}
      {/* Posicionado absolutamente dentro do input */}
      {/* top-1/2 -translate-y-1/2 = centraliza verticalmente */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

      {/* INPUT DE TEXTO */}
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}  // Atualizar valor ao digitar
        className="pl-10 pr-10"  // Padding left/right para não sobrepor ícones
      />

      {/* BOTÃO X PARA LIMPAR (direita) */}
      {/* Só aparece se tem texto digitado (value não vazio) */}
      {value && (
        <Button
          type="button"
          variant="ghost"     // Botão transparente
          size="icon"         // Tamanho quadrado para ícone
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => onChange('')}  // Limpar texto (passar string vazia)
        >
          <X className="h-4 w-4" />
          {/* sr-only = visível apenas para leitores de tela (acessibilidade) */}
          <span className="sr-only">Limpar busca</span>
        </Button>
      )}
    </div>
  )
}
