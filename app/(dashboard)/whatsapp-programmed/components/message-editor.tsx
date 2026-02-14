import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TemplateEditor } from '@/components/ui/template-editor'
import { Control, Controller, UseFormRegister, FieldErrors } from 'react-hook-form'
import { WhatsAppProgrammedFormData } from '@/lib/validators'

interface MessageEditorProps {
  control: Control<WhatsAppProgrammedFormData>
  register: UseFormRegister<WhatsAppProgrammedFormData>
  errors: FieldErrors<WhatsAppProgrammedFormData>
}

export function MessageEditor({ control, register, errors }: MessageEditorProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Cabeçalho (Opcional)</Label>
        <Input 
            placeholder="Ex: Confirmação de Agendamento" 
            className="bg-muted/30"
            {...register('headerText')} 
        />
        <p className="text-xs text-muted-foreground">
            Aparece em negrito no topo da mensagem
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
            <Label>Corpo da Mensagem <span className="text-red-500">*</span></Label>
            <div className="flex gap-1">
                {/* Future: formatting toolbar */}
            </div>
        </div>
        
        <div className="relative group">
            <Controller
              name="bodyText"
              control={control}
              render={({ field }) => (
                <TemplateEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Olá {{paciente.nome}}, seu agendamento foi confirmado..."
                  minHeight="200px"
                  maxHeight="500px"
                  error={errors.bodyText?.message}
                />
              )}
            />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Optional: floating actions */}
            </div>
        </div>
        <p className="text-xs text-muted-foreground">
            Digite <code className="bg-muted px-1 rounded">{'{{'}</code> para inserir variáveis
        </p>
      </div>

      <div className="space-y-2">
        <Label>Rodapé (Opcional)</Label>
        <Input 
            placeholder="Ex: Não responda esta mensagem" 
            className="bg-muted/30"
            {...register('footerText')} 
        />
        <p className="text-xs text-muted-foreground">
            Texto pequeno e cinza no final da mensagem
        </p>
      </div>
    </div>
  )
}
