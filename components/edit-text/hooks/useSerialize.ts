/**
 * ============================================================================
 * useSerialize — Serialização (empacotamento) do documento
 * ============================================================================
 *
 * O QUE FAZ:
 *   Pega todo o estado atual do editor e empacota em um objeto JSON que pode
 *   ser salvo no banco de dados. Inclui: HTML do corpo, marcadores (variáveis),
 *   configuração da página, modelos do banco de dados e textos rápidos.
 *
 * POR QUE EXISTE:
 *   Quando o usuário clica "Salvar", precisamos pegar tudo que ele fez no
 *   editor e transformar em dados que podem ser armazenados e depois
 *   recarregados para continuar editando.
 *
 * O QUE É SERIALIZADO:
 *   - html: o conteúdo HTML puro (sem espaçadores de página)
 *   - markers: lista de variáveis encontradas no texto (ex: {{cidadão.nome}})
 *   - pageConfig: configurações da página (tamanho, margens, orientação, etc.)
 *   - dbModels: esquema do banco de dados disponível para variáveis
 *   - quickTexts: textos rápidos configurados
 *
 * MARCADORES (MARKERS):
 *   Procuramos padrões como {{tabela.campo}} no HTML. Cada um vira um
 *   marcador que a aplicação pode usar para substituir por dados reais
 *   quando gerar o documento final.
 * ============================================================================
 */

import { useCallback } from 'react';
import type { SerializedDocument, Marker, DatabaseTable, QuickText } from '../types';

interface UseSerializeParams {
  /** Referência mutável para o estado atual do editor */
  stateRef: React.MutableRefObject<any>;
  /** Lista de tabelas do banco de dados disponíveis */
  databaseSchema: DatabaseTable[];
  /** Lista de textos rápidos */
  quickTextsList: QuickText[];
  /** Função que retorna o HTML limpo do editor */
  obterHTMLLimpo: () => string;
}

export function useSerialize({
  stateRef,
  databaseSchema,
  quickTextsList,
  obterHTMLLimpo,
}: UseSerializeParams) {
  /**
   * Empacota todo o estado do editor em um único objeto.
   *
   * PASSOS:
   * 1. Pega o HTML limpo (sem espaçadores)
   * 2. Procura todas as variáveis {{...}} no HTML
   * 3. Classifica cada uma como:
   *    - 'variable': se tem formato tabela.campo (ex: {{cidadão.nome}})
   *    - 'text': se é outro formato (ex: {{data_atual}})
   * 4. Monta o objeto com HTML, marcadores, configuração e dados auxiliares
   */
  const serialize = useCallback((): SerializedDocument => {
    const html = obterHTMLLimpo();

    // Encontrar todas as variáveis no formato {{...}}
    const markers: Marker[] = [];
    const markerRegex = /\{\{([^}]+)\}\}/g;
    let match: RegExpExecArray | null;

    while ((match = markerRegex.exec(html)) !== null) {
      const full = match[1]; // Texto dentro das chaves (sem os {{}})
      const parts = full.split('.');

      if (parts.length === 2) {
        // Formato tabela.campo → é uma variável de banco de dados
        markers.push({
          type: 'variable',
          value: match[0],
          table: parts[0],
          field: parts[1],
        });
      } else {
        // Outro formato → é um texto/marcador genérico
        markers.push({ type: 'text', value: match[0] });
      }
    }

    // Montar o pacote completo
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
        // Campos de cabeçalho/rodapé diferenciado por página
        primeiraPaginaDiferente: stateRef.current.primeiraPaginaDiferente,
        parImparDiferente: stateRef.current.parImparDiferente,
        primeiraPaginaHeaderHTML: stateRef.current.primeiraPaginaHeaderHTML,
        primeiraPaginaFooterHTML: stateRef.current.primeiraPaginaFooterHTML,
        paginasParesHeaderHTML: stateRef.current.paginasParesHeaderHTML,
        paginasParesFooterHTML: stateRef.current.paginasParesFooterHTML,
      },
      dbModels: databaseSchema.map((t) => ({
        table: t.tableName,
        displayName: t.displayName,
        fields: t.fields.map((f) => ({ label: f.label, value: f.value })),
      })),
      quickTexts: quickTextsList,
    };
  }, [stateRef, databaseSchema, quickTextsList, obterHTMLLimpo]);

  return { serialize };
}
