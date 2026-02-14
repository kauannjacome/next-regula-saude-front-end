import { useState, useCallback, useRef } from 'react';
import type { EditorState, Margins, StyleState } from '../types';
import { DEFAULT_MARGINS } from '../constants';

function createDefaultState(): EditorState {
  return {
    activeTab: 'Inicio',
    showRuler: true,
    zoom: 100,
    margins: { ...DEFAULT_MARGINS },
    pageSize: 'A4',
    pageOrientation: 'portrait',
    styles: {
      fontSize: 12,
      fontFamily: 'Arial',
      blockType: 'p',
      textColor: '#000000',
      highlightColor: '#ffff00',
    },
    darkMode: false,
    columns: 1,
    pageBackground: '#ffffff',
    headerHTML: '',
    footerHTML: '',
    watermarkText: '',
    watermarkOpacity: 0.15,
    trackChanges: false,
    primeiraPaginaDiferente: false,
    parImparDiferente: false,
    primeiraPaginaHeaderHTML: '',
    primeiraPaginaFooterHTML: '',
    paginasParesHeaderHTML: '',
    paginasParesFooterHTML: '',
  };
}

export function useEditorState(initial?: Partial<EditorState>) {
  const [state, setState] = useState<EditorState>(() => ({
    ...createDefaultState(),
    ...initial,
  }));

  const stateRef = useRef(state);
  stateRef.current = state;

  const set = useCallback(<K extends keyof EditorState>(key: K, value: EditorState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const setStyles = useCallback(<K extends keyof StyleState>(key: K, value: StyleState[K]) => {
    setState(prev => ({
      ...prev,
      styles: { ...prev.styles, [key]: value },
    }));
  }, []);

  const setMargins = useCallback((m: Partial<Margins>) => {
    setState(prev => ({
      ...prev,
      margins: { ...prev.margins, ...m },
    }));
  }, []);

  return { state, stateRef, set, setStyles, setMargins, setState };
}
