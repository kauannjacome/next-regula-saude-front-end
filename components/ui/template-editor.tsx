'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  TEMPLATE_TOKENS,
  TOKEN_CATEGORIES,
  searchTokens,
  getTokensByCategory,
  formatMustacheToken,
  type TemplateToken,
  type TokenCategory,
} from '@/lib/templates/template-variables'
import {
  User,
  Users,
  FileText,
  Calendar,
  UserPlus,
  UserCheck,
  Stethoscope,
  Building2,
  Folder,
  Truck,
  Building,
  Activity,
  Search,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

// Mapeamento de ícones
const ICON_MAP: Record<string, React.ElementType> = {
  User,
  Users,
  FileText,
  Calendar,
  UserPlus,
  UserCheck,
  Stethoscope,
  Building2,
  Folder,
  Truck,
  Building,
  Activity,
}

interface TemplateEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
  maxHeight?: string
  label?: string
  error?: string
  disabled?: boolean
}

export function TemplateEditor({
  value,
  onChange,
  placeholder = 'Digite sua mensagem...',
  className,
  minHeight = '120px',
  maxHeight = '300px',
  label,
  error,
  disabled = false,
}: TemplateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [showDropdown, setShowDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  // Tokens filtrados
  const filteredTokens = useMemo(() => {
    let tokens = searchQuery ? searchTokens(searchQuery) : TEMPLATE_TOKENS

    if (selectedCategory) {
      tokens = tokens.filter((t) => t.category === selectedCategory)
    }

    return tokens
  }, [searchQuery, selectedCategory])

  // Agrupa tokens por categoria quando não há busca
  const groupedTokens = useMemo(() => {
    if (searchQuery) return null

    const grouped: Record<string, TemplateToken[]> = {}
    for (const cat of TOKEN_CATEGORIES) {
      const tokens = filteredTokens.filter((t) => t.category === cat.id)
      if (tokens.length > 0) {
        grouped[cat.id] = tokens
      }
    }
    return grouped
  }, [filteredTokens, searchQuery])

  // Calcula posição do dropdown
  const updateDropdownPosition = useCallback(() => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const rect = textarea.getBoundingClientRect()

    // Posição simples abaixo do textarea
    setDropdownPosition({
      top: rect.height + 4,
      left: 0,
    })
  }, [])

  // Detecta quando mostrar o dropdown
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      const cursorPos = e.target.selectionStart || 0

      onChange(newValue)
      setCursorPosition(cursorPos)

      // Verifica se deve abrir o dropdown
      const textBeforeCursor = newValue.substring(0, cursorPos)
      const lastTwoChars = textBeforeCursor.slice(-2)
      const lastThreeChars = textBeforeCursor.slice(-3)

      if (lastTwoChars === '{{' || lastThreeChars === '{{ ') {
        setShowDropdown(true)
        setSearchQuery('')
        setSelectedCategory(null)
        setSelectedIndex(0)
        updateDropdownPosition()
      } else if (showDropdown) {
        // Atualiza a busca enquanto o dropdown está aberto
        const match = textBeforeCursor.match(/\{\{\s*([^}]*)$/)
        if (match) {
          setSearchQuery(match[1].trim())
          setSelectedIndex(0)
        } else {
          setShowDropdown(false)
        }
      }
    },
    [onChange, showDropdown, updateDropdownPosition]
  )

  // Teclado para navegação
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Alt + Espaço para abrir dropdown
      if (e.altKey && e.code === 'Space') {
        e.preventDefault()
        setShowDropdown(true)
        setSearchQuery('')
        setSelectedCategory(null)
        setSelectedIndex(0)
        updateDropdownPosition()
        return
      }

      if (!showDropdown) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, filteredTokens.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
        case 'Tab':
          e.preventDefault()
          if (filteredTokens[selectedIndex]) {
            insertToken(filteredTokens[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          setShowDropdown(false)
          break
      }
    },
    [showDropdown, filteredTokens, selectedIndex, updateDropdownPosition]
  )

  // Insere o token no texto
  const insertToken = useCallback(
    (token: TemplateToken) => {
      if (!textareaRef.current) return

      const textarea = textareaRef.current
      const text = value
      const cursorPos = textarea.selectionStart || 0

      // Encontra o início do {{
      const textBeforeCursor = text.substring(0, cursorPos)
      const matchStart = textBeforeCursor.lastIndexOf('{{')

      if (matchStart === -1) {
        // Não encontrou {{, insere completo
        const newText = text.substring(0, cursorPos) + formatMustacheToken(token.token) + text.substring(cursorPos)
        onChange(newText)
        const newPos = cursorPos + formatMustacheToken(token.token).length
        setTimeout(() => {
          textarea.setSelectionRange(newPos, newPos)
          textarea.focus()
        }, 0)
      } else {
        // Substitui desde {{ até o cursor
        const newText = text.substring(0, matchStart) + formatMustacheToken(token.token) + text.substring(cursorPos)
        onChange(newText)
        const newPos = matchStart + formatMustacheToken(token.token).length
        setTimeout(() => {
          textarea.setSelectionRange(newPos, newPos)
          textarea.focus()
        }, 0)
      }

      setShowDropdown(false)
      setSearchQuery('')
      setSelectedCategory(null)
    },
    [value, onChange]
  )

  // Fecha dropdown quando clica fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Renderiza ícone da categoria
  const renderCategoryIcon = (iconName: string, size = 16) => {
    const IconComponent = ICON_MAP[iconName]
    return IconComponent ? <IconComponent size={size} /> : null
  }

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full rounded-lg border bg-white dark:bg-zinc-900 px-3 py-2',
            'text-sm text-gray-900 dark:text-gray-100',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'resize-y transition-colors',
            error ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-zinc-700'
          )}
          style={{ minHeight, maxHeight }}
        />

        {/* Dica de uso */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 text-xs text-gray-400 pointer-events-none">
          <Sparkles size={12} />
          <span>
            Digite <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded text-[10px]">{'{{'}</kbd> ou{' '}
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded text-[10px]">Alt+Espaço</kbd>
          </span>
        </div>

        {/* Dropdown IntelliSense */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl overflow-hidden"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              maxHeight: '350px',
            }}
          >
            {/* Header com busca */}
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 p-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setSelectedIndex(0)
                    }}
                    placeholder="Buscar variável..."
                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-zinc-800 border-0 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              </div>

              {/* Filtro por categoria */}
              <div className="flex gap-1 mt-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    'px-2 py-1 text-xs rounded-md whitespace-nowrap transition-colors',
                    !selectedCategory
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                  )}
                >
                  Todos
                </button>
                {TOKEN_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 text-xs rounded-md whitespace-nowrap transition-colors',
                      selectedCategory === cat.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    )}
                  >
                    {renderCategoryIcon(cat.icon, 12)}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de tokens */}
            <ScrollArea className="max-h-[250px]">
              {searchQuery || selectedCategory ? (
                // Lista simples quando há busca ou filtro
                <div className="p-1">
                  {filteredTokens.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">
                      Nenhuma variável encontrada
                    </div>
                  ) : (
                    filteredTokens.map((token, idx) => {
                      const category = TOKEN_CATEGORIES.find((c) => c.id === token.category)
                      return (
                        <button
                          key={token.token}
                          onClick={() => insertToken(token)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors',
                            idx === selectedIndex
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                          )}
                        >
                          <div
                            className={cn(
                              'flex items-center justify-center w-7 h-7 rounded-md',
                              category?.color || 'bg-gray-500',
                              'text-white'
                            )}
                          >
                            {category && renderCategoryIcon(category.icon, 14)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                {`{{${token.token}}}`}
                              </code>
                              {token.derived && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                  calculado
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {token.label}
                              {token.description && (
                                <span className="text-gray-400 dark:text-gray-500"> - {token.description}</span>
                              )}
                            </p>
                          </div>
                          <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
                        </button>
                      )
                    })
                  )}
                </div>
              ) : (
                // Lista agrupada por categoria
                <div className="p-1">
                  {groupedTokens &&
                    Object.entries(groupedTokens).map(([catId, tokens]) => {
                      const category = TOKEN_CATEGORIES.find((c) => c.id === catId)
                      if (!category) return null

                      return (
                        <div key={catId} className="mb-2">
                          <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            <div className={cn('p-1 rounded', category.color, 'text-white')}>
                              {renderCategoryIcon(category.icon, 12)}
                            </div>
                            <span>{category.label}</span>
                            <span className="text-gray-300 dark:text-gray-600">({tokens.length})</span>
                          </div>
                          {tokens.slice(0, 5).map((token) => (
                            <button
                              key={token.token}
                              onClick={() => insertToken(token)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-left hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                              <code className="text-xs font-mono text-primary">{token.token}</code>
                              <span className="text-xs text-gray-400">-</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{token.label}</span>
                            </button>
                          ))}
                          {tokens.length > 5 && (
                            <button
                              onClick={() => setSelectedCategory(catId)}
                              className="w-full px-3 py-1 text-xs text-primary hover:underline text-left"
                            >
                              Ver mais {tokens.length - 5} variáveis...
                            </button>
                          )}
                        </div>
                      )
                    })}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-zinc-800 border-t border-gray-100 dark:border-zinc-700 px-3 py-1.5">
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>
                  <kbd className="px-1 py-0.5 bg-white dark:bg-zinc-900 rounded border border-gray-200 dark:border-zinc-600">
                    ↑↓
                  </kbd>{' '}
                  navegar
                </span>
                <span>
                  <kbd className="px-1 py-0.5 bg-white dark:bg-zinc-900 rounded border border-gray-200 dark:border-zinc-600">
                    Enter
                  </kbd>{' '}
                  selecionar
                </span>
                <span>
                  <kbd className="px-1 py-0.5 bg-white dark:bg-zinc-900 rounded border border-gray-200 dark:border-zinc-600">
                    Esc
                  </kbd>{' '}
                  fechar
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
}

export default TemplateEditor
