/**
 * ============================================================================
 * useKeyboardShortcuts — Atalhos de teclado do editor
 * ============================================================================
 *
 * O QUE FAZ:
 *   Escuta teclas do teclado e executa ações como desfazer (Ctrl+Z),
 *   refazer (Ctrl+Y), deletar elemento selecionado, abrir busca, etc.
 *
 * POR QUE EXISTE:
 *   Um editor de texto precisa de atalhos para ser produtivo. Em vez de
 *   clicar em botões, o usuário pode usar combinações de teclas.
 *
 * ATALHOS DISPONÍVEIS:
 *   - ESC: Desselecionar imagem/tabela ou fechar modo de edição
 *   - Delete/Backspace: Remover imagem/tabela selecionada
 *   - Tab: Inserir espaço de tabulação (4 espaços) em vez de pular campo
 *   - Ctrl+Z: Desfazer última ação
 *   - Ctrl+Shift+Z ou Ctrl+Y: Refazer ação desfeita
 *   - Ctrl+H: Abrir/fechar busca e substituição
 * ============================================================================
 */

import { useEffect } from 'react';

interface UseKeyboardShortcutsParams {
  /** Referência para a DIV editável principal */
  editorRef: React.RefObject<HTMLDivElement | null>;
  /** Elemento atualmente selecionado (imagem, tabela, QR Code) */
  selectedElement: HTMLElement | null;
  /** Se está editando cabeçalho ou rodapé ('header' | 'footer' | null) */
  editingHF: 'header' | 'footer' | null;
  /** Aba ativa da toolbar (ex: 'Inicio', 'Imagem', 'Tabela') */
  activeTab: string;
  /** Função para alterar um valor do estado do editor */
  set: (key: string, value: any) => void;
  /** Função para limpar o elemento selecionado */
  clearSelection: () => void;
  /** Função que executa desfazer */
  onUndo: () => void;
  /** Função que executa refazer */
  onRedo: () => void;
  /** Função para atualizar estatísticas (contagem de palavras, páginas, etc.) */
  updateStats: () => void;
  /** Função que retorna o HTML limpo do editor */
  obterHTMLLimpo: () => string;
  /** Função para salvar um estado no histórico */
  pushState: (html: string) => void;
  /** Callback chamado quando o conteúdo muda */
  onChange?: (html: string) => void;
  /** Função para abrir/fechar o painel de busca e substituição */
  toggleFindReplace: () => void;
}

export function useKeyboardShortcuts({
  editorRef,
  selectedElement,
  editingHF,
  activeTab,
  set,
  clearSelection,
  onUndo,
  onRedo,
  updateStats,
  obterHTMLLimpo,
  pushState,
  onChange,
  toggleFindReplace,
}: UseKeyboardShortcutsParams) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ── ESC: sair do modo de seleção ou edição ──
      if (e.key === 'Escape') {
        // Se está editando cabeçalho/rodapé, o componente HeaderFooterZone
        // cuida do ESC sozinho, então não fazemos nada aqui
        if (editingHF) return;

        // Se tem uma imagem/tabela selecionada, desselecionar
        if (selectedElement) {
          e.preventDefault();
          clearSelection();
          return;
        }
      }

      // ── Delete/Backspace: remover elemento selecionado ──
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
        // Verificar se o foco NÃO está em um campo de texto (input/textarea)
        // para não impedir que o usuário apague texto normalmente
        const active = document.activeElement;
        const isTyping = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';
        if (!isTyping) {
          e.preventDefault();
          selectedElement.remove(); // Remover o elemento do DOM
          clearSelection();
          updateStats();
          const htmlLimpo = obterHTMLLimpo();
          pushState(htmlLimpo);
          onChange?.(htmlLimpo);
          return;
        }
      }

      // ── Tab: inserir tabulação ──
      // Normalmente Tab pula para o próximo campo do formulário.
      // No editor, queremos que insira 4 espaços como tabulação.
      if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
        const el = editorRef.current;
        if (el && document.activeElement === el) {
          e.preventDefault();
          document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
          return;
        }
      }

      // ── Atalhos com Ctrl (ou Cmd no Mac) ──
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+H: abrir/fechar busca e substituição
        if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          toggleFindReplace();
          return;
        }

        // Ctrl+Z: desfazer
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          onUndo();
        }
        // Ctrl+Shift+Z ou Ctrl+Y: refazer
        else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          onRedo();
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [
    editorRef,
    selectedElement,
    editingHF,
    activeTab,
    set,
    clearSelection,
    onUndo,
    onRedo,
    updateStats,
    obterHTMLLimpo,
    pushState,
    onChange,
    toggleFindReplace,
  ]);
}
