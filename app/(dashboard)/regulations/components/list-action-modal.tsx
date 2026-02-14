'use client'

import { useState, useEffect } from 'react';
import { generateQRCodeDataURL } from '@/lib/qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, QrCode, Link as LinkIcon, Copy, Check, ShieldCheck, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ListActionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: number[]
  type: 'REGULATION' | 'SCHEDULE'
  onSuccess?: () => void
}

export function ListActionModal({ 
  open, 
  onOpenChange, 
  selectedIds, 
  type,
  onSuccess 
}: ListActionModalProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ link: string; hash: string } | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  // Options
  const [listType, setListType] = useState<'STATUS' | 'UPLOAD' | 'SUPPLIER_LIST' | 'SCHEDULE_LIST'>('STATUS')
  const [expiryHours, setExpiryHours] = useState('2')
  const [accessLimit, setAccessLimit] = useState('3')

  const handleGenerate = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/lists/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          type,
          batchType: listType,
          allowedActions: listType === 'STATUS' ? ['STATUS'] : listType === 'UPLOAD' ? ['UPLOAD_REGULATION'] : listType === 'SCHEDULE_LIST' ? ['STATUS', 'SCHEDULE'] : [],
          expiryHours: parseInt(expiryHours),
          accessLimit: parseInt(accessLimit)
        })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Erro ao gerar link')

      // Construir URL usando origin do navegador (funciona local e producao)
      const clientLink = `${window.location.origin}/list/${data.hash}`
      setResult({ ...data, link: clientLink })
      toast.success('Link gerado com sucesso!')
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (!result) return
    navigator.clipboard.writeText(result.link)
    setCopied(true)
    toast.success('Link copiado para a área de transferência')
    setTimeout(() => setCopied(false), 2000)
  }

  // Gerar QR code localmente quando result muda
  useEffect(() => {
    if (!result) {
      setQrDataUrl(null)
      return
    }
    generateQRCodeDataURL(result.link, 200).then(setQrDataUrl)
  }, [result])

  // toggleAction removed since we use fixed listType for now

  return (
    <Dialog open={open} onOpenChange={(val: boolean) => {
      if (!val) {
        setResult(null)
        setQrDataUrl(null)
      }
      onOpenChange(val)
    }}>
      <DialogContent className="w-[95vw] sm:max-w-[450px] rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Link / QR Code para Mobile
          </DialogTitle>
          <DialogDescription>
            Gere um acesso temporário para atualizar {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'itens'} via celular.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Objetivo da Lista</Label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setListType('STATUS')}
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg border transition-all text-left",
                    listType === 'STATUS' ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200" : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className={cn("mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0", listType === 'STATUS' ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white")}>
                    {listType === 'STATUS' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="grid gap-1.5 leading-none">
                    <span className="text-sm font-semibold">Atualizar Status</span>
                    <p className="text-xs text-slate-500">Aprovar ou Cancelar registros em massa via celular.</p>
                  </div>
                </button>

                <button
                  onClick={() => setListType('UPLOAD')}
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg border transition-all text-left",
                    listType === 'UPLOAD' ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200" : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className={cn("mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0", listType === 'UPLOAD' ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white")}>
                    {listType === 'UPLOAD' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="grid gap-1.5 leading-none">
                    <span className="text-sm font-semibold">Anexar Documentos</span>
                    <p className="text-xs text-slate-500">Habilitar câmera para fotos de pedidos/laudos.</p>
                  </div>
                </button>

                <button
                  onClick={() => setListType('SUPPLIER_LIST')}
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg border transition-all text-left",
                    listType === 'SUPPLIER_LIST' ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200" : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className={cn("mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0", listType === 'SUPPLIER_LIST' ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white")}>
                    {listType === 'SUPPLIER_LIST' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="grid gap-1.5 leading-none">
                    <span className="text-sm font-semibold">Lista para Fornecedor (Segura)</span>
                    <p className="text-xs text-slate-500">Visão otimizada com CPF mascarado e dados protegidos.</p>
                  </div>
                </button>

                <button
                  onClick={() => setListType('SCHEDULE_LIST')}
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg border transition-all text-left",
                    listType === 'SCHEDULE_LIST' ? "bg-green-50 border-green-200 ring-1 ring-green-200" : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className={cn("mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0", listType === 'SCHEDULE_LIST' ? "border-green-600 bg-green-600" : "border-slate-300 bg-white")}>
                    {listType === 'SCHEDULE_LIST' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="grid gap-1.5 leading-none">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">Lista de Agendamento</span>
                      <Calendar className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-xs text-slate-500">Atualizar agendamento e regulação simultaneamente.</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tempo de Expiração</Label>
              <Select value={expiryHours} onValueChange={setExpiryHours}>
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder="Selecione a validade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hora</SelectItem>
                  <SelectItem value="2">2 horas</SelectItem>
                  <SelectItem value="4">4 horas</SelectItem>
                  <SelectItem value="8">8 horas</SelectItem>
                  <SelectItem value="12">12 horas</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                O link será desativado automaticamente após este período.
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Limite de Acessos</Label>
              <Select value={accessLimit} onValueChange={setAccessLimit}>
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder="Selecione o limite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 acesso</SelectItem>
                  <SelectItem value="2">2 acessos</SelectItem>
                  <SelectItem value="3">3 acessos</SelectItem>
                  <SelectItem value="4">4 acessos</SelectItem>
                  <SelectItem value="5">5 acessos (máximo)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Após atingir o limite, o link ficará expirado.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="p-4 bg-white border-4 border-slate-100 rounded-2xl shadow-sm">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              )}
            </div>

            <p className="text-xs text-center text-slate-500">
              Aponte a câmera do celular para o QR Code acima
            </p>

            <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar Link'}
            </Button>
          </div>
        )}

        <DialogFooter className="sm:justify-between border-t pt-4">
          {!result ? (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleGenerate} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                Gerar Link / QR Code
              </Button>
            </>
          ) : (
            <Button className="w-full" variant="secondary" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
