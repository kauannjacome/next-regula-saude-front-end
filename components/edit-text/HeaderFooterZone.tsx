'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { ImagePlus, QrCode, Table, X, Hash } from 'lucide-react';

// ── Helpers: chip ↔ texto ──────────────────────────────────────────

function converterTextoParaChips(html: string, pageNum: number, totalPages: number): string {
  return html
    .replace(/\{\{pagina\}\}/g,
      `<span class="dynamic-variable-chip" contenteditable="false" data-var="pagina">${pageNum}</span>`)
    .replace(/\{\{total\}\}/g,
      `<span class="dynamic-variable-chip" contenteditable="false" data-var="total">${totalPages}</span>`);
}

function converterChipsParaTexto(html: string): string {
  return html
    .replace(/<span[^>]*data-var="pagina"[^>]*>[\s\S]*?<\/span>/g, '{{pagina}}')
    .replace(/<span[^>]*data-var="total"[^>]*>[\s\S]*?<\/span>/g, '{{total}}');
}

interface HeaderFooterZoneProps {
  type: 'header' | 'footer';
  html: string;
  height: number;
  marginLeft: number;
  marginRight: number;
  isEditing: boolean;
  pageNum: number;
  totalPages: number;
  onEdit: () => void;
  onUpdate: (html: string) => void;
  onClose: () => void;
  dragSobre?: boolean;
  variantLabel?: string;
}

export const HeaderFooterZone: React.FC<HeaderFooterZoneProps> = ({
  type,
  html,
  height,
  marginLeft,
  marginRight,
  isEditing,
  pageNum,
  totalPages,
  onEdit,
  onUpdate,
  onClose,
  dragSobre: dragSobreProp,
  variantLabel,
}) => {
  const zoneRef = useRef<HTMLDivElement>(null);
  const wasEditingRef = useRef(false);
  const htmlRef = useRef(html);
  const onUpdateRef = useRef(onUpdate);
  const ehCabecalho = type === 'header';

  const dragSobre = dragSobreProp ?? false;

  // Menu de contexto
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Manter ref de onUpdate sempre atualizado (evita stale closure)
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  // Atualizar htmlRef de props somente quando NAO editando
  if (!isEditing) {
    htmlRef.current = html;
  }

  // Preview: substituir variaveis de template
  const obterPreviewHTML = useCallback(() => {
    return htmlRef.current
      .replace(/\{\{pagina\}\}/g, String(pageNum))
      .replace(/\{\{total\}\}/g, String(totalPages));
  }, [pageNum, totalPages]);

  // Salvar conteudo do contentEditable para o pai (converte chips de volta para texto)
  const salvar = useCallback(() => {
    const el = zoneRef.current;
    if (!el) return;
    if (el.getAttribute('contenteditable') !== 'true') return;
    const conteudo = converterChipsParaTexto(el.innerHTML);
    htmlRef.current = conteudo;
    onUpdateRef.current(conteudo);
  }, []);

  // ── Insercoes ──────────────────────────────────────────────────

  const inserirImagemArquivo = useCallback((arquivo: File) => {
    const el = zoneRef.current;
    if (!el) return;
    const leitor = new FileReader();
    leitor.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = document.createElement('img');
      img.src = src;
      img.style.maxWidth = '100%';
      img.style.maxHeight = (height - 20) + 'px';
      img.style.height = 'auto';
      img.style.objectFit = 'contain';
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        range.collapse(false);
      } else {
        el.appendChild(img);
      }
      salvar();
    };
    leitor.readAsDataURL(arquivo);
  }, [height, salvar]);

  const handleInserirImagem = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const arquivo = input.files?.[0];
      if (arquivo) inserirImagemArquivo(arquivo);
    };
    input.click();
  }, [inserirImagemArquivo]);

  const handleInserirQRCode = useCallback(() => {
    const el = zoneRef.current;
    if (!el) return;
    const url = prompt('URL ou texto para QR Code:', 'https://');
    if (!url || !url.trim()) return;
    const marcador = document.createElement('span');
    marcador.className = 'dynamic-variable-chip';
    marcador.setAttribute('contenteditable', 'false');
    marcador.textContent = `{{qrcode:${url.trim()}}}`;
    marcador.style.cursor = 'default';
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(marcador);
      range.collapse(false);
    } else {
      el.appendChild(marcador);
    }
    salvar();
  }, [salvar]);

  const handleInserirTabela = useCallback(() => {
    const el = zoneRef.current;
    if (!el) return;
    const tabelaHTML = '<table style="width:100%;border-collapse:collapse;font-size:10px;"><tr><td style="border:1px solid #ccc;padding:4px;">&nbsp;</td><td style="border:1px solid #ccc;padding:4px;">&nbsp;</td><td style="border:1px solid #ccc;padding:4px;">&nbsp;</td></tr></table>';
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
      document.execCommand('insertHTML', false, tabelaHTML);
    } else {
      el.insertAdjacentHTML('beforeend', tabelaHTML);
    }
    salvar();
  }, [salvar]);

  // Inserir chip de variavel ({{pagina}} ou {{total}})
  const handleInserirVariavel = useCallback((varName: 'pagina' | 'total') => {
    const el = zoneRef.current;
    if (!el) return;
    el.focus();
    const valor = varName === 'pagina' ? pageNum : totalPages;
    const chipHTML = `<span class="dynamic-variable-chip" contenteditable="false" data-var="${varName}">${valor}</span>`;
    document.execCommand('insertHTML', false, chipHTML);
    salvar();
  }, [pageNum, totalPages, salvar]);

  // ── Atalhos de teclado ─────────────────────────────────────────
  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setMenuPos(null);
        salvar();
        onClose();
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [isEditing, salvar, onClose]);

  // Fechar menu de contexto ao clicar fora
  useEffect(() => {
    if (!menuPos) return;
    const handler = () => setMenuPos(null);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuPos]);

  // ── Transicao editando ↔ nao editando ─────────────────────────
  useEffect(() => {
    const el = zoneRef.current;
    if (!el) return;

    if (isEditing && !wasEditingRef.current) {
      // ENTRAR em modo de edicao: converter texto para chips
      el.setAttribute('contenteditable', 'true');
      el.innerHTML = converterTextoParaChips(htmlRef.current, pageNum, totalPages);
      el.focus();
      try {
        const sel = window.getSelection();
        if (sel) {
          sel.selectAllChildren(el);
          sel.collapseToEnd();
        }
      } catch { /* ignorar */ }
    }

    if (!isEditing && wasEditingRef.current) {
      // SAIR do modo de edicao — converter chips para texto, salvar, mostrar preview
      if (el.getAttribute('contenteditable') === 'true') {
        const conteudo = converterChipsParaTexto(el.innerHTML);
        htmlRef.current = conteudo;
        onUpdateRef.current(conteudo);
      }
      el.setAttribute('contenteditable', 'false');
      el.innerHTML = obterPreviewHTML();
      setMenuPos(null);
    }

    wasEditingRef.current = isEditing;
  }, [isEditing, obterPreviewHTML, pageNum, totalPages]);

  // Atualizar chips quando pageNum/totalPages mudam durante edicao
  useEffect(() => {
    const el = zoneRef.current;
    if (!el || !isEditing) return;
    el.querySelectorAll<HTMLElement>('[data-var="pagina"]').forEach(chip => {
      chip.textContent = String(pageNum);
    });
    el.querySelectorAll<HTMLElement>('[data-var="total"]').forEach(chip => {
      chip.textContent = String(totalPages);
    });
  }, [pageNum, totalPages, isEditing]);

  // Atualizar preview quando html muda de fora (NAO durante edicao)
  useEffect(() => {
    if (!isEditing && zoneRef.current) {
      zoneRef.current.innerHTML = obterPreviewHTML();
    }
  }, [html, isEditing, obterPreviewHTML]);

  // MutationObserver: auto-save quando DOM muda durante edicao
  useEffect(() => {
    const el = zoneRef.current;
    if (!el || !isEditing) return;
    const observer = new MutationObserver(() => salvar());
    observer.observe(el, { childList: true, subtree: true, attributes: true, characterData: true });
    return () => observer.disconnect();
  }, [isEditing, salvar]);

  // ── Drag & Drop local ───────────────────────────────────────────
  const onDragOverHandler = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDropHandler = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const arquivos = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (arquivos.length === 0) return;
    if (isEditing) {
      arquivos.forEach(arq => inserirImagemArquivo(arq));
    } else {
      onEdit();
      setTimeout(() => {
        arquivos.forEach(arq => inserirImagemArquivo(arq));
      }, 200);
    }
  }, [isEditing, inserirImagemArquivo, onEdit]);

  // ── Menu de contexto handler ──────────────────────────────────
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!isEditing) return; // so mostra menu em modo de edicao
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [isEditing]);

  return (
    <div
      className="absolute left-0 right-0 group"
      style={{
        top: ehCabecalho ? 0 : undefined,
        bottom: ehCabecalho ? undefined : 0,
        height,
        zIndex: isEditing ? 40 : (dragSobre ? 40 : 5),
      }}
      onDragOver={onDragOverHandler}
      onDrop={onDropHandler}
    >
      {/* Zona editavel */}
      <div
        ref={zoneRef}
        data-hf-zone={type}
        className={`
          w-full h-full transition-colors duration-150
          ${isEditing ? 'outline-none bg-white cursor-text' : 'cursor-pointer hover:bg-blue-50/40'}
          ${!isEditing && !html ? 'border border-dashed border-transparent group-hover:border-gray-300' : ''}
        `}
        style={{
          padding: ehCabecalho
            ? `8px ${marginRight}px 10px ${marginLeft}px`
            : `10px ${marginRight}px 8px ${marginLeft}px`,
          boxSizing: 'border-box',
          fontSize: '11px',
          fontFamily: 'Arial, sans-serif',
          lineHeight: 1.4,
          overflow: isEditing ? 'visible' : 'hidden',
          ...(isEditing ? { boxShadow: '0 0 0 2px #3b82f6' } : {}),
          ...(dragSobre ? { boxShadow: '0 0 0 2px #3b82f6', background: '#eff6ff' } : {}),
        }}
        suppressContentEditableWarning
        onClick={(e) => {
          if (!isEditing) {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          } else {
            e.stopPropagation();
            setMenuPos(null);
          }
        }}
        onContextMenu={handleContextMenu}
        onInput={() => salvar()}
        onBlur={() => salvar()}
        onMouseDown={(e) => { if (isEditing) e.stopPropagation(); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const arquivos = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
          if (arquivos.length === 0) return;
          if (isEditing) {
            arquivos.forEach(arq => inserirImagemArquivo(arq));
          } else {
            onEdit();
            setTimeout(() => {
              arquivos.forEach(arq => inserirImagemArquivo(arq));
            }, 200);
          }
        }}
        onPaste={(e) => {
          const items = Array.from(e.clipboardData?.items || []);
          const imagemItem = items.find(item => item.type.startsWith('image/'));
          if (imagemItem) {
            e.preventDefault();
            const arquivo = imagemItem.getAsFile();
            if (arquivo) inserirImagemArquivo(arquivo);
            return;
          }
          setTimeout(() => salvar(), 50);
        }}
      />

      {/* Indicador de drag */}
      {dragSobre && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ border: '2px dashed #3b82f6', borderRadius: 4, background: 'rgba(59, 130, 246, 0.08)' }}
        >
          <span className="text-xs text-blue-600 font-medium bg-white px-2 py-0.5 rounded shadow-sm">
            Solte a imagem aqui
          </span>
        </div>
      )}

      {/* Label quando vazio */}
      {!isEditing && !html && !dragSobre && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-xs text-gray-400 italic">
            Clique para editar {ehCabecalho ? 'cabecalho' : 'rodape'}
            {' '}(botao direito = opcoes)
          </span>
        </div>
      )}

      {/* Menu de contexto (substitui a barra azul) */}
      {isEditing && menuPos && (
        <div
          className="absolute z-[60] bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-600 py-1 min-w-[180px]"
          style={{ left: menuPos.x, top: menuPos.y }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
            onClick={() => { setMenuPos(null); handleInserirImagem(); }}
          >
            <ImagePlus size={14} className="text-blue-500" />
            Inserir imagem
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
            onClick={() => { setMenuPos(null); handleInserirQRCode(); }}
          >
            <QrCode size={14} className="text-purple-500" />
            Inserir QR Code
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
            onClick={() => { setMenuPos(null); handleInserirTabela(); }}
          >
            <Table size={14} className="text-green-500" />
            Inserir tabela
          </button>
          <div className="border-t border-slate-200 dark:border-slate-600 my-1" />
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
            onClick={() => { setMenuPos(null); handleInserirVariavel('pagina'); }}
          >
            <Hash size={14} className="text-orange-500" />
            {'Inserir {{pagina}}'}
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
            onClick={() => { setMenuPos(null); handleInserirVariavel('total'); }}
          >
            <Hash size={14} className="text-orange-500" />
            {'Inserir {{total}}'}
          </button>
          <div className="border-t border-slate-200 dark:border-slate-600 my-1" />
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
            onClick={() => { setMenuPos(null); salvar(); onClose(); }}
          >
            <X size={14} className="text-red-500" />
            Fechar edicao
          </button>
          {variantLabel && (
            <div className="px-3 py-1 text-[10px] text-slate-400 italic border-t border-slate-100">
              {variantLabel}
            </div>
          )}
        </div>
      )}

      {/* Linha separadora */}
      <div
        className={`absolute left-0 right-0 ${ehCabecalho ? 'bottom-0' : 'top-0'}`}
        style={{
          height: 1,
          background: isEditing ? '#3b82f6' : 'rgba(0,0,0,0.06)',
          marginLeft,
          marginRight,
        }}
      />
    </div>
  );
};
