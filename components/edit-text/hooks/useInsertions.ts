/**
 * ============================================================================
 * useInsertions — Funções de inserção de conteúdo no editor
 * ============================================================================
 *
 * O QUE FAZ:
 *   Agrupa todas as funções que inserem conteúdo especial no editor:
 *   imagens, links, datas, sumários, formatação ABNT, etc.
 *
 * POR QUE EXISTE:
 *   Cada tipo de conteúdo tem sua lógica própria de inserção. Por exemplo,
 *   inserir uma imagem precisa calcular o tamanho máximo, inserir um link
 *   precisa perguntar a URL, etc. Separar essas funções mantém o código
 *   principal do editor limpo.
 *
 * FUNÇÕES:
 *   - insertImage: insere imagem do computador
 *   - insertImageUrl: insere imagem a partir de uma URL
 *   - insertLink: insere um hiperlink
 *   - insertDate: insere a data atual formatada em PT-BR
 *   - insertTOC: insere um sumário automático baseado nos títulos
 *   - applyABNT: aplica formatação ABNT (Arial 12, margens, espaçamento)
 *   - showWordCount: mostra contagem de palavras em um alerta
 *   - refreshTOC: atualiza o sumário existente
 * ============================================================================
 */

import { useCallback } from 'react';
import type { WordStats, Margins } from '../types';

interface UseInsertionsParams {
  /** Referência para a DIV editável principal */
  editorRef: React.RefObject<HTMLDivElement | null>;
  /** Referência para o container da página (para calcular largura máxima) */
  pageContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Margens atuais da página */
  margins: Margins;
  /** Objeto do hook de formatação */
  formatting: {
    insertHTML: (html: string) => void;
    setFontFamily: (family: string) => void;
    setFontSize: (size: number) => void;
    insertVariable: (v: string) => void;
    insertQRCode: (t: string, s?: number) => void | Promise<void>;
    insertTable: (r: number, c: number) => void;
    insertPageBreak: () => void;
    execCommand: (cmd: string, val?: string) => void;
    changeCase: (t: string) => void;
  };
  /** Função para alterar estilos do editor (fonte, tamanho) */
  setStyles: (key: string, value: any) => void;
  /** Função para alterar margens */
  setMargins: (m: Partial<Margins>) => void;
  /** Estatísticas atuais (palavras, caracteres, etc.) */
  stats: WordStats;
}

export function useInsertions({
  editorRef,
  pageContainerRef,
  margins,
  formatting,
  setStyles,
  setMargins,
  stats,
}: UseInsertionsParams) {
  /**
   * Atualiza o sumário (índice) se já existir um no documento.
   * Varre todos os títulos (h1, h2, h3...) e reconstrói a lista.
   */
  const refreshTOC = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const tocContainer = el.querySelector('.toc-container');
    if (!tocContainer) return;

    const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let tocHTML = '<div class="toc-title">Sumario</div>';
    headings.forEach((h, i) => {
      const level = parseInt(h.tagName[1]); // h1→1, h2→2, etc.
      const text = h.textContent || '';
      const id = `heading-${i}`;
      h.id = id; // Adicionar id para o link funcionar
      tocHTML += `<a href="#${id}" style="padding-left:${(level - 1) * 16}px" class="toc-item">${text}</a>`;
    });
    tocContainer.innerHTML = tocHTML;
  }, [editorRef]);

  /**
   * Insere uma imagem a partir de um arquivo do computador.
   *
   * PASSOS:
   * 1. Abre o seletor de arquivos
   * 2. Lê o arquivo como base64 (para não precisar de servidor)
   * 3. Calcula o tamanho máximo que cabe na página
   * 4. Insere a imagem no cursor
   */
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

        // Carregar a imagem para saber suas dimensões naturais
        const img = new window.Image();
        img.onload = () => {
          // Calcular largura máxima que cabe na página (sem ultrapassar as margens)
          const maxW = pageContainerRef.current
            ? pageContainerRef.current.clientWidth - margins.left - margins.right
            : 600;
          const w = Math.min(img.naturalWidth, maxW);
          const h = Math.round(w * (img.naturalHeight / img.naturalWidth));
          formatting.insertHTML(
            `<img src="${src}" style="width:${w}px;height:${h}px;max-width:100%;" data-wrap="inline" />`
          );
        };
        img.onerror = () => {
          // Se não conseguir carregar, inserir sem dimensões fixas
          formatting.insertHTML(
            `<img src="${src}" style="max-width:100%;height:auto;" data-wrap="inline" />`
          );
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [formatting, margins, pageContainerRef]);

  /**
   * Insere uma imagem a partir de uma URL.
   * Pergunta a URL ao usuário e insere no cursor.
   */
  const insertImageUrl = useCallback(() => {
    const url = prompt('URL da imagem:');
    if (url) {
      const img = new Image();
      img.onload = () => {
        const maxW = pageContainerRef.current
          ? pageContainerRef.current.clientWidth - margins.left - margins.right
          : 600;
        const w = Math.min(img.naturalWidth, maxW);
        const h = Math.round(w * (img.naturalHeight / img.naturalWidth));
        formatting.insertHTML(
          `<img src="${url}" style="width:${w}px;height:${h}px;max-width:100%;" data-wrap="inline" />`
        );
      };
      img.onerror = () => {
        formatting.insertHTML(
          `<img src="${url}" style="max-width:100%;height:auto;" data-wrap="inline" />`
        );
      };
      img.src = url;
    }
  }, [formatting, margins, pageContainerRef]);

  /**
   * Insere um hiperlink no texto.
   * Se há texto selecionado, ele vira o texto do link.
   * Se não há, a URL é usada como texto.
   */
  const insertLink = useCallback(() => {
    const url = prompt('URL do link:');
    if (url) {
      const sel = window.getSelection();
      const text = sel?.toString() || url;
      formatting.insertHTML(`<a href="${url}" target="_blank">${text}</a>`);
    }
  }, [formatting]);

  /**
   * Insere a data de hoje no formato brasileiro (DD/MM/AAAA).
   */
  const insertDate = useCallback(() => {
    const d = new Date();
    const formatted = d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    formatting.insertHTML(formatted);
  }, [formatting]);

  /**
   * Insere um Sumário (Índice) automático no documento.
   * Varre todos os títulos (h1, h2...) e cria uma lista de links.
   */
  const insertTOC = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let tocHTML =
      '<div class="toc-container" contenteditable="false"><div class="toc-title">Sumario</div>';
    headings.forEach((h, i) => {
      const level = parseInt(h.tagName[1]);
      const text = h.textContent || '';
      const id = `heading-${i}`;
      h.id = id;
      tocHTML += `<a href="#${id}" style="padding-left:${(level - 1) * 16}px" class="toc-item">${text}</a>`;
    });
    tocHTML += '</div><p><br></p>';
    formatting.insertHTML(tocHTML);
  }, [editorRef, formatting]);

  /**
   * Aplica formatação ABNT ao documento inteiro.
   *
   * REGRAS ABNT:
   * - Fonte: Arial 12pt
   * - Margens: esquerda 3cm (113px), direita 2cm (75px), superior 3cm, inferior 2cm
   * - Espaçamento entre linhas: 1.5
   * - Texto justificado com recuo de primeira linha (47px)
   * - Itens de lista: justificado mas SEM recuo (quebraria os marcadores)
   * - Células de tabela: SEM recuo
   */
  const applyABNT = useCallback(() => {
    setStyles('fontFamily', 'Arial');
    setStyles('fontSize', 12);
    setMargins({ left: 113, right: 75, top: 113, bottom: 75 });

    const el = editorRef.current;
    if (el) {
      el.style.lineHeight = '1.5';
      formatting.setFontFamily('Arial');
      formatting.setFontSize(12);

      // Aplicar em parágrafos e títulos (fora de tabelas e listas)
      const blocks = el.querySelectorAll('p, h1, h2, h3, h4, h5, h6, blockquote');
      blocks.forEach((block) => {
        const htmlBlock = block as HTMLElement;
        if (htmlBlock.closest('table') || htmlBlock.closest('ul') || htmlBlock.closest('ol'))
          return;
        htmlBlock.style.textAlign = 'justify';
        htmlBlock.style.textIndent = '47px';
        htmlBlock.style.lineHeight = '1.5';
      });

      // Itens de lista: justificado mas sem recuo
      const listItems = el.querySelectorAll('li');
      listItems.forEach((li) => {
        const htmlLi = li as HTMLElement;
        if (htmlLi.closest('table')) return;
        htmlLi.style.textAlign = 'justify';
        htmlLi.style.textIndent = '0';
        htmlLi.style.lineHeight = '1.5';
      });

      // Células de tabela: sem recuo
      const cells = el.querySelectorAll('td, th');
      cells.forEach((cell) => {
        (cell as HTMLElement).style.textIndent = '0';
      });
    }
  }, [editorRef, setStyles, setMargins, formatting]);

  /**
   * Mostra um alerta com as estatísticas do documento.
   */
  const showWordCount = useCallback(() => {
    alert(
      `Palavras: ${stats.words}\n` +
        `Caracteres: ${stats.characters}\n` +
        `Caracteres (sem espaços): ${stats.charactersNoSpaces}\n` +
        `Parágrafos: ${stats.paragraphs}\n` +
        `Linhas: ${stats.lines}\n` +
        `Páginas: ${stats.pages}`
    );
  }, [stats]);

  return {
    refreshTOC,
    insertImage,
    insertImageUrl,
    insertLink,
    insertDate,
    insertTOC,
    applyABNT,
    showWordCount,
  };
}
