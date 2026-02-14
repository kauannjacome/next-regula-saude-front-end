/**
 * ============================================================================
 * useDragDrop — Arrastar e soltar imagens no editor
 * ============================================================================
 *
 * O QUE FAZ:
 *   Permite que o usuário arraste uma imagem do computador e solte em
 *   qualquer parte do documento: cabeçalho, corpo ou rodapé.
 *
 * POR QUE EXISTE:
 *   Arrastar e soltar é a forma mais intuitiva de adicionar imagens.
 *   O desafio é que o editor tem 3 zonas (cabeçalho, corpo, rodapé) e
 *   precisamos detectar em qual zona o mouse está para inserir a imagem
 *   no lugar certo.
 *
 * COMO FUNCIONA:
 *   1. Quando o usuário arrasta algo sobre o editor, detectamos a zona
 *      pelo eixo Y do mouse (comparando com as margens)
 *   2. Mostramos um destaque visual na zona correta
 *   3. Quando solta, inserimos a imagem na zona detectada:
 *      - Cabeçalho/Rodapé: ativa edição da zona e adiciona a imagem
 *      - Corpo: posiciona o cursor no ponto exato do drop e insere
 *
 * RETORNA:
 *   - dragZonaAtiva: qual zona está com destaque ('header' | 'body' | 'footer' | null)
 *   - handleDragOverPagina: handler para quando algo é arrastado sobre a página
 *   - handleDragLeavePagina: handler para quando o drag sai da página
 *   - handleDropPagina: handler para quando algo é solto na página
 * ============================================================================
 */

import { useState, useCallback } from 'react';

interface UseDragDropParams {
  /** Referência para o container da página (div que envolve tudo) */
  pageContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Referência para a DIV editável principal (corpo do texto) */
  editorRef: React.RefObject<HTMLDivElement | null>;
  /** Referência mutável para o estado atual do editor */
  stateRef: React.MutableRefObject<any>;
  /** Qual zona de cabeçalho/rodapé está sendo editada agora */
  editingHF: 'header' | 'footer' | null;
  /** Função para ativar edição de cabeçalho/rodapé */
  setEditingHF: (hf: 'header' | 'footer' | null) => void;
  /** Callback para quando o conteúdo do corpo muda (após inserir imagem) */
  handleInput: () => void;
}

export function useDragDrop({
  pageContainerRef,
  editorRef,
  stateRef,
  editingHF,
  setEditingHF,
  handleInput,
}: UseDragDropParams) {
  /**
   * Qual zona está recebendo o destaque de "arraste aqui":
   * - 'header': cabeçalho está destacado
   * - 'body': corpo está destacado
   * - 'footer': rodapé está destacado
   * - null: nada sendo arrastado
   */
  const [dragZonaAtiva, setDragZonaAtiva] = useState<'header' | 'body' | 'footer' | null>(null);

  /**
   * Detecta em qual zona o mouse está baseado na posição vertical (Y).
   *
   * LÓGICA:
   * - Se Y está acima da margem superior → cabeçalho
   * - Se Y está abaixo de (altura - margem inferior) → rodapé
   * - Caso contrário → corpo
   */
  const detectarZonaDrag = useCallback(
    (clientY: number): 'header' | 'body' | 'footer' => {
      const container = pageContainerRef.current;
      if (!container) return 'body';

      const rect = container.getBoundingClientRect();
      const zoom = stateRef.current.zoom / 100;

      // Converter posição do mouse para posição relativa dentro do container
      // dividindo pelo zoom (porque o container está escalado)
      const relativeY = (clientY - rect.top) / zoom;

      if (relativeY < stateRef.current.margins.top) return 'header';
      if (relativeY > rect.height / zoom - stateRef.current.margins.bottom) return 'footer';
      return 'body';
    },
    [pageContainerRef, stateRef]
  );

  /**
   * Chamado continuamente enquanto algo é arrastado sobre a página.
   * Detecta a zona e ativa o destaque visual.
   */
  const handleDragOverPagina = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault(); // Necessário para permitir o drop
      e.dataTransfer.dropEffect = 'copy';
      const zona = detectarZonaDrag(e.clientY);
      setDragZonaAtiva(zona);
    },
    [detectarZonaDrag]
  );

  /**
   * Chamado quando o drag sai completamente da página.
   * Remove o destaque visual.
   */
  const handleDragLeavePagina = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    const container = e.currentTarget as HTMLElement;
    // Só remove o destaque se o mouse realmente saiu do container
    // (não se apenas passou sobre um elemento filho)
    if (!related || !container.contains(related)) {
      setDragZonaAtiva(null);
    }
  }, []);

  /**
   * Insere uma imagem no corpo do editor a partir de um arquivo.
   * Converte o arquivo para base64 e usa insertHTML para inserir.
   */
  const inserirImagemNoEditor = useCallback(
    (arquivo: File) => {
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
    },
    [editorRef, handleInput]
  );

  /**
   * Chamado quando o usuário solta arquivo(s) na página.
   *
   * LÓGICA:
   * 1. Filtra apenas arquivos de imagem
   * 2. Detecta a zona (cabeçalho, corpo ou rodapé)
   * 3. Se cabeçalho/rodapé: ativa edição e insere a imagem lá
   * 4. Se corpo: posiciona o cursor no ponto do drop e insere
   */
  const handleDropPagina = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const zona = detectarZonaDrag(e.clientY);
      setDragZonaAtiva(null);

      // Filtrar apenas imagens
      const arquivos = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (arquivos.length === 0) return;

      if (zona === 'header' || zona === 'footer') {
        // ── Inserir imagem no cabeçalho ou rodapé ──
        const tipoHF = zona;

        // Ativar edição se não estiver ativa
        if (editingHF !== tipoHF) {
          setEditingHF(tipoHF);
        }

        // Esperar 150ms para a edição ser ativada e o DOM atualizar
        setTimeout(() => {
          const hfZone = document.querySelector(
            `[data-hf-zone="${tipoHF}"]`
          ) as HTMLElement | null;
          if (!hfZone) return;

          arquivos.forEach((arq) => {
            const leitor = new FileReader();
            leitor.onload = (ev) => {
              const src = ev.target?.result as string;
              const img = document.createElement('img');
              img.src = src;
              img.style.maxWidth = '100%';
              img.style.height = 'auto';
              img.style.objectFit = 'contain';
              hfZone.appendChild(img);

              // Disparar evento de input para acionar o salvamento automático
              const inputEvent = new Event('input', { bubbles: true });
              hfZone.dispatchEvent(inputEvent);
            };
            leitor.readAsDataURL(arq);
          });
        }, 150);
      } else {
        // ── Inserir imagem no corpo do editor ──
        const el = editorRef.current;
        if (!el) return;
        el.focus();

        // Tentar posicionar o cursor exatamente onde o usuário soltou
        if (document.caretRangeFromPoint) {
          const range = document.caretRangeFromPoint(e.clientX, e.clientY);
          if (range) {
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        }

        arquivos.forEach((arq) => inserirImagemNoEditor(arq));
      }
    },
    [detectarZonaDrag, editingHF, setEditingHF, editorRef, inserirImagemNoEditor]
  );

  return {
    dragZonaAtiva,
    setDragZonaAtiva,
    handleDragOverPagina,
    handleDragLeavePagina,
    handleDropPagina,
    inserirImagemNoEditor,
  };
}
