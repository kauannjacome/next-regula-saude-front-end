/**
 * ============================================================================
 * TextEditor.tsx — Componente principal do editor de texto rico
 * ============================================================================
 *
 * VISÃO GERAL:
 *   Este é o "cérebro" do editor de texto. Ele junta todos os pedaços:
 *   toolbar (barra de ferramentas), régua, área editável, cabeçalho/rodapé,
 *   barra de status, autocomplete, etc.
 *
 * COMO FUNCIONA (resumo simples):
 *   - O usuário digita em uma DIV com contentEditable=true (é como um campo de texto gigante)
 *   - O editor simula "páginas" inserindo espaçadores invisíveis no texto
 *   - Cabeçalho e rodapé são zonas separadas que aparecem nas margens da página
 *   - Tudo é salvo como HTML puro (o mesmo formato de páginas web)
 *
 * ARQUIVOS RELACIONADOS (hooks com explicações detalhadas):
 *   - hooks/usePageSpacers.ts    → Lógica dos espaçadores de página
 *   - hooks/usePageTracking.ts   → Rastreamento de qual página está visível
 *   - hooks/useKeyboardShortcuts.ts → Atalhos de teclado (Ctrl+Z, etc.)
 *   - hooks/useHeaderFooter.ts   → Edição de cabeçalho e rodapé
 *   - hooks/useDragDrop.ts       → Arrastar e soltar imagens
 *   - hooks/useExportDocument.ts → Exportação para PDF/DOCX/HTML/TXT
 *   - hooks/useImportDocument.ts → Importação de arquivos
 *   - hooks/useSerialize.ts      → Empacotamento do documento para salvar
 *   - hooks/useInsertions.ts     → Inserção de imagens, links, datas, etc.
 *
 * SEÇÕES DESTE ARQUIVO:
 *   1. IMPORTS E CONSTANTES
 *   2. ESTADO INICIAL (variáveis do editor)
 *   3. ESPAÇADORES DE PÁGINA (simulação visual de páginas)
 *   4. ESTATÍSTICAS (contagem de palavras, páginas)
 *   5. HISTÓRICO (desfazer/refazer)
 *   6. CLIQUES E SELEÇÃO (imagens, tabelas, QR Codes)
 *   7. INICIALIZAÇÃO (carregar conteúdo inicial)
 *   8. ATALHOS DE TECLADO
 *   9. SCROLL E PÁGINA ATUAL
 *  10. CABEÇALHO E RODAPÉ
 *  11. DRAG & DROP (arrastar e soltar)
 *  12. FORMATAÇÃO ABNT
 *  13. EXPORTAÇÃO (PDF, DOCX, HTML, TXT)
 *  14. IMPORTAÇÃO
 *  15. SERIALIZAÇÃO (salvar documento)
 *  16. INSERÇÕES (imagem, link, data, sumário)
 *  17. CONFIGURAÇÕES (página, margens, zoom, colunas)
 *  18. API PÚBLICA (funções expostas para quem usa o componente)
 *  19. RENDERIZAÇÃO (HTML/JSX do componente)
 * ============================================================================
 */

'use client';

// ════════════════════════════════════════════════════════════════════
// SEÇÃO 1: IMPORTS E CONSTANTES
// Aqui importamos todas as bibliotecas e componentes necessários
// ════════════════════════════════════════════════════════════════════

import React, { forwardRef, useImperativeHandle, useRef, useCallback, useEffect, useState } from 'react';
import Toolbar from './toolbar/Toolbar';
import StatusBar from './StatusBar';
import { HorizontalRuler, VerticalRuler } from './Ruler';
import Autocomplete from './Autocomplete';
import { useEditorState } from './hooks/useEditorState';
import { useHistory } from './hooks/useHistory';
import { useFormatting } from './hooks/useFormatting';
import { PAGE_SIZES, DEFAULT_MARGINS } from './constants';
import type {
  EditorProps,
  EditorHandle,
  WordStats,
  Marker,
  SerializedDocument,
  ExportResult,
  DatabaseTable,
  QuickText,
  PageSizeKey,
  Margins,
} from './types';
import './styles.css';
import { Resizer } from './Resizer';
import { HeaderFooterZone } from './HeaderFooterZone';
import FindReplace from './FindReplace';

/** Valor padrão vazio para esquema de banco de dados */
const EMPTY_DB: DatabaseTable[] = [];
/** Valor padrão vazio para textos rápidos */
const EMPTY_QT: QuickText[] = [];
/** Expressão regular que encontra os espaçadores no HTML */
const REGEX_ESPACADOR = /<div[^>]*\bclass="page-spacer"[^>]*><\/div>/g;

/** Escapa caracteres especiais de HTML para prevenir XSS */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const TextEditor = forwardRef<EditorHandle, EditorProps>(
  (
    {
      title = 'Documento sem titulo',
      initialContent = '',
      onChange,
      onStats,
      onReady,
      database = EMPTY_DB,
      quickTexts = EMPTY_QT,
      readOnly = false,
      darkMode = false,
      pageConfig,
      className,
    },
    ref
  ) => {
    // ════════════════════════════════════════════════════════════════
    // SEÇÃO 2: ESTADO INICIAL
    // Todas as variáveis que o editor usa para funcionar
    // ════════════════════════════════════════════════════════════════

    /** Referência para a DIV editável principal (onde o usuário digita) */
    const editorRef = useRef<HTMLDivElement>(null);
    /** Referência para o container da "folha de papel" visual */
    const pageContainerRef = useRef<HTMLDivElement>(null);
    /** Callbacks como refs para evitar re-renders desnecessários */
    const onChangeRef = useRef(onChange);
    const onStatsRef = useRef(onStats);
    const onReadyRef = useRef(onReady);
    /** Esquema do banco de dados (tabelas e campos disponíveis para variáveis) */
    const [databaseSchema, setDatabaseSchema] = useState<DatabaseTable[]>(database);
    /** Textos rápidos que o usuário pode inserir com atalhos */
    const [quickTextsList, setQuickTextsList] = useState<QuickText[]>(quickTexts);
    /** Título do documento (usado no nome do arquivo ao exportar) */
    const [docTitle] = useState(title);
    /** Estatísticas do documento: palavras, caracteres, páginas, etc. */
    const [stats, setStats] = useState<WordStats>({
      words: 0, characters: 0, charactersNoSpaces: 0, paragraphs: 0, lines: 0, pages: 1,
    });
    /** Elemento selecionado pelo clique (imagem, tabela ou QR Code) */
    const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
    /** Tipo do elemento selecionado (para mostrar a aba correta na toolbar) */
    const [contextType, setContextType] = useState<'Imagem' | 'Tabela' | 'QRCode' | null>(null);
    /** Qual zona está sendo editada: 'header' (cabeçalho), 'footer' (rodapé) ou null (corpo) */
    const [editingHF, setEditingHF] = useState<'header' | 'footer' | null>(null);
    /** Qual zona está destacada durante o arrastar e soltar */
    const [dragZonaAtiva, setDragZonaAtiva] = useState<'header' | 'body' | 'footer' | null>(null);

    /** Flag para garantir que o callback onReady só é chamado uma vez */
    const readyFired = useRef(false);

    // Manter referências de callbacks sempre atualizadas
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
    useEffect(() => { onStatsRef.current = onStats; }, [onStats]);
    useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

    // Estado geral do editor (margens, zoom, fonte, tema escuro, etc.)
    // Ver: hooks/useEditorState.ts para detalhes
    const { state, stateRef, set, setStyles, setMargins } = useEditorState({
      darkMode,
      pageSize: pageConfig?.size ?? 'A4',
      pageOrientation: pageConfig?.orientation ?? 'portrait',
      margins: { ...DEFAULT_MARGINS, ...pageConfig?.margins },
      columns: pageConfig?.columns ?? 1,
      pageBackground: pageConfig?.background ?? '#ffffff',
      headerHTML: pageConfig?.headerHTML ?? '',
      footerHTML: pageConfig?.footerHTML ?? '',
      watermarkText: pageConfig?.watermarkText ?? '',
      watermarkOpacity: pageConfig?.watermarkOpacity ?? 0.15,
      primeiraPaginaDiferente: pageConfig?.primeiraPaginaDiferente ?? false,
      parImparDiferente: pageConfig?.parImparDiferente ?? false,
      primeiraPaginaHeaderHTML: pageConfig?.primeiraPaginaHeaderHTML ?? '',
      primeiraPaginaFooterHTML: pageConfig?.primeiraPaginaFooterHTML ?? '',
      paginasParesHeaderHTML: pageConfig?.paginasParesHeaderHTML ?? '',
      paginasParesFooterHTML: pageConfig?.paginasParesFooterHTML ?? '',
    });

    // ════════════════════════════════════════════════════════════════
    // SEÇÃO 10: CABEÇALHO E RODAPÉ
    // Lógica para decidir qual HTML mostrar em cada página
    // Ver: hooks/useHeaderFooter.ts para explicação detalhada
    // ════════════════════════════════════════════════════════════════

    /**
     * Decide qual HTML de cabeçalho/rodapé usar para cada página.
     * Prioridade: primeira página > páginas pares > padrão
     */
    const resolverHF = useCallback((tipo: 'header' | 'footer', pagina: number): string => {
      const s = stateRef.current;
      if (tipo === 'header') {
        if (s.primeiraPaginaDiferente && pagina === 1) return s.primeiraPaginaHeaderHTML;
        if (s.parImparDiferente && pagina % 2 === 0) return s.paginasParesHeaderHTML;
        return s.headerHTML;
      } else {
        if (s.primeiraPaginaDiferente && pagina === 1) return s.primeiraPaginaFooterHTML;
        if (s.parImparDiferente && pagina % 2 === 0) return s.paginasParesFooterHTML;
        return s.footerHTML;
      }
    }, [stateRef]);

    // ════════════════════════════════════════════════════════════════
    // SEÇÃO 5: HISTÓRICO (desfazer/refazer)
    // Ver: hooks/useHistory.ts
    // ════════════════════════════════════════════════════════════════

    /** Captura o estado atual de todos os cabeçalhos/rodapés para o histórico */
    const getHFState = useCallback(() => ({
      header: stateRef.current.headerHTML,
      footer: stateRef.current.footerHTML,
      primeiraPaginaHeader: stateRef.current.primeiraPaginaHeaderHTML,
      primeiraPaginaFooter: stateRef.current.primeiraPaginaFooterHTML,
      paginasParesHeader: stateRef.current.paginasParesHeaderHTML,
      paginasParesFooter: stateRef.current.paginasParesFooterHTML,
    }), [stateRef]);
    const history = useHistory(editorRef, 50, getHFState);

    /** Hook de formatação: negrito, itálico, fonte, tamanho, etc. */
    const formatting = useFormatting(editorRef);

    // Calcular dimensões da página baseado no tamanho e orientação
    const pageSize = PAGE_SIZES[state.pageSize] || PAGE_SIZES.A4;
    const isLandscape = state.pageOrientation === 'landscape';
    const pageW = isLandscape ? pageSize.h : pageSize.w;
    const pageH = isLandscape ? pageSize.w : pageSize.h;

    /** Extrai texto puro de uma string HTML (usado para contar palavras no cabeçalho/rodapé) */
    const extractTextFromHTML = useCallback((html: string): string => {
      if (!html) return '';
      const temp = document.createElement('div');
      temp.innerHTML = html;
      return temp.innerText || temp.textContent || '';
    }, []);

    /** Atualiza o sumário (índice) existente, varrendo os títulos do documento */
    const refreshTOC = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      const tocContainer = el.querySelector('.toc-container');
      if (!tocContainer) return;

      const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let tocHTML = '<div class="toc-title">Sumario</div>';
      headings.forEach((h, i) => {
        const level = parseInt(h.tagName[1]);
        const text = h.textContent || '';
        const id = `heading-${i}`;
        h.id = id;
        tocHTML += `<a href="#${id}" style="padding-left:${(level - 1) * 16}px" class="toc-item">${text}</a>`;
      });
      tocContainer.innerHTML = tocHTML;
    }, []);

    // ════════════════════════════════════════════════════════════════
    // SEÇÃO 3: ESPAÇADORES DE PÁGINA
    // O editor usa UMA ÚNICA DIV editável. Para simular "folhas de papel",
    // inserimos elementos invisíveis chamados "espaçadores" que empurram
    // o conteúdo para baixo, como se fosse uma quebra de página real.
    // Ver: hooks/usePageSpacers.ts para explicação detalhada
    // ════════════════════════════════════════════════════════════════

    /** Retorna innerHTML sem os divs de espaçador */
    const removerEspacadores = useCallback((html: string): string => html.replace(REGEX_ESPACADOR, ''), []);

    /** Retorna o innerHTML limpo do editor (sem espaçadores) */
    const obterHTMLLimpo = useCallback((): string => {
      const el = editorRef.current;
      if (!el) return '';
      return removerEspacadores(el.innerHTML);
    }, [removerEspacadores]);

    /**
     * Percorre os filhos diretos do contentEditable e insere divs
     * espaçadores invisíveis nas posições de quebra de pagina, empurrando
     * o texto para além do overlay de rodape/gap/cabeçalho em vez de
     * fluir por trás dele.
     *
     * Retorna a contagem de paginas resultante.
     */
    const atualizarEspacadores = useCallback((): number => {
      const el = editorRef.current;
      if (!el) return 1;

      const mTop = stateRef.current.margins.top;
      const mBot = stateRef.current.margins.bottom;
      const conteudoPorPagina = pageH - mTop - mBot;
      const alturaGap = mBot + 8 + mTop; // rodape + gap da mesa + cabeçalho

      if (conteudoPorPagina <= 0) return 1;

      // 1. Remover espaçadores existentes
      el.querySelectorAll('.page-spacer').forEach(s => s.remove());

      // 2. Se tudo cabe em uma pagina, nada a fazer
      if (el.scrollHeight <= conteudoPorPagina + 2) return 1; // +2 arredondamento

      // 3. Percorrer filhos e inserir espaçadores nas quebras de pagina
      let acumuladoY = 0;
      const filhos = Array.from(el.children);

      for (const filho of filhos) {
        const filhoEl = filho as HTMLElement;
        if (!filhoEl.offsetHeight) continue; // pular elementos com altura zero

        const alturaFilho = filhoEl.offsetHeight;

        if (acumuladoY > 0 && acumuladoY + alturaFilho > conteudoPorPagina) {
          // Este filho cruzaria a quebra de pagina — inserir espaçador
          const restante = conteudoPorPagina - acumuladoY;
          const espacador = document.createElement('div');
          espacador.className = 'page-spacer';
          espacador.setAttribute('contenteditable', 'false');
          espacador.setAttribute('data-spacer', 'true');
          espacador.style.cssText =
            `height:${restante + alturaGap}px;` +
            'width:100%;user-select:none;margin:0;padding:0;border:none;' +
            'box-sizing:border-box;';
          el.insertBefore(espacador, filhoEl);
          acumuladoY = 0;
        }

        acumuladoY += alturaFilho;

        // Lidar com elementos maiores que uma pagina (não podem ser divididos)
        while (acumuladoY > conteudoPorPagina) {
          acumuladoY -= conteudoPorPagina;
        }
      }

      return el.querySelectorAll('.page-spacer').length + 1;
    }, [pageH, stateRef]);

    // ════════════════════════════════════════════════════════════════
    // SEÇÃO 4: ESTATÍSTICAS (contagem de palavras, caracteres, páginas)
    // ════════════════════════════════════════════════════════════════

    /** Recalcula todas as estatísticas e atualiza os espaçadores de página */
    const updateStats = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;

      // Include header and footer text in word/character count
      const bodyTxt = el.innerText || '';
      const headerTxt = extractTextFromHTML(stateRef.current.headerHTML);
      const footerTxt = extractTextFromHTML(stateRef.current.footerHTML);
      const txt = [bodyTxt, headerTxt, footerTxt].filter(Boolean).join('\n');

      const words = txt.trim() === '' ? 0 : txt.trim().split(/\s+/).length;
      const characters = txt.length;
      const charactersNoSpaces = txt.replace(/\s/g, '').length;
      const paragraphs = (txt.match(/\n\n/g) || []).length + 1;
      const lines = (txt.match(/\n/g) || []).length + 1;

      // Insert page spacers and derive page count from them
      const pages = atualizarEspacadores();

      // Update page container height
      if (pageContainerRef.current) {
        const totalHeight = pages * pageH + Math.max(0, pages - 1) * 8;
        pageContainerRef.current.style.minHeight = totalHeight + 'px';
      }

      const newStats = { words, characters, charactersNoSpaces, paragraphs, lines, pages };
      setStats(newStats);
      onStatsRef.current?.(newStats);

      // Auto-refresh TOC if one exists
      refreshTOC();
    }, [pageH, stateRef, extractTextFromHTML, refreshTOC, atualizarEspacadores]);

    /** Aplica um snapshot do histórico (restaura corpo + cabeçalho/rodapé após desfazer/refazer) */
    const applySnapshot = useCallback((snapshot: { body: string; header: string; footer: string; primeiraPaginaHeader?: string; primeiraPaginaFooter?: string; paginasParesHeader?: string; paginasParesFooter?: string } | false) => {
      if (!snapshot) return;
      // Body is already restored by useHistory; restore header/footer + variants
      set('headerHTML', snapshot.header);
      set('footerHTML', snapshot.footer);
      if (snapshot.primeiraPaginaHeader !== undefined) set('primeiraPaginaHeaderHTML', snapshot.primeiraPaginaHeader);
      if (snapshot.primeiraPaginaFooter !== undefined) set('primeiraPaginaFooterHTML', snapshot.primeiraPaginaFooter);
      if (snapshot.paginasParesHeader !== undefined) set('paginasParesHeaderHTML', snapshot.paginasParesHeader);
      if (snapshot.paginasParesFooter !== undefined) set('paginasParesFooterHTML', snapshot.paginasParesFooter);
      updateStats();
      onChangeRef.current?.(obterHTMLLimpo());
    }, [set, updateStats, obterHTMLLimpo]);

    /** Chamado toda vez que o usuário digita algo: salva no histórico e atualiza estatísticas */
    const handleInput = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      const html = obterHTMLLimpo();
      history.pushDebounced(html);
      onChangeRef.current?.(html);
      updateStats();

      // Guard: se temos mais de 1 pagina mas nenhum spacer, reinstalar
      if (stats.pages > 1 && !el.querySelector('.page-spacer')) {
        atualizarEspacadores();
      }
    }, [history, updateStats, obterHTMLLimpo, stats.pages, atualizarEspacadores]);

    // ════════════════════════════════════════════════════════════════
    // SEÇÃO 6: CLIQUES E SELEÇÃO
    // Detecta quando o usuário clica em imagens, tabelas ou QR Codes
    // ════════════════════════════════════════════════════════════════

    /** Handler de clique: detecta se clicou em imagem, tabela ou QR Code */
    const handleEditorClick = useCallback((e: React.MouseEvent) => {
      const target = e.target as HTMLElement;

      // Ignore clicks inside header/footer zones - they handle their own events
      if (target.closest('[data-hf-zone]')) {
        return;
      }

      // 1. Resizer Logic
      if (target.closest('.resizer-handle') || target.closest('.et-resizer-overlay')) {
        return;
      }

      // Check for "behind text" images under the click point
      // These have z-index: 1 so text steals clicks from them
      const el = editorRef.current;
      if (el && target.tagName !== 'IMG') {
        const behindImages = el.querySelectorAll('img[data-wrap="behind"]');
        for (const img of Array.from(behindImages)) {
          const rect = img.getBoundingClientRect();
          if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
            const htmlImg = img as HTMLElement;
            if (!htmlImg.style.width || htmlImg.style.width === 'auto') {
              htmlImg.style.width = htmlImg.offsetWidth + 'px';
            }
            if (!htmlImg.style.height || htmlImg.style.height === 'auto') {
              htmlImg.style.height = htmlImg.offsetHeight + 'px';
            }
            setSelectedElement(htmlImg);
            setContextType('Imagem');
            set('activeTab', 'Imagem');
            window.getSelection()?.removeAllRanges();
            return;
          }
        }
      }

      // Images / QRCodes
      if (target.tagName === 'IMG' || target.classList.contains('qr-code')) {
        // Lock in explicit pixel dimensions to prevent size drift on DOM manipulation
        if (!target.style.width || target.style.width === 'auto') {
          target.style.width = target.offsetWidth + 'px';
        }
        if (!target.style.height || target.style.height === 'auto') {
          target.style.height = target.offsetHeight + 'px';
        }
        setSelectedElement(target);
        setContextType(target.classList.contains('qr-code') ? 'QRCode' : 'Imagem');
        set('activeTab', target.classList.contains('qr-code') ? 'QRCode' : 'Imagem');
        // Prevent browser from selecting/collapsing the image
        window.getSelection()?.removeAllRanges();
        return;
      }

      // Tables - click inside TD but select TABLE
      const table = target.closest('table');
      if (table) {
        setSelectedElement(table as HTMLElement);
        setContextType('Tabela');
        set('activeTab', 'Tabela');
        return;
      }

      // Clear selection if clicked elsewhere in editable area
      const isEditorClick = target.closest('[contentEditable="true"]');
      if (isEditorClick) {
        setSelectedElement(null);
        setContextType(null);
        if (['Imagem', 'Tabela', 'QRCode'].includes(state.activeTab)) {
          set('activeTab', 'Inicio');
        }
      }
    }, [set, state.activeTab]);

    // ════════════════════════════════════════════════════════════════
    // SEÇÃO 7: INICIALIZAÇÃO
    // Carrega o conteúdo inicial no editor quando o componente aparece
    // na tela pela primeira vez. Também configura o histórico e avisa
    // quem estiver usando o componente que ele está pronto.
    // ════════════════════════════════════════════════════════════════

    /** Efeito de inicialização: roda UMA VEZ quando o componente monta */
    useEffect(() => {
      const el = editorRef.current;
      if (!el) return;
      if (initialContent) {
        el.innerHTML = initialContent;
      } else {
        // Ensure editor has at least one paragraph for cursor placement
        el.innerHTML = '<p><br></p>';
      }
      history.init();
      requestAnimationFrame(() => {
        updateStats();
        if (!readyFired.current) {
          readyFired.current = true;
          onReadyRef.current?.();
        }
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Proteção de espaçadores contra exclusão acidental.
     * Usa um MutationObserver (vigia de mudanças no DOM) para detectar
     * quando um espaçador é removido (ex: Ctrl+A + Delete) e reinstalá-lo.
     */
    useEffect(() => {
      const el = editorRef.current;
      if (!el) return;
      const isAtualizando = { current: false };
      const observer = new MutationObserver((mutations) => {
        if (isAtualizando.current) return;
        let removido = false;
        for (const m of mutations) {
          for (const node of Array.from(m.removedNodes)) {
            if (node instanceof HTMLElement && node.classList.contains('page-spacer')) {
              removido = true;
              break;
            }
          }
          if (removido) break;
        }
        if (removido) {
          isAtualizando.current = true;
          requestAnimationFrame(() => {
            atualizarEspacadores();
            isAtualizando.current = false;
          });
        }
      });
      observer.observe(el, { childList: true });
      return () => observer.disconnect();
    }, [atualizarEspacadores]);

    // ════════════════════════════════════════════════════════════════
    // SEÇÃO 8: ATALHOS DE TECLADO
    // Captura teclas especiais: ESC (sair de seleção/cabeçalho),
    // Delete/Backspace (apagar elemento selecionado), Tab (tabulação),
    // Ctrl+Z (desfazer), Ctrl+Y (refazer), Ctrl+H (buscar e substituir)
    // Ver: hooks/useKeyboardShortcuts.ts para explicação detalhada
    // ════════════════════════════════════════════════════════════════

    /** Listener global de teclado para atalhos */
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        // ESC: exit context or header/footer editing
        if (e.key === 'Escape') {
          if (editingHF) {
            // ESC in HF is handled by HeaderFooterZone itself
            return;
          }
          if (selectedElement) {
            e.preventDefault();
            setSelectedElement(null);
            setContextType(null);
            if (['Imagem', 'Tabela', 'QRCode'].includes(state.activeTab)) {
              set('activeTab', 'Inicio');
            }
            return;
          }
        }

        // Delete/Backspace: remove selected element
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
          // Only remove if focus is NOT in a text input/textarea
          const active = document.activeElement;
          const isTyping = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';
          if (!isTyping) {
            e.preventDefault();
            selectedElement.remove();
            setSelectedElement(null);
            setContextType(null);
            set('activeTab', 'Inicio');
            updateStats();
            const htmlLimpo = obterHTMLLimpo();
            history.pushState(htmlLimpo);
            onChangeRef.current?.(htmlLimpo);
            return;
          }
        }

        // TAB: inserir tabulacao em vez de sair do editor
        if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
          const el = editorRef.current;
          if (el && document.activeElement === el) {
            e.preventDefault();
            document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
            return;
          }
        }

        if (e.ctrlKey || e.metaKey) {
          if (e.key === 'h' || e.key === 'H') {
            e.preventDefault();
            setFindReplaceOpen(prev => !prev);
            return;
          }
          if (e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            applySnapshot(history.undo());
          } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
            e.preventDefault();
            applySnapshot(history.redo());
          }
        }
      };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }, [history, updateStats, selectedElement, editingHF, state.activeTab, set, applySnapshot, obterHTMLLimpo]);

    /** Sincroniza o atributo contentEditable diretamente no DOM (evita bug do React 19) */
    useEffect(() => {
      const el = editorRef.current;
      if (el) {
        el.setAttribute('contenteditable', (!readOnly && !editingHF) ? 'true' : 'false');
      }
    }, [readOnly, editingHF]);

    // ════════════════════════════════════════════════════════════════
    // SEÇÃO 9: SCROLL E PÁGINA ATUAL
    // Detecta qual página está visível baseado na posição do scroll.
    // Usa "debounce" (atraso de 50ms) para não recalcular a cada pixel.
    // Ver: hooks/usePageTracking.ts para explicação detalhada
    // ════════════════════════════════════════════════════════════════

    /** Referência para o container que tem a barra de rolagem */
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const calcularPagina = () => {
        const scrollTop = container.scrollTop;
        const conteudoPorPagina = pageH - state.margins.top - state.margins.bottom;
        const alturaGap = state.margins.bottom + 8 + state.margins.top;
        const alturaPaginaTotal = conteudoPorPagina + alturaGap;
        const escalaZoom = state.zoom / 100;
        const pagina = Math.min(stats.pages, Math.max(1, Math.floor(scrollTop / (alturaPaginaTotal * escalaZoom)) + 1));

        // ********** EXPLICAÇÃO DO "SCROLL BUFFER/BUG":
        // O cálculo acima depende de um layout perfeito. Se o zoom mudar ou um espaçador sumir,
        // o cálculo erra qual página é.
        // ********** CORREÇÃO SUGERIDA:
        // Usar IntersectionObserver nos elementos de quebra de página (page-spacer) para saber exatamente
        // qual página está visível, em vez de calcular baseado em pixels de scroll.

        setCurrentPage(pagina);
      };
      const handleScroll = () => {
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = setTimeout(calcularPagina, 50);
      };
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        container.removeEventListener('scroll', handleScroll);
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      };
    }, [pageH, state.margins, state.zoom, stats.pages]);

    /** Sincroniza propriedade de tema escuro vinda de fora */
    useEffect(() => { set('darkMode', darkMode); }, [darkMode, set]);
    /** Sincroniza esquema de banco de dados vindo de fora */
    useEffect(() => { setDatabaseSchema(database); }, [database]);
    /** Sincroniza textos rápidos vindos de fora */
    useEffect(() => { setQuickTextsList(quickTexts); }, [quickTexts]);

    /** Página atual visível na tela (começa em 1) */
    const [currentPage, setCurrentPage] = useState(1);
    /** Controla se o painel de Buscar/Substituir está aberto */
    const [findReplaceOpen, setFindReplaceOpen] = useState(false);

    // ════════════════════════════════════════════════════════════════
    // SEÇÃO 10 (continuação): EDIÇÃO DE CABEÇALHO E RODAPÉ
    // Funções para abrir, fechar e salvar cabeçalho/rodapé.
    // Quando o usuário clica na zona do cabeçalho, ela vira editável.
    // Quando clica fora, salva e volta ao corpo principal.
    // ════════════════════════════════════════════════════════════════

    /** Abre a edição do cabeçalho */
    const handleEditHeader = useCallback(() => {
      setEditingHF('header');
    }, []);

    /** Abre a edição do rodapé */
    const handleEditFooter = useCallback(() => {
      setEditingHF('footer');
    }, []);

    /**
     * Determina qual campo de estado salvar para cabeçalho/rodapé.
     * Ex: se "primeira página diferente" está ativo, salva em primeiraPaginaHeaderHTML
     * em vez de headerHTML.
     */
    const resolverCampoHF = useCallback((tipo: 'header' | 'footer'): keyof typeof state => {
      const s = stateRef.current;
      // Editable zone is always page 1 view
      if (tipo === 'header') {
        if (s.primeiraPaginaDiferente) return 'primeiraPaginaHeaderHTML';
        return 'headerHTML';
      } else {
        if (s.primeiraPaginaDiferente) return 'primeiraPaginaFooterHTML';
        return 'footerHTML';
      }
    }, [stateRef]);

    /**
     * Fecha a edição de cabeçalho/rodapé.
     * Antes de fechar, lê o conteúdo diretamente do DOM como rede de segurança
     * (converte chips visuais de volta para texto {{pagina}}/{{total}}).
     */
    const handleCloseHF = useCallback(() => {
      const chipToText = (html: string) => html
        .replace(/<span[^>]*data-var="pagina"[^>]*>[\s\S]*?<\/span>/g, '{{pagina}}')
        .replace(/<span[^>]*data-var="total"[^>]*>[\s\S]*?<\/span>/g, '{{total}}');
      const zones = document.querySelectorAll('[data-hf-zone]');
      zones.forEach(zone => {
        if (zone.getAttribute('contenteditable') === 'true') {
          const tipo = zone.getAttribute('data-hf-zone') as 'header' | 'footer';
          const conteudo = chipToText((zone as HTMLElement).innerHTML);
          if (tipo) {
            const campo = resolverCampoHF(tipo);
            set(campo as any, conteudo);
          }
        }
      });

      setEditingHF(null);
      // Return focus to main editor after closing header/footer
      requestAnimationFrame(() => {
        const el = editorRef.current;
        if (!el) return;
        el.setAttribute('contenteditable', 'true');
        el.focus();
        const sel = window.getSelection();
        if (sel && sel.rangeCount === 0) {
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
          sel.addRange(range);
        }
      });
    }, [set, resolverCampoHF]);

    /** Listener global de clique: fecha edição de cabeçalho/rodapé ao clicar fora */
    useEffect(() => {
      if (!editingHF) return;
      const handler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // Se clicou dentro de uma zona header/footer, manter editando
        if (target.closest('[data-hf-zone]')) return;
        // Se clicou no menu de contexto do header/footer, manter editando
        if (target.closest('.hf-close-bar')) return;
        if (target.closest('[class*="z-[60]"]')) return;
        // Se clicou no toolbar/header do editor, manter editando
        if (target.closest('.et-editor-root > header')) return;
        handleCloseHF();
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [editingHF, handleCloseHF]);

    /** Salva alterações no cabeçalho (chamado quando o usuário digita no cabeçalho) */
    const handleUpdateHeader = useCallback((html: string) => {
      const campo = resolverCampoHF('header');
      set(campo as any, html);
      const s = stateRef.current;
      history.pushSnapshotDebounced({
        body: obterHTMLLimpo(),
        header: campo === 'headerHTML' ? html : s.headerHTML,
        footer: s.footerHTML,
        primeiraPaginaHeader: campo === 'primeiraPaginaHeaderHTML' ? html : s.primeiraPaginaHeaderHTML,
        primeiraPaginaFooter: s.primeiraPaginaFooterHTML,
        paginasParesHeader: s.paginasParesHeaderHTML,
        paginasParesFooter: s.paginasParesFooterHTML,
      });
    }, [set, history, stateRef, obterHTMLLimpo, resolverCampoHF]);

    /** Salva alterações no rodapé (chamado quando o usuário digita no rodapé) */
    const handleUpdateFooter = useCallback((html: string) => {
      const campo = resolverCampoHF('footer');
      set(campo as any, html);
      const s = stateRef.current;
      history.pushSnapshotDebounced({
        body: obterHTMLLimpo(),
        header: s.headerHTML,
        footer: campo === 'footerHTML' ? html : s.footerHTML,
        primeiraPaginaHeader: s.primeiraPaginaHeaderHTML,
        primeiraPaginaFooter: campo === 'primeiraPaginaFooterHTML' ? html : s.primeiraPaginaFooterHTML,
        paginasParesHeader: s.paginasParesHeaderHTML,
        paginasParesFooter: s.paginasParesFooterHTML,
      });
    }, [set, history, stateRef, obterHTMLLimpo, resolverCampoHF]);

    // ════════════════════════════════════════════════════════════════
    // SEÇÃO 11: DRAG & DROP (arrastar e soltar)
    // Permite arrastar imagens do computador e soltar no editor.
    // Detecta automaticamente se o mouse está sobre o cabeçalho,
    // corpo ou rodapé e insere a imagem no lugar correto.
    // Ver: hooks/useDragDrop.ts para explicação detalhada
    // ════════════════════════════════════════════════════════════════

    /**
     * Detecta em qual zona (cabeçalho/corpo/rodapé) o mouse está,
     * baseado na posição vertical (Y) do cursor.
     */
    const detectarZonaDrag = useCallback((clientY: number): 'header' | 'body' | 'footer' => {
      const container = pageContainerRef.current;
      if (!container) return 'body';
      const rect = container.getBoundingClientRect();
      const zoom = stateRef.current.zoom / 100;
      const relativeY = (clientY - rect.top) / zoom;
      if (relativeY < stateRef.current.margins.top) return 'header';
      if (relativeY > rect.height / zoom - stateRef.current.margins.bottom) return 'footer';
      return 'body';
    }, [stateRef]);

    /** Quando algo está sendo arrastado sobre a página: permite o drop e destaca a zona */
    const handleDragOverPagina = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      const zona = detectarZonaDrag(e.clientY);
      setDragZonaAtiva(zona);
    }, [detectarZonaDrag]);

    /** Quando o item arrastado sai da página: remove o destaque */
    const handleDragLeavePagina = useCallback((e: React.DragEvent) => {
      const related = e.relatedTarget as Node | null;
      const container = e.currentTarget as HTMLElement;
      if (!related || !container.contains(related)) {
        setDragZonaAtiva(null);
      }
    }, []);

    /** Lê um arquivo de imagem e insere no corpo do editor como base64 */
    const inserirImagemNoEditor = useCallback((arquivo: File) => {
      const leitor = new FileReader();
      leitor.onload = (ev) => {
        const src = ev.target?.result as string;
        const el = editorRef.current;
        if (!el) return;
        el.focus();
        const imgHTML = `<img src="${src}" style="max-width:100%;height:auto;" data-wrap="inline" />`;
        document.execCommand('insertHTML', false, imgHTML);
        handleInput();
      };
      leitor.readAsDataURL(arquivo);
    }, [handleInput]);

    /**
     * Quando o usuário solta um arquivo na página.
     * Detecta a zona (cabeçalho/corpo/rodapé) e insere a imagem lá.
     */
    const handleDropPagina = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      const zona = detectarZonaDrag(e.clientY);
      setDragZonaAtiva(null);

      const arquivos = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (arquivos.length === 0) return;

      if (zona === 'header' || zona === 'footer') {
        // Ativar edicao do header/footer se necessario
        const tipoHF = zona;
        if (editingHF !== tipoHF) {
          setEditingHF(tipoHF);
        }
        // Inserir imagem na zona HF apos ativacao
        setTimeout(() => {
          const hfZone = document.querySelector(`[data-hf-zone="${tipoHF}"]`) as HTMLElement | null;
          if (!hfZone) return;
          arquivos.forEach(arq => {
            const leitor = new FileReader();
            leitor.onload = (ev) => {
              const src = ev.target?.result as string;
              const img = document.createElement('img');
              img.src = src;
              img.style.maxWidth = '100%';
              img.style.height = 'auto';
              img.style.objectFit = 'contain';
              hfZone.appendChild(img);
              // Trigger save
              const inputEvent = new Event('input', { bubbles: true });
              hfZone.dispatchEvent(inputEvent);
            };
            leitor.readAsDataURL(arq);
          });
        }, 150);
      } else {
        // Body: posicionar cursor e inserir
        const el = editorRef.current;
        if (!el) return;
        el.focus();
        // Tentar posicionar cursor no ponto do drop
        if (document.caretRangeFromPoint) {
          const range = document.caretRangeFromPoint(e.clientX, e.clientY);
          if (range) {
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        }
        arquivos.forEach(arq => inserirImagemNoEditor(arq));
      }
    }, [detectarZonaDrag, editingHF, inserirImagemNoEditor]);

    // ════════════════════════════════════════════════════════════════
    // SEÇÃO 12: FORMATAÇÃO ABNT
    // Aplica as regras da ABNT (Associação Brasileira de Normas Técnicas):
    // fonte Arial 12pt, margens padrão, espaçamento 1.5, texto justificado.
    // Pula células de tabela e itens de lista (que têm regras próprias).
    // ════════════════════════════════════════════════════════════════

    /** Aplica formatação ABNT ao documento inteiro */
    const applyABNT = useCallback(() => {
      setStyles('fontFamily', 'Arial');
      setStyles('fontSize', 12);
      setMargins({ left: 113, right: 75, top: 113, bottom: 75 });
      const el = editorRef.current;
      if (el) {
        el.style.lineHeight = '1.5';
        formatting.setFontFamily('Arial');
        formatting.setFontSize(12);
        // Apply text formatting only to block-level text elements, not tables or lists
        const blocks = el.querySelectorAll('p, h1, h2, h3, h4, h5, h6, blockquote');
        blocks.forEach((block) => {
          const htmlBlock = block as HTMLElement;
          // Skip elements inside tables or lists
          if (htmlBlock.closest('table') || htmlBlock.closest('ul') || htmlBlock.closest('ol')) return;
          htmlBlock.style.textAlign = 'justify';
          htmlBlock.style.textIndent = '47px';
          htmlBlock.style.lineHeight = '1.5';
        });
        // Set list items to justified but NO text-indent (breaks list markers)
        const listItems = el.querySelectorAll('li');
        listItems.forEach((li) => {
          const htmlLi = li as HTMLElement;
          if (htmlLi.closest('table')) return;
          htmlLi.style.textAlign = 'justify';
          htmlLi.style.textIndent = '0';
          htmlLi.style.lineHeight = '1.5';
        });
        // Reset table cells to no indent
        const cells = el.querySelectorAll('td, th');
        cells.forEach((cell) => {
          (cell as HTMLElement).style.textIndent = '0';
        });
      }
    }, [setStyles, setMargins, formatting]);

    // ════════════════════════════════════════════════════════════════
    // SEÇÃO 13: EXPORTAÇÃO (PDF, DOCX, HTML, TXT)
    // Gera arquivos para download. O PDF é o mais complexo:
    // 1. Clona o conteúdo do editor
    // 2. Renderiza como imagem com html2canvas
    // 3. Fatia em páginas e monta o PDF com jsPDF
    // 4. Adiciona cabeçalho/rodapé em cada página
    // Ver: hooks/useExportDocument.ts para explicação detalhada
    // ════════════════════════════════════════════════════════════════

    /** Flag que indica se uma exportação está em andamento (mostra loading) */
    const [isExporting, setIsExporting] = useState(false);

    /**
     * Renderiza o HTML de um cabeçalho/rodapé como imagem PNG.
     * Cria um elemento temporário fora da tela, renderiza com html2canvas,
     * e retorna a imagem em formato base64.
     */
    const renderHFToImage = useCallback(async (html: string, width: number, height: number, type: 'header' | 'footer') => {
      if (!html) return null;

      try {
        const html2canvasMod = await import('html2canvas');
        const html2canvas = html2canvasMod.default;

        const mLeft = stateRef.current.margins.left;
        const mRight = stateRef.current.margins.right;
        const fullW = width + mLeft + mRight;

        // Create container that replicates the editor's HF zone
        const zone = document.createElement('div');
        const isHeader = type === 'header';

        // Match the padding of the editor's HF zones
        const paddingCSS = isHeader
          ? `8px ${mRight}px 10px ${mLeft}px`
          : `10px ${mRight}px 8px ${mLeft}px`;

        zone.style.cssText = `
          position: fixed; left: -9999px; top: 0;
          width: ${fullW}px; height: ${height}px;
          display: flex; align-items: flex-start; justify-content: center;
          padding: ${paddingCSS}; box-sizing: border-box;
          font-family: Arial, sans-serif; font-size: 12px;
          overflow: visible; background: transparent;
        `;

        // Content container
        const content = document.createElement('div');
        content.className = 'hf-content';
        content.style.cssText = `width: 100%; position: relative; z-index: 0; height: ${height - 18}px; overflow: visible;`;
        content.innerHTML = html;
        zone.appendChild(content);

        // Pre-process images in HF
        content.querySelectorAll('img').forEach((img) => {
          const src = img.getAttribute('src') || '';
          if (src && !src.startsWith('data:')) {
            img.setAttribute('crossorigin', 'anonymous');
          } else {
            img.removeAttribute('crossorigin');
          }

          const wrap = img.getAttribute('data-wrap');
          if (wrap === 'behind' || wrap === 'front') {
            img.style.position = 'absolute';
            img.style.zIndex = '1';
            img.style.maxHeight = 'none';
            img.style.objectFit = 'initial';
            img.style.margin = '0';
            // left/top are inline from the editor
          } else {
            const limit = Math.max(20, height - 18);
            if (!img.style.maxHeight) img.style.maxHeight = limit + 'px';
            img.style.objectFit = 'contain';
          }
        });

        document.body.appendChild(zone);

        // Wait for images
        const images = content.querySelectorAll('img');
        if (images.length > 0) {
          await Promise.all(Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          }));
          await new Promise(r => setTimeout(r, 50));
        }

        const canvas = await html2canvas(zone, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: fullW,
          height: height,
          windowWidth: fullW,
          backgroundColor: null, // Transparent
        });

        zone.remove();
        return canvas.toDataURL('image/png');
      } catch (err) {
        console.error('Error rendering HF:', err);
        return null;
      }
    }, [stateRef]);

    /**
     * Exporta o documento no formato escolhido (PDF, DOCX, HTML ou TXT).
     * Para PDF: renderiza página por página com cabeçalho/rodapé diferenciado.
     * Para outros: gera um blob e faz download.
     */
    const exportDoc = useCallback(async (options?: { format: 'pdf' | 'docx' | 'html' | 'txt'; filename?: string; output?: 'download' | 'blob' }) => {
      const format = options?.format ?? 'pdf';
      const filename = options?.filename || docTitle;
      const html = editorRef.current?.innerHTML || '';

      if (format === 'pdf') {
        setIsExporting(true);
        // Show toast or some feedback using the new state or toast lib if available
        // For now relying on button state via isExporting prop if exposed, or just blocking interactions

        try {
          const { jsPDF } = await import('jspdf');
          const html2canvasMod = await import('html2canvas');
          const html2canvas = html2canvasMod.default;

          const el = editorRef.current;
          if (!el) throw new Error('Editor not available');

          const pageDef = PAGE_SIZES[stateRef.current.pageSize] || PAGE_SIZES.A4;
          const pw = stateRef.current.pageOrientation === 'landscape' ? pageDef.h : pageDef.w;
          const ph = stateRef.current.pageOrientation === 'landscape' ? pageDef.w : pageDef.h;
          const mT = stateRef.current.margins.top;
          const mB = stateRef.current.margins.bottom;
          const mL = stateRef.current.margins.left;
          const mR = stateRef.current.margins.right;
          const contentW = pw - mL - mR;
          const contentH = ph - mT - mB;

          // 1. Clone editor content
          const clone = document.createElement('div');
          clone.style.cssText = `
            position: absolute; left: -9999px; top: 0;
            width: ${contentW}px; background: white;
            font-family: Arial, sans-serif; line-height: 1.625;
            word-wrap: break-word; overflow-wrap: break-word;
            box-sizing: border-box; padding: 0; margin: 0;
          `;
          const styles = window.getComputedStyle(el);
          clone.style.fontSize = styles.fontSize;
          clone.style.color = styles.color;
          clone.style.lineHeight = styles.lineHeight;

          // Copy content
          const editorClone = el.cloneNode(true) as HTMLElement;
          // Remove page spacers specific to editor view
          editorClone.querySelectorAll('.page-spacer').forEach(s => s.remove());
          clone.innerHTML = editorClone.innerHTML;

          // 2. Pre-process Image Wrapping & CrossOrigin
          clone.querySelectorAll('img').forEach((img) => {
            const src = img.getAttribute('src') || '';
            if (src && !src.startsWith('data:')) {
              img.setAttribute('crossorigin', 'anonymous');
            } else {
              img.removeAttribute('crossorigin');
            }

            const wrap = img.getAttribute('data-wrap');
            switch (wrap) {
              case 'inline':
                img.style.display = 'inline';
                img.style.float = 'none';
                img.style.margin = '4px 2px';
                img.style.verticalAlign = 'middle';
                img.style.position = 'static';
                break;
              case 'square-left':
                img.style.display = 'block';
                img.style.float = 'left';
                img.style.margin = '4px 12px 4px 0';
                img.style.position = 'static';
                img.style.clear = 'left';
                break;
              case 'square-right':
                img.style.display = 'block';
                img.style.float = 'right';
                img.style.margin = '4px 0 4px 12px';
                img.style.position = 'static';
                img.style.clear = 'right';
                break;
              case 'top-bottom':
                img.style.display = 'block';
                img.style.float = 'none';
                img.style.margin = '10px auto';
                img.style.position = 'static';
                img.style.clear = 'both';
                break;
              case 'behind':
                img.style.position = 'absolute';
                img.style.zIndex = '1';
                img.style.margin = '0';
                img.style.float = 'none';
                break;
              case 'front':
                img.style.position = 'absolute';
                img.style.zIndex = '50';
                img.style.margin = '0';
                img.style.float = 'none';
                break;
              default:
                // Ensure max-width is controlled
                if (!img.style.maxWidth) img.style.maxWidth = '100%';
                break;
            }
          });

          document.body.appendChild(clone);

          // Wait for images in main content
          const imgs = clone.querySelectorAll('img');
          if (imgs.length > 0) {
            await Promise.all(Array.from(imgs).map(img =>
              img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })
            ));
            await new Promise(r => setTimeout(r, 100)); // Stabilization
          }

          // 3. Render main content to canvas
          const SCALE = 3;
          const fullCanvas = await html2canvas(clone, {
            scale: SCALE, useCORS: true, allowTaint: true, logging: false,
            width: contentW, windowWidth: contentW, backgroundColor: '#ffffff',
          });
          clone.remove();

          const fullH = fullCanvas.height / SCALE;
          const totalPages = Math.max(1, Math.ceil(fullH / contentH));

          const pdf = new jsPDF({
            unit: 'px', format: [pw, ph],
            orientation: stateRef.current.pageOrientation || 'portrait',
            hotfixes: ['px_scaling'],
          });

          // 4. Render Headers/Footers per page (with variant support)
          // Cache rendered HF images to avoid re-rendering identical content
          const hfCache = new Map<string, string | null>();

          const renderHFCached = async (htmlContent: string, width: number, height: number, hfType: 'header' | 'footer'): Promise<string | null> => {
            const key = `${hfType}:${htmlContent}`;
            if (hfCache.has(key)) return hfCache.get(key) ?? null;
            const img = await renderHFToImage(htmlContent, width, height, hfType);
            hfCache.set(key, img);
            return img;
          };

          // 5. Assemble Pages
          for (let i = 0; i < totalPages; i++) {
            if (i > 0) pdf.addPage();
            const pageNumber = i + 1;
            const srcY = i * contentH * SCALE;
            const srcH = Math.min(contentH * SCALE, fullCanvas.height - srcY);

            if (srcH <= 0) continue;

            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = contentW * SCALE;
            pageCanvas.height = contentH * SCALE;
            const ctx = pageCanvas.getContext('2d')!;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

            // Draw slice
            ctx.drawImage(fullCanvas, 0, srcY, contentW * SCALE, srcH, 0, 0, contentW * SCALE, srcH);

            const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
            pdf.addImage(pageImgData, 'JPEG', mL, mT, contentW, contentH);

            // Add Header (resolved per page)
            const pageHeaderHTML = resolverHF('header', pageNumber);
            if (pageHeaderHTML) {
              const resolvedHeader = pageHeaderHTML
                .replace(/\{\{pagina\}\}/g, String(pageNumber))
                .replace(/\{\{total\}\}/g, String(totalPages));
              const headerImg = await renderHFCached(resolvedHeader, contentW, mT, 'header');
              if (headerImg) {
                pdf.addImage(headerImg, 'PNG', 0, 0, pw, mT);
              }
            }

            // Add Footer (resolved per page)
            const pageFooterHTML = resolverHF('footer', pageNumber);
            if (pageFooterHTML) {
              const resolvedFooter = pageFooterHTML
                .replace(/\{\{pagina\}\}/g, String(pageNumber))
                .replace(/\{\{total\}\}/g, String(totalPages));
              const footerImg = await renderHFCached(resolvedFooter, contentW, mB, 'footer');
              if (footerImg) {
                pdf.addImage(footerImg, 'PNG', 0, ph - mB, pw, mB);
              }
            }
          }

          pdf.save(`${filename}.pdf`);
          return { format: 'pdf', filename: `${filename}.pdf`, mimeType: 'application/pdf', size: 0 } as ExportResult;
        } catch (err) {
          console.warn('jsPDF/html2canvas unavailable or error:', err);
          alert('Erro ao gerar PDF. Tente novamente.');
          return { format: 'pdf', filename: `${filename}.pdf`, mimeType: 'application/pdf', size: 0 } as ExportResult;
        } finally {
          setIsExporting(false);
        }
      }

      let blob: Blob;
      let mimeType: string;
      let ext: string;

      switch (format) {
        case 'docx':
          blob = new Blob([
            `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">` +
            `<head><meta charset="utf-8"><style>body{font-family:Arial;font-size:12pt;}</style></head>` +
            `<body>${html}</body></html>`
          ], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          mimeType = blob.type;
          ext = 'docx';
          break;
        case 'html':
          blob = new Blob([`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename}</title></head><body>${html}</body></html>`], { type: 'text/html' });
          mimeType = 'text/html';
          ext = 'html';
          break;
        case 'txt':
          blob = new Blob([editorRef.current?.innerText || ''], { type: 'text/plain' });
          mimeType = 'text/plain';
          ext = 'txt';
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      if (options?.output === 'blob') {
        return { format, filename: `${filename}.${ext}`, blob, mimeType, size: blob.size } as ExportResult;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      return { format, filename: `${filename}.${ext}`, mimeType, size: blob.size } as ExportResult;
    }, [docTitle, renderHFToImage, stateRef, resolverHF]);

    // ════════════════════════════════════════════════════════════════
    // SEÇÃO 14: IMPORTAÇÃO
    // Permite importar arquivos .docx, .html, .htm e .txt para o editor.
    // Arquivos .docx são enviados ao servidor para conversão em HTML.
    // Ver: hooks/useImportDocument.ts para explicação detalhada
    // ════════════════════════════════════════════════════════════════

    /** Processa o arquivo importado baseado na extensão (.docx, .html, .txt) */
    const processImport = useCallback(async (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const el = editorRef.current;
      if (!el) return;

      if (ext === 'doc') {
        alert('Formato .doc (Word antigo) nao e suportado. Abra o arquivo no Word e salve como .docx.');
        return;
      } else if (ext === 'docx') {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const response = await fetch('/api/import-docx', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Erro HTTP ${response.status}`);
          }

          const data = await response.json();
          const htmlContent = data.html || '';

          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlContent, 'text/html');
          doc.querySelectorAll('table').forEach(table => {
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';
            table.style.margin = '10px 0';
            table.querySelectorAll<HTMLTableCellElement>('td, th').forEach(cell => {
              cell.style.border = '1px solid #888';
              cell.style.padding = '8px';
              cell.style.verticalAlign = 'top';
            });
          });
          el.innerHTML = doc.body.innerHTML;
        } catch (err) {
          console.error('Erro ao importar DOCX:', err);
          alert('Erro ao importar: ' + (err instanceof Error ? err.message : 'erro desconhecido'));
          return;
        }
      } else if (ext === 'html' || ext === 'htm') {
        const text = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        el.innerHTML = doc.body.innerHTML;
      } else if (ext === 'txt') {
        const text = await file.text();
        el.innerHTML = `<p>${text.replace(/\n/g, '</p><p>')}</p>`;
      }
      updateStats();
      const htmlLimpo = obterHTMLLimpo();
      history.pushState(htmlLimpo);
      onChangeRef.current?.(htmlLimpo);
    }, [history, updateStats, obterHTMLLimpo]);

    /** Abre o seletor de arquivo (ou processa um arquivo já fornecido) */
    const importFile = useCallback(async (file?: File) => {
      let f = file;
      if (!f) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.docx,.doc,.html,.htm,.txt';
        return new Promise<void>((resolve) => {
          input.onchange = async () => {
            f = input.files?.[0];
            if (!f) { resolve(); return; }
            await processImport(f);
            resolve();
          };
          input.click();
        });
      }
      await processImport(f);
    }, [processImport]);

    // ════════════════════════════════════════════════════════════════
    // SEÇÃO 15: SERIALIZAÇÃO (empacotamento para salvar)
    // Pega todo o estado do editor e transforma em um objeto JSON
    // que pode ser salvo no banco de dados. Inclui: HTML, variáveis
    // encontradas ({{cidadão.nome}}), configuração da página, etc.
    // Ver: hooks/useSerialize.ts para explicação detalhada
    // ════════════════════════════════════════════════════════════════

    /** Empacota o documento inteiro em um objeto para salvar */
    const serialize = useCallback((): SerializedDocument => {
      const html = obterHTMLLimpo();
      const markers: Marker[] = [];
      const markerRegex = /\{\{([^}]+)\}\}/g;
      let match: RegExpExecArray | null;
      while ((match = markerRegex.exec(html)) !== null) {
        const full = match[1];
        const parts = full.split('.');
        if (parts.length === 2) {
          markers.push({ type: 'variable', value: match[0], table: parts[0], field: parts[1] });
        } else {
          markers.push({ type: 'text', value: match[0] });
        }
      }

      return {
        html,
        markers,
        pageConfig: {
          size: stateRef.current.pageSize,
          orientation: stateRef.current.pageOrientation,
          margins: { ...stateRef.current.margins },
          columns: stateRef.current.columns,
          background: stateRef.current.pageBackground,
          headerHTML: stateRef.current.headerHTML,
          footerHTML: stateRef.current.footerHTML,
          watermarkText: stateRef.current.watermarkText,
          watermarkOpacity: stateRef.current.watermarkOpacity,
          primeiraPaginaDiferente: stateRef.current.primeiraPaginaDiferente,
          parImparDiferente: stateRef.current.parImparDiferente,
          primeiraPaginaHeaderHTML: stateRef.current.primeiraPaginaHeaderHTML,
          primeiraPaginaFooterHTML: stateRef.current.primeiraPaginaFooterHTML,
          paginasParesHeaderHTML: stateRef.current.paginasParesHeaderHTML,
          paginasParesFooterHTML: stateRef.current.paginasParesFooterHTML,
        },
        dbModels: databaseSchema.map(t => ({
          table: t.tableName,
          displayName: t.displayName,
          fields: t.fields.map(f => ({ label: f.label, value: f.value })),
        })),
        quickTexts: quickTextsList,
      };
    }, [stateRef, databaseSchema, quickTextsList, obterHTMLLimpo]);

    // ════════════════════════════════════════════════════════════════
    // SEÇÃO 16: INSERÇÕES (imagem, link, data, sumário, etc.)
    // Funções que inserem conteúdo especial no cursor do editor.
    // Ver: hooks/useInsertions.ts para explicação detalhada
    // ════════════════════════════════════════════════════════════════

    /** Insere um Sumário (índice) automático baseado nos títulos do documento */
    const insertTOC = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let tocHTML = '<div class="toc-container" contenteditable="false"><div class="toc-title">Sumario</div>';
      headings.forEach((h, i) => {
        const level = parseInt(h.tagName[1]);
        const text = h.textContent || '';
        const id = `heading-${i}`;
        h.id = id;
        tocHTML += `<a href="#${id}" style="padding-left:${(level - 1) * 16}px" class="toc-item">${text}</a>`;
      });
      tocHTML += '</div><p><br></p>';
      formatting.insertHTML(tocHTML);
    }, [formatting]);

    /** Insere imagem do computador (usa base64 durante edição; upload S3 acontece ao salvar) */
    const insertImage = useCallback(() => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const src = e.target?.result as string;
          const img = new window.Image();
          img.onload = () => {
            const maxW = pageContainerRef.current
              ? pageContainerRef.current.clientWidth - state.margins.left - state.margins.right
              : 600;
            const w = Math.min(img.naturalWidth, maxW);
            const h = Math.round(w * (img.naturalHeight / img.naturalWidth));
            formatting.insertHTML(
              `<img src="${src}" style="width:${w}px;height:${h}px;max-width:100%;" data-wrap="inline" />`
            );
          };
          img.onerror = () => {
            formatting.insertHTML(
              `<img src="${src}" style="max-width:100%;height:auto;" data-wrap="inline" />`
            );
          };
          img.src = src;
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }, [formatting, state.margins]);

    /** Insere imagem a partir de uma URL (pergunta ao usuário) */
    const insertImageUrl = useCallback(() => {
      const url = prompt('URL da imagem:');
      if (url) {
        const img = new Image();
        img.onload = () => {
          const maxW = pageContainerRef.current
            ? pageContainerRef.current.clientWidth - state.margins.left - state.margins.right
            : 600;
          const w = Math.min(img.naturalWidth, maxW);
          const h = Math.round(w * (img.naturalHeight / img.naturalWidth));
          formatting.insertHTML(`<img src="${url}" style="width:${w}px;height:${h}px;max-width:100%;" data-wrap="inline" />`);
        };
        img.onerror = () => {
          formatting.insertHTML(`<img src="${url}" style="max-width:100%;height:auto;" data-wrap="inline" />`);
        };
        img.src = url;
      }
    }, [formatting, state.margins]);

    /** Insere um hiperlink (se há texto selecionado, ele vira o texto do link) */
    const insertLink = useCallback(() => {
      const url = prompt('URL do link:');
      if (url) {
        const sel = window.getSelection();
        const text = sel?.toString() || url;
        formatting.insertHTML(`<a href="${url}" target="_blank">${text}</a>`);
      }
    }, [formatting]);

    /** Insere a data de hoje no formato brasileiro (DD/MM/AAAA) */
    const insertDate = useCallback(() => {
      const d = new Date();
      const formatted = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      formatting.insertHTML(formatted);
    }, [formatting]);

    /** Mostra um alerta com as estatísticas do documento (palavras, caracteres, etc.) */
    const showWordCount = useCallback(() => {
      alert(`Palavras: ${stats.words}\nCaracteres: ${stats.characters}\nCaracteres (sem espacos): ${stats.charactersNoSpaces}\nParagrafos: ${stats.paragraphs}\nLinhas: ${stats.lines}\nPaginas: ${stats.pages}`);
    }, [stats]);

    // ════════════════════════════════════════════════════════════════
    // SEÇÃO 17: CONFIGURAÇÕES (página, margens, zoom, colunas)
    // Funções que alteram as configurações visuais do documento.
    // ════════════════════════════════════════════════════════════════

    /** Altera o tamanho da página (A4, Carta, Ofício, etc.) */
    const handleSetPageSize = useCallback((size: PageSizeKey) => {
      set('pageSize', size);
      updateStats();
    }, [set, updateStats]);

    /** Altera a orientação da página (retrato ou paisagem) */
    const handleSetOrientation = useCallback((o: 'portrait' | 'landscape') => {
      set('pageOrientation', o);
      updateStats();
    }, [set, updateStats]);

    /** Altera as margens da página (superior, inferior, esquerda, direita) */
    const handleSetMargins = useCallback((m: Partial<Margins>) => {
      setMargins(m);
      updateStats();
    }, [setMargins, updateStats]);

    /** Altera o número de colunas do texto (1, 2 ou 3) */
    const handleSetColumns = useCallback((c: 1 | 2 | 3) => {
      set('columns', c);
      const el = editorRef.current;
      if (el) {
        if (c > 1) {
          el.style.columnCount = String(c);
          el.style.columnGap = '24px';
        } else {
          el.style.columnCount = '';
          el.style.columnGap = '';
        }
      }
    }, [set]);

    /** Altera o nível de zoom da visualização (ex: 100 = 100%) */
    const handleSetZoom = useCallback((z: number) => {
      set('zoom', z);
    }, [set]);

    // ════════════════════════════════════════════════════════════════
    // SEÇÃO 18: API PÚBLICA
    // Funções que ficam disponíveis para quem usa o componente TextEditor.
    // Exemplo de uso externo: editorRef.current.getHTML() para pegar o HTML,
    // editorRef.current.exportDoc({ format: 'pdf' }) para exportar PDF.
    // ════════════════════════════════════════════════════════════════

    /** Expõe funções públicas via ref para quem usa o componente */
    useImperativeHandle(ref, () => ({
      getHTML: () => obterHTMLLimpo(),
      setHTML: (html: string) => {
        const el = editorRef.current;
        if (!el) return;
        el.innerHTML = html;
        history.pushState(html);
        updateStats();
        onChangeRef.current?.(html);
      },
      getText: () => editorRef.current?.innerText ?? '',
      serialize,
      exportDoc,
      importFile,
      undo: () => applySnapshot(history.undo()),
      redo: () => applySnapshot(history.redo()),
      setDatabaseSchema: (schema: DatabaseTable[]) => setDatabaseSchema(schema),
      setQuickTexts: (texts: QuickText[]) => setQuickTextsList(texts),
      loadBackendData: (data) => {
        if (data.dbModels) setDatabaseSchema(data.dbModels);
        if (data.quickTexts) setQuickTextsList(data.quickTexts);
      },
      execCommand: formatting.execCommand,
      setFontSize: formatting.setFontSize,
      setFontFamily: formatting.setFontFamily,
      insertTable: formatting.insertTable,
      insertPageBreak: formatting.insertPageBreak,
      setZoom: handleSetZoom,
      clear: () => {
        const el = editorRef.current;
        if (!el) return;
        el.innerHTML = '';
        history.pushState('');
        updateStats();
        onChangeRef.current?.('');
      },
    }), [serialize, exportDoc, importFile, history, updateStats, formatting, handleSetZoom, applySnapshot, obterHTMLLimpo]);

    // ════════════════════════════════════════════════════════════════
    // SEÇÃO 19: RENDERIZAÇÃO (HTML/JSX do componente)
    // A estrutura visual do editor, de cima para baixo:
    //   1. Toolbar (barra de ferramentas no topo)
    //   2. Régua horizontal (opcional)
    //   3. Painel de Buscar/Substituir (opcional)
    //   4. Área principal com régua vertical + folha de papel:
    //      - Marca d'água (se configurada)
    //      - Redimensionador de imagens (Resizer)
    //      - Quebras de página com cabeçalho/rodapé repetidos
    //      - Zona editável do cabeçalho (primeira página)
    //      - Zona editável do rodapé (primeira página)
    //      - Overlay escuro (quando editando cabeçalho/rodapé)
    //      - DIV contentEditable (onde o usuário digita)
    //      - Autocomplete (popup de variáveis)
    //   5. Overlay de "Gerando PDF..." (durante exportação)
    //   6. Barra de status (palavras, páginas, zoom)
    // ════════════════════════════════════════════════════════════════

    return (
      <div
        className={`et-editor-root flex flex-col h-full max-h-full overflow-hidden ${state.darkMode ? 'dark-mode' : ''} ${className ?? ''}`}
        style={{ background: state.darkMode ? '#1e1e1e' : '#f3f4f6' }}
      >
        {/* Toolbar */}
        <Toolbar
          state={state}
          database={databaseSchema}
          activeContext={contextType}
          selectedElement={selectedElement}
          onUpdateStats={updateStats}
          onSetTab={(tab) => set('activeTab', tab)}
          onExecCommand={(cmd, val) => formatting.execCommand(cmd, val)}
          onSetFontSize={(s) => formatting.setFontSize(s)}
          onSetFontFamily={(f) => formatting.setFontFamily(f)}
          onChangeCase={(t) => formatting.changeCase(t)}
          onUndo={() => applySnapshot(history.undo())}
          onRedo={() => applySnapshot(history.redo())}
          onApplyABNT={applyABNT}
          onSetStyles={setStyles}
          onExport={(format) => exportDoc({ format })}
          onImport={() => importFile()}
          onSetPageSize={handleSetPageSize}
          onSetOrientation={handleSetOrientation}
          onSetMargins={handleSetMargins}
          onSetColumns={handleSetColumns}
          onToggleRuler={() => set('showRuler', !state.showRuler)}
          onToggleDarkMode={() => set('darkMode', !state.darkMode)}
          onSetZoom={handleSetZoom}
          onSetPageBackground={(c) => set('pageBackground', c)}
          onInsertTable={(r, c) => formatting.insertTable(r, c)}
          onInsertImage={() => insertImage()}
          onInsertImageUrl={() => insertImageUrl()}
          onInsertLink={() => insertLink()}
          onInsertVariable={(v) => formatting.insertVariable(v)}
          onInsertPageBreak={() => formatting.insertPageBreak()}
          onInsertHR={() => formatting.execCommand('insertHorizontalRule')}
          onInsertDate={() => insertDate()}
          onInsertTOC={() => insertTOC()}
          onToggleTrackChanges={() => set('trackChanges', !state.trackChanges)}
          onWordCount={showWordCount}
          onInsertQRCode={(t, s) => formatting.insertQRCode(t, s)}
          onEditHeader={handleEditHeader}
          onEditFooter={handleEditFooter}
          onTogglePrimeiraPaginaDiferente={() => set('primeiraPaginaDiferente', !state.primeiraPaginaDiferente)}
          onToggleParImparDiferente={() => set('parImparDiferente', !state.parImparDiferente)}
          onFindReplace={() => setFindReplaceOpen(prev => !prev)}
          onInsertSymbol={(s) => formatting.insertHTML(s)}
        />

        {/* Horizontal Ruler */}
        {state.showRuler && (
          <HorizontalRuler
            pageWidth={pageW}
            margins={state.margins}
            onMarginsChange={handleSetMargins}
            zoom={state.zoom}
          />
        )}

        {/* Find & Replace panel */}
        {findReplaceOpen && (
          <FindReplace
            editorRef={editorRef}
            onClose={() => setFindReplaceOpen(false)}
          />
        )}

        {/* Main editor area with optional vertical ruler */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-auto flex"
          style={{ background: state.darkMode ? '#1e1e1e' : '#b0b0b0' }}
        >
          {/* Vertical Ruler */}
          {state.showRuler && (
            <VerticalRuler
              pageHeight={pageH}
              pages={stats.pages}
              margins={state.margins}
              onMarginsChange={handleSetMargins}
              zoom={state.zoom}
            />
          )}

          {/* Page area - single desk color, no second layer */}
          <div className="flex-1 flex justify-center py-5">
            <div
              ref={pageContainerRef}
              className="relative transition-transform ease-out duration-200"
              style={{
                width: pageW,
                minHeight: pageH,
                background: state.pageBackground,
                transform: `scale(${state.zoom / 100})`,
                transformOrigin: 'top center',
                paddingTop: state.margins.top,
                paddingBottom: state.margins.bottom,
                paddingLeft: state.margins.left,
                paddingRight: state.margins.right,
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }}
              onDragOver={handleDragOverPagina}
              onDragLeave={handleDragLeavePagina}
              onDrop={handleDropPagina}
            >
              {/* Watermark — repeated per page */}
              {state.watermarkText && Array.from({ length: stats.pages }, (_, i) => {
                const contentPerPage = pageH - state.margins.top - state.margins.bottom;
                const gapHeight = state.margins.bottom + 8 + state.margins.top;
                // Center of each page (relative to the padded content area)
                const pageCenterY = i * (contentPerPage + (i > 0 ? gapHeight : 0)) + contentPerPage / 2;
                return (
                  <div
                    key={`wm-${i}`}
                    className="absolute left-1/2 pointer-events-none select-none z-0"
                    style={{
                      top: state.margins.top + pageCenterY,
                      transform: 'translate(-50%, -50%) rotate(-45deg)',
                      fontSize: 72,
                      fontWeight: 700,
                      color: `rgba(0,0,0,${state.watermarkOpacity})`,
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                    }}
                  >
                    {state.watermarkText}
                  </div>
                );
              })}

              <Resizer
                target={selectedElement}
                pageContainerRef={pageContainerRef as React.RefObject<HTMLDivElement>}
                onResize={() => {/* debounced — stats update only on resize end to avoid lag */ }}
                onResizeEnd={() => {
                  updateStats();
                  const htmlLimpo = obterHTMLLimpo();
                  history.pushState(htmlLimpo);
                  onChangeRef.current?.(htmlLimpo);
                }}
              />

              {/* Page breaks with footer/header repeats - like Google Docs */}
              {stats.pages > 1 && Array.from({ length: stats.pages - 1 }, (_, i) => {
                const contentPerPage = pageH - state.margins.top - state.margins.bottom;
                // Each page break area: footer margin + 8px desk gap + header margin
                const gapHeight = state.margins.bottom + 8 + state.margins.top;
                // Position: after the content of page i+1 (offset from top padding)
                const breakY = state.margins.top + (i + 1) * contentPerPage + i * gapHeight;
                const deskColor = state.darkMode ? '#1e1e1e' : '#b0b0b0';
                const pageNum = i + 1;
                const nextPageNum = i + 2;

                const footerHTML = resolverHF('footer', pageNum)
                  .replace(/\{\{pagina\}\}/g, escapeHtml(String(pageNum)))
                  .replace(/\{\{total\}\}/g, escapeHtml(String(stats.pages)));
                const headerHTML = resolverHF('header', nextPageNum)
                  .replace(/\{\{pagina\}\}/g, escapeHtml(String(nextPageNum)))
                  .replace(/\{\{total\}\}/g, escapeHtml(String(stats.pages)));

                return (
                  <div
                    key={`pb-${i}`}
                    className="absolute left-0 right-0 pointer-events-none select-none"
                    style={{
                      top: breakY,
                      height: gapHeight,
                      marginLeft: -state.margins.left,
                      marginRight: -state.margins.right,
                      zIndex: 20,
                    }}
                  >
                    {/* Footer of ending page */}
                    <div style={{
                      height: state.margins.bottom,
                      background: state.pageBackground,
                      borderBottom: 'none',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}>
                      {footerHTML && (
                        <div style={{
                          padding: `10px ${state.margins.right}px 8px ${state.margins.left}px`,
                          fontSize: '11px',
                          fontFamily: 'Arial, sans-serif',
                          lineHeight: 1.4,
                          boxSizing: 'border-box',
                          width: '100%',
                          height: '100%',
                        }} dangerouslySetInnerHTML={{ __html: footerHTML }} />
                      )}
                    </div>

                    {/* Desk gap between pages */}
                    <div style={{
                      height: 8,
                      background: deskColor,
                    }} />

                    {/* Header of next page */}
                    <div style={{
                      height: state.margins.top,
                      background: state.pageBackground,
                      boxShadow: '0 -2px 4px rgba(0,0,0,0.15)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}>
                      {headerHTML && (
                        <div style={{
                          padding: `8px ${state.margins.right}px 10px ${state.margins.left}px`,
                          fontSize: '11px',
                          fontFamily: 'Arial, sans-serif',
                          lineHeight: 1.4,
                          boxSizing: 'border-box',
                          width: '100%',
                          height: '100%',
                        }} dangerouslySetInnerHTML={{ __html: headerHTML }} />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Header Zone (first page - editable) */}
              <HeaderFooterZone
                type="header"
                html={resolverHF('header', 1)}
                height={state.margins.top}
                marginLeft={state.margins.left}
                marginRight={state.margins.right}
                isEditing={editingHF === 'header'}
                pageNum={currentPage}
                totalPages={stats.pages}
                onEdit={handleEditHeader}
                onUpdate={handleUpdateHeader}
                onClose={handleCloseHF}
                dragSobre={dragZonaAtiva === 'header'}
                variantLabel={
                  state.primeiraPaginaDiferente
                    ? 'Cabecalho - Primeira Pagina'
                    : undefined
                }
              />

              {/* Footer Zone (first page - editable) */}
              <HeaderFooterZone
                type="footer"
                html={resolverHF('footer', 1)}
                height={state.margins.bottom}
                marginLeft={state.margins.left}
                marginRight={state.margins.right}
                isEditing={editingHF === 'footer'}
                pageNum={currentPage}
                totalPages={stats.pages}
                onEdit={handleEditFooter}
                onUpdate={handleUpdateFooter}
                onClose={handleCloseHF}
                dragSobre={dragZonaAtiva === 'footer'}
                variantLabel={
                  state.primeiraPaginaDiferente
                    ? 'Rodape - Primeira Pagina'
                    : undefined
                }
              />

              {/* Overlay on body when editing header/footer - click to close */}
              {editingHF && (
                <div
                  className="absolute z-30 cursor-pointer"
                  style={{
                    top: state.margins.top,
                    left: 0,
                    right: 0,
                    bottom: state.margins.bottom,
                    background: 'rgba(0,0,0,0.02)',
                  }}
                  onClick={() => handleCloseHF()}
                  title="Clique para voltar ao corpo do documento"
                />
              )}

              {/* Contenteditable editor */}
              <div
                ref={editorRef}
                onInput={handleInput}
                onClick={handleEditorClick}
                className={`outline-none relative z-0 ${dragZonaAtiva === 'body' ? 'drag-body-active' : ''}`}
                onDoubleClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.tagName === 'IMG' || target.classList.contains('qr-code')) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!target.style.width || target.style.width === 'auto') {
                      target.style.width = target.offsetWidth + 'px';
                    }
                    if (!target.style.height || target.style.height === 'auto') {
                      target.style.height = target.offsetHeight + 'px';
                    }
                    setSelectedElement(target);
                    setContextType(target.classList.contains('qr-code') ? 'QRCode' : 'Imagem');
                    set('activeTab', target.classList.contains('qr-code') ? 'QRCode' : 'Imagem');
                    window.getSelection()?.removeAllRanges();
                  }
                }}
                onMouseDown={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.tagName === 'IMG' || target.classList.contains('qr-code')) {
                    if (!target.style.width || target.style.width === 'auto') {
                      target.style.width = target.offsetWidth + 'px';
                    }
                    if (!target.style.height || target.style.height === 'auto') {
                      target.style.height = target.offsetHeight + 'px';
                    }
                    e.preventDefault();
                  }
                }}
                contentEditable={!readOnly && !editingHF}
                suppressContentEditableWarning
                style={{
                  minHeight: pageH - state.margins.top - state.margins.bottom,
                  maxWidth: '100%',
                  lineHeight: 1.625,
                  fontFamily: state.styles.fontFamily,
                  fontSize: state.styles.fontSize + 'pt',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  overflow: 'hidden',
                  color: state.darkMode ? '#d4d4d4' : undefined,
                }}
                spellCheck={false}
                translate="no"
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />

              {/* Autocomplete popup */}
              <Autocomplete
                editorRef={editorRef}
                database={databaseSchema}
                quickTexts={quickTextsList}
              />
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isExporting && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm cursor-wait">
            <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              <span className="font-medium">Gerando PDF...</span>
            </div>
          </div>
        )}

        {/* Status bar */}
        <StatusBar
          stats={stats}
          zoom={state.zoom}
          onZoomChange={handleSetZoom}
          currentPage={currentPage}
        />
      </div>
    );
  }
);

TextEditor.displayName = 'TextEditor';

export default TextEditor;
