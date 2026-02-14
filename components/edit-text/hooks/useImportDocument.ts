/**
 * ============================================================================
 * useImportDocument — Importação de arquivos para o editor
 * ============================================================================
 *
 * O QUE FAZ:
 *   Permite que o usuário importe um arquivo existente (.docx, .html, .txt)
 *   e carregue seu conteúdo dentro do editor.
 *
 * POR QUE EXISTE:
 *   Muitos usuários já têm documentos prontos e querem editá-los no sistema.
 *   Sem essa funcionalidade, teriam que copiar e colar tudo manualmente.
 *
 * FORMATOS SUPORTADOS:
 *   - .docx: Envia o arquivo para a API /api/import-docx que converte para HTML
 *   - .html/.htm: Lê o HTML diretamente e coloca no editor
 *   - .txt: Lê o texto e converte cada linha em um parágrafo <p>
 *   - .doc: NÃO suportado (formato antigo do Word, muito complexo)
 *
 * COMO FUNCIONA:
 *   1. Se nenhum arquivo foi passado, abre um seletor de arquivos
 *   2. Processa o arquivo baseado na extensão
 *   3. Coloca o conteúdo no editor
 *   4. Atualiza estatísticas e histórico
 * ============================================================================
 */

import { useCallback } from 'react';

interface UseImportDocumentParams {
  /** Referência para a DIV editável principal */
  editorRef: React.RefObject<HTMLDivElement | null>;
  /** Função para recalcular estatísticas (palavras, páginas, etc.) */
  updateStats: () => void;
  /** Função que retorna o HTML limpo do editor */
  obterHTMLLimpo: () => string;
  /** Função para salvar no histórico de undo/redo */
  pushState: (html: string) => void;
  /** Callback chamado quando o conteúdo muda */
  onChange?: (html: string) => void;
}

export function useImportDocument({
  editorRef,
  updateStats,
  obterHTMLLimpo,
  pushState,
  onChange,
}: UseImportDocumentParams) {
  /**
   * Processa o arquivo importado e coloca o conteúdo no editor.
   *
   * LÓGICA POR FORMATO:
   * - .doc: Alerta que não é suportado
   * - .docx: Envia para API do backend que converte DOCX → HTML
   * - .html/.htm: Parseia o HTML e usa o <body>
   * - .txt: Transforma cada linha em um parágrafo <p>
   */
  const processImport = useCallback(
    async (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const el = editorRef.current;
      if (!el) return;

      if (ext === 'doc') {
        // Formato .doc é muito antigo e complexo para converter no navegador
        alert(
          'Formato .doc (Word antigo) não é suportado. Abra o arquivo no Word e salve como .docx.'
        );
        return;
      } else if (ext === 'docx') {
        try {
          // Enviar o arquivo para o servidor converter
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

          // Formatar tabelas para ficarem bonitas no editor
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlContent, 'text/html');
          doc.querySelectorAll('table').forEach((table) => {
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';
            table.style.margin = '10px 0';
            table.querySelectorAll<HTMLTableCellElement>('td, th').forEach((cell) => {
              cell.style.border = '1px solid #888';
              cell.style.padding = '8px';
              cell.style.verticalAlign = 'top';
            });
          });
          el.innerHTML = doc.body.innerHTML;
        } catch (err) {
          console.error('Erro ao importar DOCX:', err);
          alert(
            'Erro ao importar: ' +
              (err instanceof Error ? err.message : 'erro desconhecido')
          );
          return;
        }
      } else if (ext === 'html' || ext === 'htm') {
        // Ler o arquivo como texto e extrair o <body>
        const text = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        el.innerHTML = doc.body.innerHTML;
      } else if (ext === 'txt') {
        // Cada linha vira um parágrafo
        const text = await file.text();
        el.innerHTML = `<p>${text.replace(/\n/g, '</p><p>')}</p>`;
      }

      // Atualizar tudo após importar
      updateStats();
      const htmlLimpo = obterHTMLLimpo();
      pushState(htmlLimpo);
      onChange?.(htmlLimpo);
    },
    [editorRef, updateStats, obterHTMLLimpo, pushState, onChange]
  );

  /**
   * Abre o seletor de arquivos ou processa um arquivo já fornecido.
   *
   * USO:
   * - importFile() → abre seletor de arquivos
   * - importFile(arquivo) → processa o arquivo diretamente
   */
  const importFile = useCallback(
    async (file?: File) => {
      let f = file;
      if (!f) {
        // Criar um <input type="file"> invisível e clicá-lo
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.docx,.doc,.html,.htm,.txt';
        return new Promise<void>((resolve) => {
          input.onchange = async () => {
            f = input.files?.[0];
            if (!f) {
              resolve();
              return;
            }
            await processImport(f);
            resolve();
          };
          input.click();
        });
      }
      await processImport(f);
    },
    [processImport]
  );

  return { importFile };
}
