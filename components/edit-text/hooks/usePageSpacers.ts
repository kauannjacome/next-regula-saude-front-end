/**
 * ============================================================================
 * usePageSpacers — Gerenciamento dos "espaçadores de página"
 * ============================================================================
 *
 * O QUE FAZ:
 *   O editor é uma única DIV editável com todo o texto dentro. Para simular
 *   "páginas" como no Google Docs, inserimos <div>s invisíveis chamados
 *   "page-spacer" que empurram o conteúdo para baixo, criando o efeito visual
 *   de uma nova página começando.
 *
 * POR QUE EXISTE:
 *   Sem esses espaçadores, o texto simplesmente flui contínuo sem nenhum
 *   indicador de onde uma página termina e outra começa. Isso é importante
 *   para que o documento exportado em PDF tenha as páginas corretas.
 *
 * COMO FUNCIONA:
 *   1. Calcula quantos pixels de conteúdo cabem por página
 *   2. Percorre todos os elementos filhos do editor
 *   3. Quando um elemento vai ultrapassar o limite da página, insere um
 *      espaçador antes dele para empurrá-lo para a próxima "página"
 *   4. Um MutationObserver vigia se alguém deletou acidentalmente um
 *      espaçador (ex: Ctrl+A + Delete) e reinstala automaticamente
 *
 * RETORNA:
 *   - removerEspacadores(html): limpa o HTML removendo espaçadores
 *   - obterHTMLLimpo(): pega o innerHTML do editor sem espaçadores
 *   - atualizarEspacadores(): recalcula e insere espaçadores, retorna total de páginas
 * ============================================================================
 */

import { useCallback, useEffect } from 'react';

// Expressão regular que encontra os divs de espaçador no HTML
const REGEX_ESPACADOR = /<div[^>]*\bclass="page-spacer"[^>]*><\/div>/g;

interface UsePageSpacersParams {
  /** Referência para a DIV editável principal do editor */
  editorRef: React.RefObject<HTMLDivElement | null>;
  /** Altura total de uma página em pixels (ex: 842 para A4) */
  pageH: number;
  /** Referência para o estado atual do editor (margens, zoom, etc.) */
  stateRef: React.MutableRefObject<{ margins: { top: number; bottom: number } }>;
}

export function usePageSpacers({ editorRef, pageH, stateRef }: UsePageSpacersParams) {
  /**
   * Remove todos os espaçadores de uma string HTML.
   * Usado para obter o conteúdo "puro" sem os elementos visuais.
   */
  const removerEspacadores = useCallback(
    (html: string): string => html.replace(REGEX_ESPACADOR, ''),
    []
  );

  /**
   * Retorna o HTML atual do editor sem os espaçadores.
   * É o HTML "limpo" que será salvo no banco de dados.
   */
  const obterHTMLLimpo = useCallback((): string => {
    const el = editorRef.current;
    if (!el) return '';
    return removerEspacadores(el.innerHTML);
  }, [editorRef, removerEspacadores]);

  /**
   * Recalcula onde devem ficar os espaçadores e os insere no DOM.
   *
   * PASSO A PASSO:
   * 1. Remove todos os espaçadores antigos
   * 2. Se o conteúdo cabe em uma página, não faz nada
   * 3. Percorre cada elemento filho do editor somando suas alturas
   * 4. Quando a soma ultrapassa o espaço de uma página, insere um espaçador
   *    que preenche o restante + margem inferior + gap + margem superior
   * 5. Retorna quantas páginas o documento tem
   */
  const atualizarEspacadores = useCallback((): number => {
    const el = editorRef.current;
    if (!el) return 1;

    // Espaço útil para conteúdo em cada página (altura total - margem superior - margem inferior)
    const mTop = stateRef.current.margins.top;
    const mBot = stateRef.current.margins.bottom;
    const conteudoPorPagina = pageH - mTop - mBot;

    // Espaço que o espaçador precisa ter: rodapé + gap visual entre páginas + cabeçalho
    const alturaGap = mBot + 8 + mTop;

    if (conteudoPorPagina <= 0) return 1;

    // 1. Limpar espaçadores antigos
    el.querySelectorAll('.page-spacer').forEach((s) => s.remove());

    // 2. Se tudo cabe em uma página, pronto
    if (el.scrollHeight <= conteudoPorPagina + 2) return 1;

    // 3. Percorrer filhos e inserir espaçadores nas quebras
    let acumuladoY = 0;
    const filhos = Array.from(el.children);

    for (const filho of filhos) {
      const filhoEl = filho as HTMLElement;
      if (!filhoEl.offsetHeight) continue; // pular elementos invisíveis

      const alturaFilho = filhoEl.offsetHeight;

      // Se este elemento vai ultrapassar o limite da página...
      if (acumuladoY > 0 && acumuladoY + alturaFilho > conteudoPorPagina) {
        // Calcular quanto espaço sobra até o fim da página
        const restante = conteudoPorPagina - acumuladoY;

        // Criar o espaçador que preenche esse espaço + o gap entre páginas
        const espacador = document.createElement('div');
        espacador.className = 'page-spacer';
        espacador.setAttribute('contenteditable', 'false');
        espacador.setAttribute('data-spacer', 'true');
        espacador.style.cssText =
          `height:${restante + alturaGap}px;` +
          'width:100%;user-select:none;margin:0;padding:0;border:none;' +
          'box-sizing:border-box;';

        // Inserir o espaçador ANTES do elemento que ultrapassaria
        el.insertBefore(espacador, filhoEl);
        acumuladoY = 0; // Resetar contagem para a nova página
      }

      acumuladoY += alturaFilho;

      // Se um único elemento é maior que uma página inteira, não pode ser dividido
      while (acumuladoY > conteudoPorPagina) {
        acumuladoY -= conteudoPorPagina;
      }
    }

    // Total de páginas = quantidade de espaçadores + 1
    return el.querySelectorAll('.page-spacer').length + 1;
  }, [editorRef, pageH, stateRef]);

  /**
   * PROTEÇÃO AUTOMÁTICA:
   * Um MutationObserver que vigia o editor. Se o usuário deletar um
   * espaçador acidentalmente (ex: selecionando tudo e apagando),
   * ele é automaticamente recriado.
   */
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    // Flag para evitar loop infinito (o observer não deve reagir às suas próprias mudanças)
    const isAtualizando = { current: false };

    const observer = new MutationObserver((mutations) => {
      if (isAtualizando.current) return;

      // Verificar se algum espaçador foi removido
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

      // Se foi removido, recalcular no próximo frame de animação
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
  }, [editorRef, atualizarEspacadores]);

  return {
    removerEspacadores,
    obterHTMLLimpo,
    atualizarEspacadores,
  };
}
