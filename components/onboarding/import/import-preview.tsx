'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, FileSpreadsheet } from 'lucide-react'
import { ImportType, IMPORT_COLUMNS } from '@/lib/onboarding'

interface PreviewRow {
  rowIndex: number
  isValid: boolean
  data?: Record<string, unknown>
  errors?: Array<{ field: string; message: string }>
}

interface ValidationResult {
  fileName: string
  totalRows: number
  validRows: number
  invalidRows: number
  isValid: boolean
  preview: PreviewRow[]
}

interface ImportPreviewProps {
  validation: ValidationResult
  type: ImportType
}

export function ImportPreview({ validation, type }: ImportPreviewProps) {
  const columns = IMPORT_COLUMNS[type]

  // Selecionar colunas principais para preview (primeiras 5)
  const previewColumns = columns.slice(0, 5)

  // Formatar nome da coluna
  const formatColumnName = (col: string): string => {
    const names: Record<string, string> = {
      nome: 'Nome',
      cpf: 'CPF',
      data_nascimento: 'Dt. Nasc.',
      sexo: 'Sexo',
      telefone: 'Telefone',
      email: 'E-mail',
      cargo: 'Cargo',
      conselho: 'Conselho',
      tipo: 'Tipo',
      cnes: 'CNES',
    }
    return names[col] || col
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSpreadsheet className="h-5 w-5" />
          Preview: {validation.fileName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Total:</span>
            <Badge variant="secondary">{validation.totalRows} linhas</Badge>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">Validos:</span>
            <Badge variant="default" className="bg-green-600">
              {validation.validRows}
            </Badge>
          </div>
          {validation.invalidRows > 0 && (
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Com erros:</span>
              <Badge variant="destructive">{validation.invalidRows}</Badge>
            </div>
          )}
        </div>

        {/* Tabela de preview */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Linha</TableHead>
                <TableHead className="w-[60px]">Status</TableHead>
                {previewColumns.map((col) => (
                  <TableHead key={col}>{formatColumnName(col)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {validation.preview.map((row) => (
                <TableRow
                  key={row.rowIndex}
                  className={row.isValid ? '' : 'bg-red-50 dark:bg-red-900/10'}
                >
                  <TableCell className="font-mono text-sm">
                    {row.rowIndex}
                  </TableCell>
                  <TableCell>
                    {row.isValid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </TableCell>
                  {previewColumns.map((col) => (
                    <TableCell key={col} className="max-w-[200px] truncate">
                      {row.data ? String(row.data[col] || '-') : '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {validation.preview.length < validation.totalRows && (
          <p className="text-sm text-muted-foreground text-center">
            Mostrando {validation.preview.length} de {validation.totalRows}{' '}
            linhas
          </p>
        )}
      </CardContent>
    </Card>
  )
}
