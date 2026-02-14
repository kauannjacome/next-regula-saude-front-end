'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { DatabaseTable, QuickText } from './types';

interface AutocompleteOption {
  label: string;
  value?: string;
  type: 'table' | 'field' | 'quicktext' | 'empty';
  tableName?: string;
  content?: string;
}

interface AutocompleteProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  database: DatabaseTable[];
  quickTexts: QuickText[];
}

interface PopupState {
  visible: boolean;
  phase: 'table' | 'field' | 'quicktext';
  options: AutocompleteOption[];
  selectedIndex: number;
  triggerIndex: number;
  contextTable: DatabaseTable | null;
  top: number;
  left: number;
}

function getCaretCoordinates(container: HTMLElement): { left: number; top: number } {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return { left: 0, top: 0 };
  const range = sel.getRangeAt(0).cloneRange();
  range.collapse(false);
  const rects = range.getClientRects();
  let rect: DOMRect | null = rects.length > 0 ? rects[0] : null;
  if (!rect) rect = range.getBoundingClientRect();
  if (rect) {
    const containerRect = container.getBoundingClientRect();
    return { left: rect.left - containerRect.left, top: rect.bottom - containerRect.top + 4 };
  }
  return { left: 0, top: 0 };
}

export default function Autocomplete({
  editorRef,
  database,
  quickTexts,
}: AutocompleteProps) {
  const [popup, setPopup] = useState<PopupState>({
    visible: false,
    phase: 'table',
    options: [],
    selectedIndex: 0,
    triggerIndex: -1,
    contextTable: null,
    top: 0,
    left: 0,
  });
  const popupRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(popup);
  stateRef.current = popup;

  const hide = useCallback(() => {
    setPopup(p => ({ ...p, visible: false }));
  }, []);

  const checkTrigger = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) { hide(); return; }

    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) { hide(); return; }

    const text = node.textContent ?? '';
    const caretPos = range.startOffset;
    const coords = getCaretCoordinates(el);

    // --- Quick text: ./ ---
    const slashIndex = text.lastIndexOf('./', caretPos);
    if (slashIndex !== -1 && slashIndex < caretPos) {
      const query = text.substring(slashIndex + 2, caretPos).toLowerCase();
      const filtered = quickTexts.filter(t => t.label.toLowerCase().includes(query));
      if (filtered.length > 0 || query === '') {
        const options: AutocompleteOption[] = (filtered.length > 0 ? filtered : quickTexts).map(t => ({
          label: t.label,
          content: t.content,
          type: 'quicktext' as const,
        }));
        if (options.length === 0) {
          options.push({ label: 'Nenhum texto salvo', type: 'empty' });
        }
        setPopup({
          visible: true, phase: 'quicktext', options, selectedIndex: 0,
          triggerIndex: slashIndex, contextTable: null, ...coords,
        });
        return;
      }
    }

    // --- Database variables: {{ ---
    const openBracesIndex = text.lastIndexOf('{{', caretPos);
    if (openBracesIndex !== -1 && openBracesIndex < caretPos) {
      const closeBracesIndex = text.indexOf('}}', openBracesIndex);
      if (closeBracesIndex !== -1 && closeBracesIndex < caretPos) {
        hide();
        return;
      }

      const query = text.substring(openBracesIndex + 2, caretPos);
      const dotIndex = query.indexOf('.');

      if (dotIndex === -1) {
        // Phase 1: Table selection
        const tableQuery = query.trim().toLowerCase();
        const filtered = database.filter(t =>
          t.tableName.toLowerCase().startsWith(tableQuery) ||
          t.displayName.toLowerCase().startsWith(tableQuery)
        );
        if (filtered.length > 0) {
          const options: AutocompleteOption[] = filtered.map(t => ({
            label: t.displayName || t.tableName,
            tableName: t.tableName,
            type: 'table' as const,
          }));
          setPopup({
            visible: true, phase: 'table', options, selectedIndex: 0,
            triggerIndex: openBracesIndex, contextTable: null, ...coords,
          });
          return;
        }
      } else {
        // Phase 2: Field selection
        const tableName = query.substring(0, dotIndex).trim().toLowerCase();
        const fieldQuery = query.substring(dotIndex + 1).trim().toLowerCase();
        const table = database.find(t => t.tableName.toLowerCase() === tableName);
        if (table) {
          const filtered = table.fields.filter(f =>
            f.value.toLowerCase().startsWith(fieldQuery) ||
            f.label.toLowerCase().startsWith(fieldQuery)
          );
          if (filtered.length > 0) {
            const options: AutocompleteOption[] = filtered.map(f => ({
              label: f.label,
              value: f.value,
              type: 'field' as const,
            }));
            setPopup({
              visible: true, phase: 'field', options, selectedIndex: 0,
              triggerIndex: openBracesIndex, contextTable: table, ...coords,
            });
            return;
          }
        }
      }
    }

    hide();
  }, [editorRef, database, quickTexts, hide]);

  const confirmSelection = useCallback((option: AutocompleteOption) => {
    if (option.type === 'empty') return;

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;

    const text = node.textContent ?? '';
    const caretPos = range.startOffset;
    const { triggerIndex, phase, contextTable } = stateRef.current;

    if (phase === 'quicktext') {
      // Replace ./ trigger with quick text content
      const rangeToReplace = document.createRange();
      rangeToReplace.setStart(node, triggerIndex);
      rangeToReplace.setEnd(node, caretPos);
      sel.removeAllRanges();
      sel.addRange(rangeToReplace);
      document.execCommand('insertHTML', false, option.content ?? '');
      hide();
      editorRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    if (phase === 'table') {
      // Insert table name + dot, then re-trigger for fields
      const tableName = option.tableName!;
      const newText = text.substring(0, triggerIndex + 2) + tableName + '.' + text.substring(caretPos);
      node.textContent = newText;
      const newCaretPos = triggerIndex + 2 + tableName.length + 1;
      const newRange = document.createRange();
      newRange.setStart(node, newCaretPos);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      // Re-trigger to show fields
      setTimeout(() => checkTrigger(), 0);
      return;
    }

    if (phase === 'field' && contextTable) {
      // Insert full variable chip
      const variableFull = `{{${contextTable.tableName}.${option.value}}}`;
      const rangeToReplace = document.createRange();
      rangeToReplace.setStart(node, triggerIndex);
      let endPos = caretPos;
      if (text.length >= caretPos + 2 && text.substring(caretPos, caretPos + 2) === '}}') {
        endPos += 2;
      }
      rangeToReplace.setEnd(node, endPos);
      sel.removeAllRanges();
      sel.addRange(rangeToReplace);
      const chipHtml = `&nbsp;<span class="dynamic-variable-chip" contenteditable="false" title="Dado Dinamico">${variableFull}</span>&nbsp;`;
      document.execCommand('insertHTML', false, chipHtml);
      hide();
      editorRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, [hide, checkTrigger, editorRef]);

  // Listen for input and keydown on editor
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    const onInput = () => { checkTrigger(); };

    const onKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s.visible) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setPopup(p => ({ ...p, selectedIndex: (p.selectedIndex + 1) % p.options.length }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setPopup(p => ({ ...p, selectedIndex: (p.selectedIndex - 1 + p.options.length) % p.options.length }));
      } else if (e.key === 'Enter' || e.key === 'Tab' || e.key === ' ') {
        if (s.options.length > 0) {
          e.preventDefault();
          confirmSelection(s.options[s.selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        hide();
      }
    };

    el.addEventListener('input', onInput);
    el.addEventListener('keydown', onKeyDown);
    return () => {
      el.removeEventListener('input', onInput);
      el.removeEventListener('keydown', onKeyDown);
    };
  }, [editorRef, checkTrigger, confirmSelection, hide]);

  // Click outside to dismiss
  useEffect(() => {
    if (!popup.visible) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        hide();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popup.visible, hide]);

  if (!popup.visible || popup.options.length === 0) return null;

  const title = popup.phase === 'table' ? 'Tabelas'
    : popup.phase === 'field' ? `Campos: ${popup.contextTable?.displayName || ''}`
    : 'Texto Rapido';

  return (
    <div
      ref={popupRef}
      className="absolute z-[99999] bg-white border border-gray-200 shadow-xl rounded-lg overflow-hidden"
      style={{ top: popup.top, left: popup.left, minWidth: 240, maxWidth: 320 }}
    >
      <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase bg-gray-50 border-b">
        {title}
      </div>
      <div className="max-h-60 overflow-y-auto">
        {popup.options.map((opt, idx) => {
          if (opt.type === 'empty') {
            return (
              <div key="empty" className="px-4 py-2 text-sm text-gray-400 italic">
                {opt.label}
              </div>
            );
          }

          const isSelected = idx === popup.selectedIndex;
          return (
            <button
              key={`${opt.type}-${opt.tableName || opt.value || opt.label}-${idx}`}
              className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors border-none cursor-pointer ${
                isSelected ? 'bg-blue-100 text-blue-800' : 'bg-transparent hover:bg-gray-100 text-gray-700'
              }`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => confirmSelection(opt)}
            >
              <div className="flex flex-col">
                <span className="font-medium">{opt.label}</span>
                {opt.type === 'field' && opt.value && (
                  <span className="text-xs text-gray-400 font-mono">{opt.value}</span>
                )}
                {opt.type === 'quicktext' && opt.content && (
                  <span className="text-xs text-gray-400 truncate max-w-[200px]">{opt.content}</span>
                )}
              </div>
              {opt.type === 'table' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
