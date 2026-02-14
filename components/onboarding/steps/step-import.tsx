'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  UserCog,
  Building2,
  ArrowRight,
  Loader2,
  SkipForward,
  CheckCircle2,
} from 'lucide-react'
import { ImportTab } from '../import'
import { ImportType, IMPORT_TAB_CONFIG } from '@/lib/onboarding'

interface StepImportProps {
  onContinue: () => void
  onSkip: () => void
  isLoading?: boolean
}

export function StepImport({ onContinue, onSkip, isLoading }: StepImportProps) {
  const [importedTypes, setImportedTypes] = useState<Set<ImportType>>(new Set())
  const [activeTab, setActiveTab] = useState<ImportType>('CITIZENS')

  const handleImportComplete = (type: ImportType) => {
    setImportedTypes((prev) => new Set([...prev, type]))
  }

  const hasAnyImport = importedTypes.size > 0

  const getTabIcon = (type: ImportType) => {
    switch (type) {
      case 'CITIZENS':
        return Users
      case 'PROFESSIONALS':
        return UserCog
      case 'UNITS':
        return Building2
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 mb-4">
          <Users className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Importar Dados</h1>
        <p className="text-muted-foreground">
          Importe seus dados iniciais via planilha Excel ou CSV
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selecione o tipo de dados</CardTitle>
          <CardDescription>
            Voce pode importar cidadaos, profissionais e unidades de saude
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as ImportType)}
          >
            <TabsList className="grid w-full grid-cols-3 mb-6">
              {(Object.keys(IMPORT_TAB_CONFIG) as ImportType[]).map((type) => {
                const Icon = getTabIcon(type)
                const isImported = importedTypes.has(type)
                return (
                  <TabsTrigger
                    key={type}
                    value={type}
                    className="flex items-center gap-2"
                  >
                    {isImported ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    {IMPORT_TAB_CONFIG[type].label}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {(Object.keys(IMPORT_TAB_CONFIG) as ImportType[]).map((type) => (
              <TabsContent key={type} value={type}>
                <ImportTab
                  type={type}
                  onImportComplete={() => handleImportComplete(type)}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Resumo de importacoes */}
      {hasAnyImport && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-700 dark:text-green-400">
                Dados importados:
              </span>
              <div className="flex gap-2">
                {Array.from(importedTypes).map((type) => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className="bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300"
                  >
                    {IMPORT_TAB_CONFIG[type].label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={onSkip}
          disabled={isLoading}
          className="text-muted-foreground"
        >
          <SkipForward className="h-4 w-4 mr-2" />
          Pular esta etapa
        </Button>

        <Button onClick={onContinue} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              {hasAnyImport ? 'Continuar' : 'Continuar sem importar'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
