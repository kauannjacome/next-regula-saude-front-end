'use client'

// ==========================================
// BOTÃO: SALVAR E IMPRIMIR
// ==========================================
// Componente para salvar um formulário e imediatamente abrir
// o modal de impressão do documento
//
// FUNCIONALIDADES:
// - Executa a função de salvar passada como prop
// - Após salvar com sucesso, abre modal de impressão
// - Mostra feedback de loading durante o processo
//
// COMO USAR:
// <SaveAndPrintButton
//   onSave={handleSave}
//   regulationId={newRegulationId}
//   citizenName={citizenName}
// />

import { useState } from 'react'
import { Printer, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type ButtonProps = React.ComponentProps<typeof Button>
import { PrintTemplateModal } from './print-template-modal'

// ==========================================
// TIPOS
// ==========================================

interface SaveAndPrintButtonProps extends Omit<ButtonProps, 'onClick'> {
  // Função que salva e retorna o ID da regulação criada
  onSave: () => Promise<{ regulationId?: number; citizenId?: number } | null>

  // Dados para o modal de impressão (opcional - pode vir do onSave)
  regulationId?: number
  citizenId?: number
  citizenName?: string

  // Labels
  saveLabel?: string
  saveAndPrintLabel?: string

  // Mostrar apenas o botão de salvar e imprimir?
  hideRegularSave?: boolean
}

// ==========================================
// COMPONENTE
// ==========================================

export function SaveAndPrintButton({
  onSave,
  regulationId: initialRegulationId,
  citizenId: initialCitizenId,
  citizenName,
  saveLabel = 'Salvar',
  saveAndPrintLabel = 'Salvar e Imprimir',
  hideRegularSave = false,
  disabled,
  ...buttonProps
}: SaveAndPrintButtonProps) {
  // === ESTADOS ===
  const [isSaving, setIsSaving] = useState(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [savedRegulationId, setSavedRegulationId] = useState<number | undefined>(
    initialRegulationId
  )
  const [savedCitizenId, setSavedCitizenId] = useState<number | undefined>(
    initialCitizenId
  )

  // === HANDLERS ===

  // Salvar sem imprimir
  const handleSaveOnly = async () => {
    setIsSaving(true)
    try {
      const result = await onSave()
      if (result) {
        toast.success('Salvo com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  // Salvar e depois abrir modal de impressão
  const handleSaveAndPrint = async () => {
    setIsSaving(true)
    try {
      const result = await onSave()

      if (result) {
        // Atualizar IDs para o modal
        if (result.regulationId) {
          setSavedRegulationId(result.regulationId)
        }
        if (result.citizenId) {
          setSavedCitizenId(result.citizenId)
        }

        toast.success('Salvo com sucesso!')

        // Abrir modal de impressão
        setIsPrintModalOpen(true)
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Botão Salvar (opcional) */}
        {!hideRegularSave && (
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveOnly}
            disabled={disabled || isSaving}
            {...buttonProps}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saveLabel}
          </Button>
        )}

        {/* Botão Salvar e Imprimir */}
        <Button
          type="button"
          onClick={handleSaveAndPrint}
          disabled={disabled || isSaving}
          {...buttonProps}
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Printer className="mr-2 h-4 w-4" />
          )}
          {saveAndPrintLabel}
        </Button>
      </div>

      {/* Modal de Impressão */}
      <PrintTemplateModal
        open={isPrintModalOpen}
        onOpenChange={setIsPrintModalOpen}
        regulationId={savedRegulationId}
        citizenId={savedCitizenId}
        citizenName={citizenName}
      />
    </>
  )
}

// ==========================================
// COMPONENTE: BOTÃO DE IMPRESSÃO SIMPLES
// ==========================================
// Apenas abre o modal de impressão sem salvar

interface PrintButtonProps extends Omit<ButtonProps, 'onClick'> {
  regulationId?: number
  citizenId?: number
  citizenName?: string
  label?: string
}

export function PrintButton({
  regulationId,
  citizenId,
  citizenName,
  label = 'Imprimir',
  ...buttonProps
}: PrintButtonProps) {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsPrintModalOpen(true)}
        {...buttonProps}
      >
        <Printer className="mr-2 h-4 w-4" />
        {label}
      </Button>

      <PrintTemplateModal
        open={isPrintModalOpen}
        onOpenChange={setIsPrintModalOpen}
        regulationId={regulationId}
        citizenId={citizenId}
        citizenName={citizenName}
      />
    </>
  )
}

export default SaveAndPrintButton
