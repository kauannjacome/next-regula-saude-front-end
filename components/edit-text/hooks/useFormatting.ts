import { useCallback, useRef, useEffect } from 'react';
import { QRCodeHelper } from '../utils/QRCodeHelper';

export function useFormatting(editorRef: React.RefObject<HTMLDivElement | null>) {
  const savedRange = useRef<Range | null>(null);
  // Track the last contentEditable element that had focus (body, header zone, footer zone)
  const lastEditableRef = useRef<HTMLElement | null>(null);

  // ********** EXPLICAÇÃO PARA LEIGOS:
  // Quando o usuário seleciona um texto, o navegador nos dá um "Node" (nó do DOM).
  // Mas às vezes o usuário clica dentro de uma tag <b> ou <span>.
  // Esta função sobe na hierarquia (pai do pai do pai...) até achar o elemento principal
  // que é editável (contentEditable="true"), para sabermos onde estamos mexendo.
  const findEditableAncestor = (node: Node | null): HTMLElement | null => {
    let current: Node | null = node;
    while (current && current !== document) {
      if (current instanceof HTMLElement && current.isContentEditable) return current;
      current = current.parentNode;
    }
    return null;
  };

  // Continuously save the selection while a contentEditable is focused
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    // ********** POR QUE ISSO É NECESSÁRIO?
    // Em React, quando clicamos em um botão da barra de ferramentas (ex: Negrito),
    // o editor PERDE o foco (o foco vai para o botão).
    // Se o foco sai, o navegador "esquece" qual texto estava selecionado.
    // Então, salvamos a seleção (Range) toda vez que o usuário solta o mouse (mouseup)
    // ou solta uma tecla (keyup), para podermos restaurar depois.
    const saveSelection = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const editable = findEditableAncestor(range.commonAncestorContainer);
        if (editable) {
          savedRange.current = range.cloneRange();
          lastEditableRef.current = editable;
        }
      }
    };

    el.addEventListener('keyup', saveSelection);
    el.addEventListener('mouseup', saveSelection);
    el.addEventListener('focus', saveSelection);

    // Também ouve mudanças globais de seleção (caso o usuário selecione algo fora e volte)
    const onSelChange = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const editable = findEditableAncestor(sel.anchorNode);
        if (editable) {
          savedRange.current = sel.getRangeAt(0).cloneRange();
          lastEditableRef.current = editable;
        }
      }
    };
    document.addEventListener('selectionchange', onSelChange);

    return () => {
      el.removeEventListener('keyup', saveSelection);
      el.removeEventListener('mouseup', saveSelection);
      el.removeEventListener('focus', saveSelection);
      document.removeEventListener('selectionchange', onSelChange);
    };
  }, [editorRef]);

  // Find the best contentEditable to target right now
  const findTargetEditable = useCallback((): HTMLElement | null => {
    // 1. If something contentEditable is already focused, use it
    const activeEl = document.activeElement as HTMLElement | null;
    if (activeEl && activeEl.isContentEditable) return activeEl;

    // 2. If savedRange points into a still-contentEditable element, use that
    if (savedRange.current) {
      const editable = findEditableAncestor(savedRange.current.commonAncestorContainer);
      if (editable && editable.isContentEditable) return editable;
    }

    // 3. If we remember the last editable and it's still contentEditable, use it
    if (lastEditableRef.current && lastEditableRef.current.isContentEditable && lastEditableRef.current.isConnected) {
      return lastEditableRef.current;
    }

    // 4. Fallback: the main editor (if it's contentEditable)
    const el = editorRef.current;
    if (el && el.isContentEditable) return el;

    return null;
  }, [editorRef]);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel) return;

    const target = findTargetEditable();
    if (!target) return;

    target.focus();

    // Try to restore the saved range if it belongs to the target element
    if (savedRange.current) {
      const rangeEditable = findEditableAncestor(savedRange.current.commonAncestorContainer);
      if (rangeEditable === target) {
        try {
          sel.removeAllRanges();
          sel.addRange(savedRange.current);
          return;
        } catch { /* range is stale, fall through */ }
      }
    }

    // Fallback: place cursor at end of the target element
    try {
      const range = document.createRange();
      range.selectNodeContents(target);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch { /* ignore */ }
  }, [findTargetEditable]);

  // Apply inline formatting styles to variable chips within the current selection
  const applyFormattingToVariableChips = useCallback((cmd: string) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const parent = container instanceof HTMLElement ? container : container.parentElement;
    if (!parent) return;

    // Find all variable chips that intersect the selection
    const chips = parent.querySelectorAll('.dynamic-variable-chip');
    chips.forEach((chip) => {
      if (!range.intersectsNode(chip)) return;
      const el = chip as HTMLElement;
      switch (cmd) {
        case 'bold':
          el.style.fontWeight = el.style.fontWeight === 'bold' ? '' : 'bold';
          break;
        case 'italic':
          el.style.fontStyle = el.style.fontStyle === 'italic' ? '' : 'italic';
          break;
        case 'underline':
          el.style.textDecoration = el.style.textDecoration === 'underline' ? '' : 'underline';
          break;
        case 'strikeThrough':
          el.style.textDecoration = el.style.textDecoration === 'line-through' ? '' : 'line-through';
          break;
      }
    });
  }, []);

  const execCommand = useCallback((cmd: string, value?: string) => {
    restoreSelection();

    // Handle lineHeight as a special case (not a real execCommand)
    if (cmd === 'lineHeight') {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const target = findTargetEditable() || editorRef.current;
      if (!target) return;
      const node = sel.anchorNode;
      const block = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement;
      const closest = block?.closest('p, div, li, h1, h2, h3, h4, h5, h6') as HTMLElement | null;
      if (closest && target.contains(closest)) {
        closest.style.lineHeight = value || '';
      } else {
        target.style.lineHeight = value || '';
      }
      target.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    // ********** COMANDO BÁSICO DO NAVEGADOR
    // document.execCommand é uma função antiga mas ainda usada para formatação simples
    // como negrito, itálico, sublinhado.
    // O segundo argumento 'false' é para não mostrar interface padrão do navegador (se houvesse).
    document.execCommand(cmd, false, value ?? undefined);

    // Enhanced removeFormat: also strip background-color highlights that browser doesn't clear
    if (cmd === 'removeFormat') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const root = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as HTMLElement;
        if (root) {
          // Remove background-color from spans and marks in selection
          root.querySelectorAll('span, mark').forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (range.intersectsNode(el)) {
              htmlEl.style.backgroundColor = '';
              htmlEl.style.background = '';
              // If mark, unwrap it
              if (el.tagName === 'MARK') {
                const parent = el.parentNode;
                while (el.firstChild) {
                  parent?.insertBefore(el.firstChild, el);
                }
                parent?.removeChild(el);
              }
            }
          });
        }
      }
    }

    // Apply formatting to variable chips in selection for bold/italic/underline
    if (['bold', 'italic', 'underline', 'strikeThrough'].includes(cmd)) {
      applyFormattingToVariableChips(cmd);
    }

    // Dispatch input on whichever editable is active
    const active = findTargetEditable();
    if (active) {
      active.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, [restoreSelection, editorRef, findTargetEditable, applyFormattingToVariableChips]);

  const setFontSize = useCallback((size: number) => {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontSize = size + 'pt';
    try {
      range.surroundContents(span);
    } catch {
      document.execCommand('fontSize', false, '7');
      const target = findTargetEditable() || editorRef.current;
      target?.querySelectorAll('font[size="7"]').forEach(el => {
        const s = document.createElement('span');
        s.style.fontSize = size + 'pt';
        s.innerHTML = el.innerHTML;
        el.replaceWith(s);
      });
    }
    const target = findTargetEditable() || editorRef.current;
    target?.dispatchEvent(new Event('input', { bubbles: true }));
  }, [restoreSelection, editorRef, findTargetEditable]);

  const setFontFamily = useCallback((family: string) => {
    execCommand('fontName', family);
  }, [execCommand]);

  const insertHTML = useCallback((html: string) => {
    restoreSelection();

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) {
      // Last resort: if restoreSelection failed, try to find and focus any editable
      const target = findTargetEditable();
      if (target) {
        target.focus();
        // Try execCommand as final attempt
        document.execCommand('insertHTML', false, html);
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return;
    }

    // Use Range API directly - more reliable than execCommand in React 19
    const range = sel.getRangeAt(0);
    range.deleteContents();

    const temp = document.createElement('div');
    temp.innerHTML = html;
    const frag = document.createDocumentFragment();
    let lastChild: Node | null = null;
    while (temp.firstChild) {
      lastChild = frag.appendChild(temp.firstChild);
    }
    range.insertNode(frag);

    // Move cursor after inserted content
    if (lastChild) {
      const newRange = document.createRange();
      newRange.setStartAfter(lastChild);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }

    const target = findTargetEditable();
    if (target) {
      target.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, [restoreSelection, findTargetEditable]);

  const insertTable = useCallback((rows: number, cols: number) => {
    let html = '<table style="width:100%;border-collapse:collapse;">';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        const tag = r === 0 ? 'th' : 'td';
        html += `<${tag} style="border:1px solid #d1d5db;padding:8px;min-width:40px;">&nbsp;</${tag}>`;
      }
      html += '</tr>';
    }
    html += '</table><p><br></p>';
    insertHTML(html);
  }, [insertHTML]);

  const insertPageBreak = useCallback(() => {
    insertHTML('<hr class="page-break-marker" contenteditable="false"><p><br></p>');
  }, [insertHTML]);

  const insertVariable = useCallback((varName: string) => {
    const chip = `<span class="dynamic-variable-chip" contenteditable="false">${varName}</span>&nbsp;`;
    insertHTML(chip);
  }, [insertHTML]);

  const insertQRCode = useCallback(async (text: string, size?: number) => {
    const html = QRCodeHelper.createHTML(text, size);
    insertHTML(html);
    // Atualizar src das imagens QR recem-inseridas (async)
    const target = findTargetEditable() || editorRef.current;
    if (target) {
      await QRCodeHelper.updatePendingQRCodes(target);
      target.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, [insertHTML, findTargetEditable, editorRef]);

  const changeCase = useCallback((type: 'upper' | 'lower' | 'title' | 'sentence') => {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    let text = sel.toString();
    switch (type) {
      case 'upper': text = text.toUpperCase(); break;
      case 'lower': text = text.toLowerCase(); break;
      case 'title': text = text.replace(/\b\w/g, c => c.toUpperCase()); break;
      case 'sentence': text = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(); break;
    }
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    const target = findTargetEditable() || editorRef.current;
    target?.dispatchEvent(new Event('input', { bubbles: true }));
  }, [restoreSelection, editorRef, findTargetEditable]);

  return {
    execCommand,
    setFontSize,
    setFontFamily,
    insertHTML,
    insertTable,
    insertPageBreak,
    insertVariable,
    insertQRCode,
    changeCase,
    restoreSelection,
  };
}
