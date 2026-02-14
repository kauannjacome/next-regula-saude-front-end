/**
 * ============================================================================
 * useExportDocument — Exportação do documento para PDF, DOCX, HTML ou TXT
 * ============================================================================
 *
 * O QUE FAZ:
 *   Transforma o conteúdo do editor em um arquivo para download.
 *   O formato mais complexo é o PDF, que precisa:
 *   - Dividir o conteúdo em páginas
 *   - Renderizar cabeçalho/rodapé de cada página como imagem
 *   - Substituir variáveis como {{pagina}} e {{total}} por números reais
 *
 * POR QUE EXISTE:
 *   O editor trabalha com HTML puro. Quando o usuário quer baixar o documento,
 *   precisamos converter esse HTML para o formato desejado.
 *
 * FORMATOS SUPORTADOS:
 *   - PDF: usa jsPDF + html2canvas para gerar um PDF real com páginas
 *   - DOCX: cria um HTML com namespace do Word (compatibilidade básica)
 *   - HTML: exporta o HTML puro do editor
 *   - TXT: exporta apenas o texto sem formatação
 *
 * COMO O PDF FUNCIONA:
 *   1. Clona o conteúdo do editor (sem espaçadores)
 *   2. Converte o clone inteiro em uma imagem grande (canvas)
 *   3. Fatia essa imagem em pedaços do tamanho de uma página
 *   4. Para cada página, adiciona cabeçalho e rodapé renderizados separadamente
 *   5. Gera o PDF final com todas as páginas
 * ============================================================================
 */

import { useState, useCallback } from 'react';
import { PAGE_SIZES } from '../constants';
import type { ExportResult } from '../types';

interface UseExportDocumentParams {
  /** Referência para a DIV editável principal */
  editorRef: React.RefObject<HTMLDivElement | null>;
  /** Referência mutável para o estado atual do editor */
  stateRef: React.MutableRefObject<any>;
  /** Título do documento (usado como nome do arquivo) */
  docTitle: string;
  /** Função que retorna o HTML correto de cabeçalho/rodapé para cada página */
  resolverHF: (tipo: 'header' | 'footer', pagina: number) => string;
}

export function useExportDocument({
  editorRef,
  stateRef,
  docTitle,
  resolverHF,
}: UseExportDocumentParams) {
  /** Se está exportando no momento (para mostrar loading) */
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Renderiza o HTML de um cabeçalho ou rodapé como uma imagem PNG.
   *
   * COMO FUNCIONA:
   * 1. Cria uma div temporária fora da tela com o HTML do cabeçalho/rodapé
   * 2. Espera as imagens internas carregarem
   * 3. Usa html2canvas para converter essa div em uma imagem
   * 4. Retorna a imagem como string base64 (data:image/png;base64,...)
   */
  const renderHFToImage = useCallback(
    async (
      html: string,
      width: number,
      height: number,
      type: 'header' | 'footer'
    ): Promise<string | null> => {
      if (!html) return null;

      try {
        const html2canvasMod = await import('html2canvas');
        const html2canvas = html2canvasMod.default;

        const mLeft = stateRef.current.margins.left;
        const mRight = stateRef.current.margins.right;
        const fullW = width + mLeft + mRight;

        // Criar div temporária que replica a aparência da zona no editor
        const zone = document.createElement('div');
        const isHeader = type === 'header';
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

        // Container interno para o conteúdo
        const content = document.createElement('div');
        content.className = 'hf-content';
        content.style.cssText = `width: 100%; position: relative; z-index: 0; height: ${height - 18}px; overflow: visible;`;
        content.innerHTML = html;
        zone.appendChild(content);

        // Configurar imagens dentro do cabeçalho/rodapé
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
          } else {
            const limit = Math.max(20, height - 18);
            if (!img.style.maxHeight) img.style.maxHeight = limit + 'px';
            img.style.objectFit = 'contain';
          }
        });

        document.body.appendChild(zone);

        // Esperar imagens carregarem
        const images = content.querySelectorAll('img');
        if (images.length > 0) {
          await Promise.all(
            Array.from(images).map((img) => {
              if (img.complete) return Promise.resolve();
              return new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
              });
            })
          );
          await new Promise((r) => setTimeout(r, 50));
        }

        // Converter para imagem
        const canvas = await html2canvas(zone, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: fullW,
          height: height,
          windowWidth: fullW,
          backgroundColor: null, // Fundo transparente
        });

        zone.remove();
        return canvas.toDataURL('image/png');
      } catch (err) {
        console.error('Erro ao renderizar cabeçalho/rodapé:', err);
        return null;
      }
    },
    [stateRef]
  );

  /**
   * Função principal de exportação.
   *
   * PARÂMETROS:
   * - format: 'pdf' | 'docx' | 'html' | 'txt'
   * - filename: nome do arquivo (sem extensão)
   * - output: 'download' (baixar) ou 'blob' (retornar o blob)
   */
  const exportDoc = useCallback(
    async (options?: {
      format: 'pdf' | 'docx' | 'html' | 'txt';
      filename?: string;
      output?: 'download' | 'blob';
    }) => {
      const format = options?.format ?? 'pdf';
      const filename = options?.filename || docTitle;
      const html = editorRef.current?.innerHTML || '';

      // ════════════════════════════════════════════
      // EXPORTAÇÃO PDF (mais complexa)
      // ════════════════════════════════════════════
      if (format === 'pdf') {
        setIsExporting(true);

        try {
          const { jsPDF } = await import('jspdf');
          const html2canvasMod = await import('html2canvas');
          const html2canvas = html2canvasMod.default;

          const el = editorRef.current;
          if (!el) throw new Error('Editor não disponível');

          // Calcular dimensões da página
          const pageKey = stateRef.current?.pageSize as keyof typeof PAGE_SIZES;
          const pageDef = PAGE_SIZES[pageKey] || PAGE_SIZES.A4;
          const pw =
            stateRef.current.pageOrientation === 'landscape' ? pageDef.h : pageDef.w;
          const ph =
            stateRef.current.pageOrientation === 'landscape' ? pageDef.w : pageDef.h;
          const mT = stateRef.current.margins.top;
          const mB = stateRef.current.margins.bottom;
          const mL = stateRef.current.margins.left;
          const mR = stateRef.current.margins.right;
          const contentW = pw - mL - mR; // Largura útil para conteúdo
          const contentH = ph - mT - mB; // Altura útil para conteúdo

          // ── PASSO 1: Clonar o conteúdo do editor ──
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

          // Copiar conteúdo sem os espaçadores (eles são visuais, não fazem parte do documento)
          const editorClone = el.cloneNode(true) as HTMLElement;
          editorClone.querySelectorAll('.page-spacer').forEach((s) => s.remove());
          clone.innerHTML = editorClone.innerHTML;

          // ── PASSO 2: Configurar imagens para o PDF ──
          clone.querySelectorAll('img').forEach((img) => {
            const src = img.getAttribute('src') || '';
            if (src && !src.startsWith('data:')) {
              img.setAttribute('crossorigin', 'anonymous');
            } else {
              img.removeAttribute('crossorigin');
            }

            // Aplicar o tipo de disposição de texto da imagem
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
                if (!img.style.maxWidth) img.style.maxWidth = '100%';
                break;
            }
          });

          document.body.appendChild(clone);

          // Esperar imagens carregarem
          const imgs = clone.querySelectorAll('img');
          if (imgs.length > 0) {
            await Promise.all(
              Array.from(imgs).map((img) =>
                img.complete
                  ? Promise.resolve()
                  : new Promise((r) => {
                      img.onload = r;
                      img.onerror = r;
                    })
              )
            );
            await new Promise((r) => setTimeout(r, 100));
          }

          // ── PASSO 3: Converter todo o conteúdo em uma imagem grande ──
          const SCALE = 3; // Multiplicador de qualidade
          const fullCanvas = await html2canvas(clone, {
            scale: SCALE,
            useCORS: true,
            allowTaint: true,
            logging: false,
            width: contentW,
            windowWidth: contentW,
            backgroundColor: '#ffffff',
          });
          clone.remove();

          // ── PASSO 4: Calcular páginas e criar o PDF ──
          const fullH = fullCanvas.height / SCALE;
          const totalPages = Math.max(1, Math.ceil(fullH / contentH));

          const pdf = new jsPDF({
            unit: 'px',
            format: [pw, ph],
            orientation: stateRef.current.pageOrientation || 'portrait',
            hotfixes: ['px_scaling'],
          });

          // Cache para não renderizar o mesmo cabeçalho/rodapé duas vezes
          const hfCache = new Map<string, string | null>();
          const renderHFCached = async (
            htmlContent: string,
            width: number,
            height: number,
            hfType: 'header' | 'footer'
          ): Promise<string | null> => {
            const key = `${hfType}:${htmlContent}`;
            if (hfCache.has(key)) return hfCache.get(key) ?? null;
            const img = await renderHFToImage(htmlContent, width, height, hfType);
            hfCache.set(key, img);
            return img;
          };

          // ── PASSO 5: Montar cada página do PDF ──
          for (let i = 0; i < totalPages; i++) {
            if (i > 0) pdf.addPage();
            const pageNumber = i + 1;

            // Recortar a fatia desta página da imagem grande
            const srcY = i * contentH * SCALE;
            const srcH = Math.min(contentH * SCALE, fullCanvas.height - srcY);
            if (srcH <= 0) continue;

            // Criar canvas desta página
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = contentW * SCALE;
            pageCanvas.height = contentH * SCALE;
            const ctx = pageCanvas.getContext('2d')!;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            ctx.drawImage(
              fullCanvas,
              0,
              srcY,
              contentW * SCALE,
              srcH,
              0,
              0,
              contentW * SCALE,
              srcH
            );

            // Adicionar conteúdo da página ao PDF
            const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
            pdf.addImage(pageImgData, 'JPEG', mL, mT, contentW, contentH);

            // Adicionar cabeçalho (com variáveis substituídas)
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

            // Adicionar rodapé (com variáveis substituídas)
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

          // Baixar o PDF
          pdf.save(`${filename}.pdf`);
          return {
            format: 'pdf',
            filename: `${filename}.pdf`,
            mimeType: 'application/pdf',
            size: 0,
          } as ExportResult;
        } catch (err) {
          console.warn('Erro ao gerar PDF:', err);
          alert('Erro ao gerar PDF. Tente novamente.');
          return {
            format: 'pdf',
            filename: `${filename}.pdf`,
            mimeType: 'application/pdf',
            size: 0,
          } as ExportResult;
        } finally {
          setIsExporting(false);
        }
      }

      // ════════════════════════════════════════════
      // OUTROS FORMATOS (mais simples)
      // ════════════════════════════════════════════
      let blob: Blob;
      let mimeType: string;
      let ext: string;

      switch (format) {
        case 'docx':
          // Cria um HTML com namespaces do Microsoft Office para compatibilidade
          blob = new Blob(
            [
              `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">` +
                `<head><meta charset="utf-8"><style>body{font-family:Arial;font-size:12pt;}</style></head>` +
                `<body>${html}</body></html>`,
            ],
            {
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            }
          );
          mimeType = blob.type;
          ext = 'docx';
          break;
        case 'html':
          blob = new Blob(
            [
              `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename}</title></head><body>${html}</body></html>`,
            ],
            { type: 'text/html' }
          );
          mimeType = 'text/html';
          ext = 'html';
          break;
        case 'txt':
          blob = new Blob([editorRef.current?.innerText || ''], { type: 'text/plain' });
          mimeType = 'text/plain';
          ext = 'txt';
          break;
        default:
          throw new Error(`Formato não suportado: ${format}`);
      }

      // Se pediu blob, retornar sem baixar
      if (options?.output === 'blob') {
        return {
          format,
          filename: `${filename}.${ext}`,
          blob,
          mimeType,
          size: blob.size,
        } as ExportResult;
      }

      // Baixar o arquivo
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      return {
        format,
        filename: `${filename}.${ext}`,
        mimeType,
        size: blob.size,
      } as ExportResult;
    },
    [editorRef, docTitle, renderHFToImage, stateRef, resolverHF]
  );

  return { isExporting, exportDoc };
}
