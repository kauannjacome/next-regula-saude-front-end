// ==========================================
// COMPONENTE COMPARTILHADO: DIÁLOGO DE CONFIRMAÇÃO
// ==========================================
// Este componente mostra um popup pedindo confirmação antes de ação importante
// Exemplos de uso: "Tem certeza que deseja excluir?", "Confirmar agendamento?"
// Previne ações acidentais (especialmente exclusões)
// 'use client' = este código roda no NAVEGADOR (frontend)

'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'  // Combinar classes CSS

// TIPO: Define quais propriedades este componente aceita
interface ConfirmDialogProps {
  open: boolean                               // Se o diálogo está aberto/visível
  onOpenChange: (open: boolean) => void       // Função para abrir/fechar
  title: string                               // Título do diálogo (ex: "Excluir Cidadão")
  description: string                         // Descrição/aviso (ex: "Esta ação não pode ser desfeita")
  confirmLabel?: string                       // Texto do botão confirmar (padrão: "Confirmar")
  confirmText?: string                        // Alias para confirmLabel
  cancelLabel?: string                        // Texto do botão cancelar (padrão: "Cancelar")
  onConfirm: () => void                       // Função executada ao confirmar
  variant?: 'default' | 'destructive'         // Estilo do botão confirmar (padrão: 'default')
  isLoading?: boolean                         // Se está processando (mostra "Aguarde...")
  children?: React.ReactNode                  // Conteúdo adicional (opcional)
}

// COMPONENTE PRINCIPAL
// Renderiza um diálogo modal com botões Cancelar e Confirmar
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmText,                      // Alias para confirmLabel
  cancelLabel = 'Cancelar',        // Valor padrão se não passar
  onConfirm,
  variant = 'default',             // Valor padrão: botão azul
  isLoading = false,               // Valor padrão: não está carregando
  children,
}: ConfirmDialogProps) {
  // Usa confirmText como fallback para confirmLabel
  const buttonLabel = confirmLabel || confirmText || 'Confirmar'
  return (
    // AlertDialog: Modal que escurece o fundo e foca no diálogo
    // open = controla se está visível
    // onOpenChange = função chamada ao fechar (clicar fora ou ESC)
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[95vw] sm:max-w-lg rounded-lg">
        {/* CABEÇALHO: Título e descrição */}
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>{description}</p>
              {children}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* RODAPÉ: Botões de ação */}
        <AlertDialogFooter>
          {/* BOTÃO CANCELAR (esquerda) */}
          {/* disabled={isLoading} = desabilitar enquanto processa */}
          <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>

          {/* BOTÃO CONFIRMAR (direita) */}
          <AlertDialogAction
            onClick={onConfirm}              // Executar função ao clicar
            disabled={isLoading}             // Desabilitar enquanto processa
            className={cn(
              // Se variant='destructive': botão vermelho (para ações perigosas como excluir)
              // Se variant='default': botão azul (ações normais)
              variant === 'destructive' && buttonVariants({ variant: 'destructive' })
            )}
          >
            {/* Mostrar "Aguarde..." enquanto processa, ou label normal */}
            {isLoading ? 'Aguarde...' : buttonLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
