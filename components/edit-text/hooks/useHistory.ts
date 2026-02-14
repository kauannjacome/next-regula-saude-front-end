import { useRef, useCallback, useEffect, useMemo } from 'react';

/** A snapshot of the entire document state (body + header + footer + variants) */
export interface DocSnapshot {
  body: string;
  header: string;
  footer: string;
  primeiraPaginaHeader?: string;
  primeiraPaginaFooter?: string;
  paginasParesHeader?: string;
  paginasParesFooter?: string;
}

export interface HistoryActions {
  init: () => void;
  pushState: (html: string) => void;
  pushDebounced: (html: string) => void;
  /** Push a full snapshot (body + header + footer). Use when header/footer changes. */
  pushSnapshot: (snapshot: DocSnapshot) => void;
  pushSnapshotDebounced: (snapshot: DocSnapshot) => void;
  undo: () => DocSnapshot | false;
  redo: () => DocSnapshot | false;
}

export function useHistory(
  editorRef: React.RefObject<HTMLDivElement | null>,
  limit = 50,
  /** Provide current HF state so body-only pushes capture the full snapshot */
  getHFState?: () => { header: string; footer: string },
): HistoryActions {
  const stackRef = useRef<DocSnapshot[]>([]);
  const pointerRef = useRef(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hfTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentHF = useCallback((): { header: string; footer: string } => {
    return getHFState?.() ?? { header: '', footer: '' };
  }, [getHFState]);

  const pushSnapshotRaw = useCallback((snapshot: DocSnapshot) => {
    const stack = stackRef.current;
    const pointer = pointerRef.current;
    // Trim any forward history
    if (pointer < stack.length - 1) {
      stackRef.current = stack.slice(0, pointer + 1);
    }
    // Skip if identical to current
    const top = stackRef.current[stackRef.current.length - 1];
    if (top && top.body === snapshot.body && top.header === snapshot.header && top.footer === snapshot.footer
      && top.primeiraPaginaHeader === snapshot.primeiraPaginaHeader
      && top.primeiraPaginaFooter === snapshot.primeiraPaginaFooter
      && top.paginasParesHeader === snapshot.paginasParesHeader
      && top.paginasParesFooter === snapshot.paginasParesFooter) {
      return;
    }
    stackRef.current.push(snapshot);
    if (stackRef.current.length > limit) {
      stackRef.current.shift();
    } else {
      pointerRef.current++;
    }
  }, [limit]);

  const init = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const hf = currentHF();
    stackRef.current = [{ body: el.innerHTML, header: hf.header, footer: hf.footer }];
    pointerRef.current = 0;
  }, [editorRef, currentHF]);

  /** Push body-only change (backwards compat). Captures current HF automatically. */
  const pushState = useCallback((html: string) => {
    const hf = currentHF();
    pushSnapshotRaw({ body: html, header: hf.header, footer: hf.footer });
  }, [currentHF, pushSnapshotRaw]);

  const pushDebounced = useCallback((html: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      pushState(html);
    }, 500);
  }, [pushState]);

  /** Push a full snapshot (body + header + footer). */
  const pushSnapshot = useCallback((snapshot: DocSnapshot) => {
    pushSnapshotRaw(snapshot);
  }, [pushSnapshotRaw]);

  const pushSnapshotDebounced = useCallback((snapshot: DocSnapshot) => {
    if (hfTimerRef.current) clearTimeout(hfTimerRef.current);
    hfTimerRef.current = setTimeout(() => {
      pushSnapshotRaw(snapshot);
    }, 500);
  }, [pushSnapshotRaw]);

  const undo = useCallback((): DocSnapshot | false => {
    const el = editorRef.current;
    if (!el || pointerRef.current <= 0) return false;
    pointerRef.current--;
    const snapshot = stackRef.current[pointerRef.current];
    el.innerHTML = snapshot.body;
    return snapshot;
  }, [editorRef]);

  const redo = useCallback((): DocSnapshot | false => {
    const el = editorRef.current;
    if (!el || pointerRef.current >= stackRef.current.length - 1) return false;
    pointerRef.current++;
    const snapshot = stackRef.current[pointerRef.current];
    el.innerHTML = snapshot.body;
    return snapshot;
  }, [editorRef]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (hfTimerRef.current) clearTimeout(hfTimerRef.current);
    };
  }, []);

  return useMemo(() => ({
    init, pushState, pushDebounced, pushSnapshot, pushSnapshotDebounced, undo, redo,
  }), [init, pushState, pushDebounced, pushSnapshot, pushSnapshotDebounced, undo, redo]);
}
