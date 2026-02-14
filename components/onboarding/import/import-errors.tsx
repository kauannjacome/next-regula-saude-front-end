'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

interface ErrorRow {
  rowIndex: number
  isValid: boolean
  errors?: Array<{ field: string; message: string }>
}

interface ImportErrorsProps {
  errors: ErrorRow[]
}

export function ImportErrors({ errors }: ImportErrorsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (errors.length === 0) return null

  const displayedErrors = isExpanded ? errors : errors.slice(0, 5)

  // Formatar nome do campo
  const formatFieldName = (field: string): string => {
    const names: Record<string, string> = {
      nome: 'Nome',
      cpf: 'CPF',
      data_nascimento: 'Data Nascimento',
      sexo: 'Sexo',
      telefone: 'Telefone',
      email: 'E-mail',
      cep: 'CEP',
      logradouro: 'Logradouro',
      numero: 'Numero',
      bairro: 'Bairro',
      cidade: 'Cidade',
      estado: 'Estado',
      nome_mae: 'Nome da Mae',
      cargo: 'Cargo',
      conselho: 'Conselho',
      numero_conselho: 'Numero Conselho',
      uf_conselho: 'UF Conselho',
      tipo: 'Tipo',
      cnes: 'CNES',
    }
    return names[field] || field
  }

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-orange-700 dark:text-orange-400">
          <AlertTriangle className="h-5 w-5" />
          {errors.length} linhas com erros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Essas linhas nao serao importadas. Corrija os erros no arquivo e
          tente novamente.
        </p>

        <div className="space-y-2">
          {displayedErrors.map((row) => (
            <div
              key={row.rowIndex}
              className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="font-mono">
                  Linha {row.rowIndex}
                </Badge>
              </div>
              <ul className="space-y-1">
                {row.errors?.map((error, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-orange-600 font-medium shrink-0">
                      {formatFieldName(error.field)}:
                    </span>
                    <span className="text-muted-foreground">
                      {error.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {errors.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Ver todos os {errors.length} erros
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
