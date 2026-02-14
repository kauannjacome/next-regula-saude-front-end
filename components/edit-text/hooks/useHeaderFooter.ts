/**
 * ============================================================================
 * useHeaderFooter — Gerenciamento do cabeçalho e rodapé do documento
 * ============================================================================
 *
 * O QUE FAZ:
 *   Controla a edição do cabeçalho (topo da página) e rodapé (base da página).
 *   Permite que o usuário clique nessas áreas para editá-las, e salva o
 *   conteúdo automaticamente quando sai da edição.
 *
 * POR QUE EXISTE:
 *   Cabeçalho e rodapé são áreas separadas do corpo do texto. Eles aparecem
 *   em todas as páginas e podem conter logotipos, números de página, etc.
 *   Precisamos de lógica especial para:
 *   - Decidir qual HTML mostrar (normal, primeira página, páginas pares)
 *   - Salvar no campo correto do estado
 *   - Converter chips visuais {{pagina}} de volta para texto ao salvar
 *
 * FUNCIONALIDADES:
 *   - resolverHF: decide qual HTML de cabeçalho/rodapé usar para cada página
 *   - resolverCampoHF: decide em qual campo do estado salvar
 *   - handleCloseHF: fecha a edição e salva o conteúdo
 *   - handleUpdateHeader/Footer: salva alterações enquanto edita
 *   - Listener global de mousedown para fechar ao clicar fora
 * ============================================================================
 */

import { useState, useCallback, useEffect } from 'react';

interface UseHeaderFooterParams {
  /** Referência para a DIV editável principal */
  editorRef: React.RefObject<HTMLDivElement | null>;
  /** Referência mutável para o estado atual do editor */
  stateRef: React.MutableRefObject<any>;
  /** Função para alterar um valor do estado */
  set: (key: any, value: any) => void;
  /** Objeto do hook de histórico (undo/redo) */
  history: {
    pushSnapshotDebounced: (snapshot: any) => void;
  };
  /** Função que retorna o HTML limpo do editor */
  obterHTMLLimpo: () => string;
}

export function useHeaderFooter({
  editorRef,
  stateRef,
  set,
  history,
  obterHTMLLimpo,
}: UseHeaderFooterParams) {
  /**
   * Qual zona está sendo editada agora:
   * - 'header' = cabeçalho
   * - 'footer' = rodapé
   * - null = nenhuma (corpo do texto está ativo)
   */
  const [editingHF, setEditingHF] = useState<'header' | 'footer' | null>(null);

  // ── Abrir edição ──

  /** Ativar modo de edição do cabeçalho */
  const handleEditHeader = useCallback(() => {
    setEditingHF('header');
  }, []);

  /** Ativar modo de edição do rodapé */
  const handleEditFooter = useCallback(() => {
    setEditingHF('footer');
  }, []);

  // ── Resolver qual HTML usar para cada página ──

  /**
   * Decide qual HTML de cabeçalho ou rodapé usar para uma página específica.
   *
   * LÓGICA DE PRIORIDADE:
   * 1. Se "primeira página diferente" está ativo E é a página 1 → usa o HTML da primeira página
   * 2. Se "par/ímpar diferente" está ativo E é página par → usa o HTML das páginas pares
   * 3. Caso contrário → usa o HTML padrão
   *
   * EXEMPLO:
   * - Página 1 com "primeira página diferente" → logotipo grande
   * - Página 2 (par) com "par/ímpar diferente" → logotipo pequeno à direita
   * - Página 3 (ímpar) → logotipo pequeno à esquerda
   */
  const resolverHF = useCallback(
    (tipo: 'header' | 'footer', pagina: number): string => {
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
    },
    [stateRef]
  );

  /**
   * Decide em qual campo do estado salvar o conteúdo editado.
   *
   * Se "primeira página diferente" está ativo, salva nos campos da primeira página.
   * Caso contrário, salva nos campos padrão.
   */
  const resolverCampoHF = useCallback(
    (tipo: 'header' | 'footer'): string => {
      const s = stateRef.current;
      if (tipo === 'header') {
        if (s.primeiraPaginaDiferente) return 'primeiraPaginaHeaderHTML';
        return 'headerHTML';
      } else {
        if (s.primeiraPaginaDiferente) return 'primeiraPaginaFooterHTML';
        return 'footerHTML';
      }
    },
    [stateRef]
  );

  // ── Fechar edição ──

  /**
   * Fecha o modo de edição do cabeçalho/rodapé.
   *
   * PASSOS:
   * 1. Lê o conteúdo diretamente do DOM (segurança extra)
   * 2. Converte chips visuais (ex: <span data-var="pagina">2</span>) de volta
   *    para texto ({{pagina}})
   * 3. Salva no campo correto do estado
   * 4. Volta o foco para o corpo do editor
   */
  const handleCloseHF = useCallback(() => {
    // Função que converte chips HTML de volta para marcadores de texto
    const chipToText = (html: string) =>
      html
        .replace(/<span[^>]*data-var="pagina"[^>]*>[\s\S]*?<\/span>/g, '{{pagina}}')
        .replace(/<span[^>]*data-var="total"[^>]*>[\s\S]*?<\/span>/g, '{{total}}');

    // Encontrar todas as zonas de cabeçalho/rodapé que estão em modo de edição
    const zones = document.querySelectorAll('[data-hf-zone]');
    zones.forEach((zone) => {
      if (zone.getAttribute('contenteditable') === 'true') {
        const tipo = zone.getAttribute('data-hf-zone') as 'header' | 'footer';
        const conteudo = chipToText((zone as HTMLElement).innerHTML);
        if (tipo) {
          const campo = resolverCampoHF(tipo);
          set(campo as any, conteudo);
        }
      }
    });

    // Desativar modo de edição
    setEditingHF(null);

    // Devolver o foco para o corpo do editor
    requestAnimationFrame(() => {
      const el = editorRef.current;
      if (!el) return;
      el.setAttribute('contenteditable', 'true');
      el.focus();
      // Posicionar o cursor no final do texto
      const sel = window.getSelection();
      if (sel && sel.rangeCount === 0) {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false); // false = colapsar no final
        sel.addRange(range);
      }
    });
  }, [editorRef, set, resolverCampoHF]);

  // ── Fechar ao clicar fora ──

  /**
   * Listener global que fecha a edição do cabeçalho/rodapé quando o
   * usuário clica em qualquer lugar fora da zona de edição.
   */
  useEffect(() => {
    if (!editingHF) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Se clicou dentro da zona de cabeçalho/rodapé, manter editando
      if (target.closest('[data-hf-zone]')) return;

      // Se clicou no menu de contexto (botão direito), manter editando
      if (target.closest('.hf-close-bar')) return;
      if (target.closest('[class*="z-[60]"]')) return;

      // Se clicou na toolbar do editor, manter editando
      if (target.closest('.et-editor-root > header')) return;

      // Se clicou em qualquer outro lugar, fechar
      handleCloseHF();
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [editingHF, handleCloseHF]);

  // ── Atualizar conteúdo durante edição ──

  /**
   * Salva o conteúdo do cabeçalho enquanto o usuário está editando.
   * Chamado pelo componente HeaderFooterZone a cada mudança (via onInput).
   */
  const handleUpdateHeader = useCallback(
    (html: string) => {
      const campo = resolverCampoHF('header');
      set(campo as any, html);
      const s = stateRef.current;
      history.pushSnapshotDebounced({
        body: obterHTMLLimpo(),
        header: campo === 'headerHTML' ? html : s.headerHTML,
        footer: s.footerHTML,
        primeiraPaginaHeader:
          campo === 'primeiraPaginaHeaderHTML' ? html : s.primeiraPaginaHeaderHTML,
        primeiraPaginaFooter: s.primeiraPaginaFooterHTML,
        paginasParesHeader: s.paginasParesHeaderHTML,
        paginasParesFooter: s.paginasParesFooterHTML,
      });
    },
    [set, history, stateRef, obterHTMLLimpo, resolverCampoHF]
  );

  /**
   * Salva o conteúdo do rodapé enquanto o usuário está editando.
   * Funciona igual ao handleUpdateHeader, mas para o rodapé.
   */
  const handleUpdateFooter = useCallback(
    (html: string) => {
      const campo = resolverCampoHF('footer');
      set(campo as any, html);
      const s = stateRef.current;
      history.pushSnapshotDebounced({
        body: obterHTMLLimpo(),
        header: s.headerHTML,
        footer: campo === 'footerHTML' ? html : s.footerHTML,
        primeiraPaginaHeader: s.primeiraPaginaHeaderHTML,
        primeiraPaginaFooter:
          campo === 'primeiraPaginaFooterHTML' ? html : s.primeiraPaginaFooterHTML,
        paginasParesHeader: s.paginasParesHeaderHTML,
        paginasParesFooter: s.paginasParesFooterHTML,
      });
    },
    [set, history, stateRef, obterHTMLLimpo, resolverCampoHF]
  );

  return {
    editingHF,
    setEditingHF,
    resolverHF,
    resolverCampoHF,
    handleEditHeader,
    handleEditFooter,
    handleCloseHF,
    handleUpdateHeader,
    handleUpdateFooter,
  };
}
