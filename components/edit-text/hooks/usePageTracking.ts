/**
 * ============================================================================
 * usePageTracking — Rastreamento da página atual pelo scroll
 * ============================================================================
 *
 * O QUE FAZ:
 *   Detecta em qual página o usuário está olhando baseado na posição do
 *   scroll (rolagem) da tela.
 *
 * POR QUE EXISTE:
 *   Precisamos saber a página atual para:
 *   - Mostrar "Página 2 de 5" na barra inferior
 *   - Exibir o número correto nos chips {{pagina}} do cabeçalho/rodapé
 *
 * COMO FUNCIONA:
 *   1. Escuta o evento de scroll do container principal
 *   2. Usa um temporizador (debounce de 50ms) para não recalcular a cada pixel
 *   3. Divide a posição do scroll pela altura de uma página para descobrir
 *      em qual página estamos
 *
 * RETORNA:
 *   - currentPage: número da página visível no momento (começa em 1)
 * ============================================================================
 */

import { useState, useEffect, useRef } from 'react';

interface UsePageTrackingParams {
  /** Referência para o elemento que tem a barra de rolagem */
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Altura total de uma página em pixels */
  pageH: number;
  /** Margens da página (top, bottom) */
  margins: { top: number; bottom: number };
  /** Nível de zoom atual (100 = normal, 150 = 150%) */
  zoom: number;
  /** Quantidade total de páginas no documento */
  totalPages: number;
}

export function usePageTracking({
  scrollContainerRef,
  pageH,
  margins,
  zoom,
  totalPages,
}: UsePageTrackingParams) {
  // Página atual (começa em 1)
  const [currentPage, setCurrentPage] = useState(1);

  // Temporizador para não recalcular o tempo todo durante o scroll
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    /**
     * Calcula qual página está visível baseado na posição do scroll.
     *
     * LÓGICA:
     * - Cada "página visual" tem: conteúdo + margem inferior + gap + margem superior
     * - Dividimos a posição do scroll por esse valor total para saber a página
     * - Aplicamos o zoom porque o conteúdo está escalado visualmente
     */
    const calcularPagina = () => {
      const scrollTop = container.scrollTop;

      // Altura da área de conteúdo de cada página
      const conteudoPorPagina = pageH - margins.top - margins.bottom;

      // Espaço entre páginas: rodapé + gap visual + cabeçalho
      const alturaGap = margins.bottom + 8 + margins.top;

      // Altura total de uma "página visual" completa
      const alturaPaginaTotal = conteudoPorPagina + alturaGap;

      // Fator de escala do zoom (1.0 = 100%, 1.5 = 150%)
      const escalaZoom = zoom / 100;

      // Calcular página atual garantindo que fique entre 1 e totalPages
      const pagina = Math.min(
        totalPages,
        Math.max(1, Math.floor(scrollTop / (alturaPaginaTotal * escalaZoom)) + 1)
      );

      setCurrentPage(pagina);
    };

    /**
     * Handler de scroll com debounce:
     * Em vez de recalcular a cada pixel que o usuário rola, esperamos 50ms
     * depois que ele para de rolar. Isso evita lentidão.
     */
    const handleScroll = () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(calcularPagina, 50);
    };

    // O { passive: true } diz ao navegador que não vamos chamar preventDefault(),
    // permitindo scroll mais suave
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [scrollContainerRef, pageH, margins, zoom, totalPages]);

  return { currentPage, setCurrentPage };
}
