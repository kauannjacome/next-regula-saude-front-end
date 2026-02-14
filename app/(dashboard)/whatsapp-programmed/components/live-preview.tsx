import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LivePreviewProps {
  headerText?: string
  bodyText?: string
  footerText?: string
}

export function LivePreview({ headerText, bodyText, footerText }: LivePreviewProps) {
  const getPreviewMessage = () => {
    let preview = bodyText || ''

    // Dados de exemplo para substituir variáveis no preview
    const sampleData: Record<string, string> = {
      'paciente.nome': 'Maria da Silva',
      'paciente.cpf': '123.456.789-00',
      'paciente.cns': '898 0016 0323 0005',
      'paciente.telefone': '(11) 99999-0000',
      'paciente.nascimento': '15/03/1985',
      'paciente.endereco': 'Rua das Flores, 123',
      'paciente.cidade': 'São Paulo',
      'paciente.mae': 'Ana da Silva',
      'agendamento.data': '20/03/2026 às 14:30',
      'agendamento.hora': '14:30',
      'agendamento.status': 'Confirmado',
      'agendamento.local': 'UBS Central',
      'agendamento.profissional': 'Dr. João Santos',
      'regulacao.protocolo': 'PROT-2026-00042',
      'regulacao.status': 'Aprovada',
      'regulacao.prioridade': 'Eletiva',
      'regulacao.procedimento': 'Consulta Cardiológica',
      'regulacao.data': '10/02/2026',
      'unidade.nome': 'UBS Central',
      'unidade.endereco': 'Av. Brasil, 500',
      'municipio.nome': 'São Paulo',
      'profissional.nome': 'Dr. João Santos',
    }

    // Substituir variáveis {{chave}} pelos dados de exemplo
    preview = preview.replace(/\{\{([^}]+)\}\}/g, (_match, key: string) => {
      const normalizedKey = key.trim().toLowerCase()
      const value = sampleData[normalizedKey]
      if (value) {
        return `*${value}*`
      }
      return `\`{{${key}}}\``
    })

    return preview
  }

  // Sanitizar HTML para prevenir XSS antes de inserir via dangerouslySetInnerHTML
  const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const messageContent = escapeHtml(getPreviewMessage())

  return (
    <div className="w-full max-w-[320px] mx-auto sticky top-6">
      <div className="bg-white dark:bg-zinc-950 border rounded-[2.5rem] p-3 shadow-xl ring-8 ring-zinc-900/5 dark:ring-zinc-800/20 relative overflow-hidden">
        {/* Notch/Camera area */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-zinc-950 rounded-b-[1rem] z-20"></div>
        
        {/* Screen Content */}
        <div className="bg-[#E5DDD5] dark:bg-[#0b141a] rounded-[1.8rem] h-[580px] overflow-hidden flex flex-col relative">
            {/* WhatsApp Header */}
            <div className="bg-[#008069] dark:bg-[#202c33] p-3 pt-8 flex items-center gap-3 text-white shadow-sm z-10">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                    <MessageSquare size={16} className="text-white" />
                </div>
                <div className="flex-1">
                    <p className="font-medium text-sm leading-tight">NextSaúde</p>
                    <p className="text-[10px] opacity-80">comercial</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-3 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-90 dark:opacity-20">
                <div className="bg-white dark:bg-[#202c33] rounded-lg rounded-tl-none p-2 shadow-sm max-w-[90%] mb-2 relative group">
                    {/* Header Text */}
                    {headerText && (
                        <div className="font-bold text-sm mb-1 pb-1 border-b border-gray-100 dark:border-gray-700/50 text-gray-800 dark:text-gray-100">
                             {headerText}
                        </div>
                    )}
                    
                    {/* Body Text */}
                    <div 
                        className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed break-words"
                         dangerouslySetInnerHTML={bodyText ? {
                          __html: messageContent
                            .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
                            .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1 rounded text-[10px] border border-gray-200 dark:border-gray-600">$1</code>'),
                        } : undefined}
                    >
                        {!bodyText && <span className="text-gray-400 italic">Sua mensagem aparecerá aqui...</span>}
                    </div>

                    {/* Footer Text */}
                    {footerText && (
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 pt-1 border-t border-gray-100 dark:border-gray-700/50">
                            {footerText}
                        </div>
                    )}
                    
                    {/* Timestamp */}
                    <div className="text-[9px] text-gray-400 text-right mt-1 flex items-center justify-end gap-0.5">
                        <span>14:30</span>
                    </div>

                    {/* Triangle for bubble */}
                     <div className="absolute top-0 -left-2 w-0 h-0 border-t-[0px] border-r-[10px] border-b-[10px] border-transparent border-r-white dark:border-r-[#202c33]"></div>
                </div>
            </div>

            {/* Footer Input Area Mockup */}
            <div className="bg-[#f0f2f5] dark:bg-[#202c33] p-2 flex items-center gap-2">
                 <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 opacity-50"></div>
                 <div className="flex-1 h-8 bg-white dark:bg-gray-700 rounded-lg opacity-50"></div>
                 <div className="w-8 h-8 rounded-full bg-[#008069] opacity-50 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white/50 rounded-sm"></div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  )
}
