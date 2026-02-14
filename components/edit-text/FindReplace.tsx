'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

interface FindReplaceProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

interface MatchInfo {
  node: Text;
  start: number;
  end: number;
}

export default function FindReplace({ editorRef, onClose }: FindReplaceProps) {
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Clear highlights
  const clearHighlights = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const marks = el.querySelectorAll('mark[data-find-match]');
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        const text = document.createTextNode(mark.textContent || '');
        parent.replaceChild(text, mark);
        parent.normalize();
      }
    });
  }, [editorRef]);

  // Highlight the active match
  const highlightActive = useCallback((index: number) => {
    const el = editorRef.current;
    if (!el) return;
    const marks = el.querySelectorAll('mark[data-find-match]');
    marks.forEach((mark, i) => {
      if (i === index) {
        mark.className = 'find-match-active';
        mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        mark.className = 'find-match';
      }
    });
  }, [editorRef]);

  // Find matches using TreeWalker
  const doSearch = useCallback(() => {
    const el = editorRef.current;
    if (!el || !searchText) {
      clearHighlights();
      setActiveIndex(-1);
      return;
    }

    clearHighlights();

    const query = caseSensitive ? searchText : searchText.toLowerCase();
    const foundMatches: MatchInfo[] = [];

    // Walk all text nodes
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      const text = caseSensitive ? node.textContent || '' : (node.textContent || '').toLowerCase();
      let idx = text.indexOf(query);
      while (idx !== -1) {
        foundMatches.push({ node, start: idx, end: idx + query.length });
        idx = text.indexOf(query, idx + 1);
      }
    }

    // Wrap matches in <mark> (reverse order to preserve offsets)
    const wrappedMatches: MatchInfo[] = [];
    for (let i = foundMatches.length - 1; i >= 0; i--) {
      const m = foundMatches[i];
      const range = document.createRange();

      try {
        range.setStart(m.node, m.start);
        range.setEnd(m.node, m.end);

        const mark = document.createElement('mark');
        mark.setAttribute('data-find-match', 'true');
        mark.className = 'find-match';
        range.surroundContents(mark);
        wrappedMatches.unshift(m);
      } catch {
        // Node may have been split, skip
      }
    }

    if (wrappedMatches.length > 0) {
      setActiveIndex(0);
      highlightActive(0);
    } else {
      setActiveIndex(-1);
    }
  }, [editorRef, searchText, caseSensitive, clearHighlights, highlightActive]);

  // Run search when text or case changes
  useEffect(() => {
    const timer = setTimeout(doSearch, 200);
    return () => clearTimeout(timer);
  }, [searchText, caseSensitive, doSearch]);

  // Clean up on unmount
  useEffect(() => {
    return () => clearHighlights();
  }, [clearHighlights]);

  const goNext = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const marks = el.querySelectorAll('mark[data-find-match]');
    if (marks.length === 0) return;
    const next = (activeIndex + 1) % marks.length;
    setActiveIndex(next);
    highlightActive(next);
  }, [activeIndex, editorRef, highlightActive]);

  const goPrev = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const marks = el.querySelectorAll('mark[data-find-match]');
    if (marks.length === 0) return;
    const prev = (activeIndex - 1 + marks.length) % marks.length;
    setActiveIndex(prev);
    highlightActive(prev);
  }, [activeIndex, editorRef, highlightActive]);

  const replaceCurrent = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const marks = el.querySelectorAll('mark[data-find-match]');
    if (marks.length === 0 || activeIndex < 0 || activeIndex >= marks.length) return;

    const mark = marks[activeIndex];
    const textNode = document.createTextNode(replaceText);
    mark.parentNode?.replaceChild(textNode, mark);
    textNode.parentNode?.normalize();

    // Re-search
    setTimeout(doSearch, 50);
  }, [activeIndex, replaceText, editorRef, doSearch]);

  const replaceAll = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const marks = el.querySelectorAll('mark[data-find-match]');
    marks.forEach((mark) => {
      const textNode = document.createTextNode(replaceText);
      mark.parentNode?.replaceChild(textNode, mark);
      textNode.parentNode?.normalize();
    });
    setActiveIndex(-1);
  }, [replaceText, editorRef]);

  const handleClose = useCallback(() => {
    clearHighlights();
    onClose();
  }, [clearHighlights, onClose]);

  const totalMarks = editorRef.current?.querySelectorAll('mark[data-find-match]').length ?? 0;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 flex-wrap shrink-0">
      {/* Search */}
      <div className="flex items-center gap-1">
        <input
          ref={searchInputRef}
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (e.shiftKey) {
              goPrev();
            } else {
              goNext();
            }
          }
            if (e.key === 'Escape') handleClose();
          }}
          placeholder="Localizar..."
          className="border border-gray-300 rounded px-2 py-1 text-sm w-48 outline-none focus:border-blue-500"
        />
        <span className="text-xs text-gray-500 min-w-[60px]">
          {searchText ? `${activeIndex >= 0 ? activeIndex + 1 : 0} de ${totalMarks}` : ''}
        </span>
      </div>

      <button
        type="button"
        className="p-1 hover:bg-gray-100 rounded cursor-pointer border-none bg-transparent"
        onClick={goPrev}
        title="Anterior"
      >
        <ChevronUp size={16} />
      </button>
      <button
        type="button"
        className="p-1 hover:bg-gray-100 rounded cursor-pointer border-none bg-transparent"
        onClick={goNext}
        title="Proximo"
      >
        <ChevronDown size={16} />
      </button>

      <div className="h-5 w-px bg-gray-300 mx-1" />

      {/* Replace */}
      <input
        type="text"
        value={replaceText}
        onChange={(e) => setReplaceText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') handleClose();
        }}
        placeholder="Substituir por..."
        className="border border-gray-300 rounded px-2 py-1 text-sm w-48 outline-none focus:border-blue-500"
      />

      <button
        type="button"
        className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded cursor-pointer border border-blue-200"
        onClick={replaceCurrent}
        title="Substituir"
      >
        Substituir
      </button>
      <button
        type="button"
        className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded cursor-pointer border border-blue-200"
        onClick={replaceAll}
        title="Substituir tudo"
      >
        Substituir tudo
      </button>

      <div className="h-5 w-px bg-gray-300 mx-1" />

      {/* Options */}
      <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={caseSensitive}
          onChange={(e) => setCaseSensitive(e.target.checked)}
          className="cursor-pointer"
        />
        Aa
      </label>

      <button
        type="button"
        className="p-1 hover:bg-gray-100 rounded cursor-pointer border-none bg-transparent ml-auto"
        onClick={handleClose}
        title="Fechar (ESC)"
      >
        <X size={16} />
      </button>
    </div>
  );
}
