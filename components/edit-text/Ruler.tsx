'use client';

import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import type { Margins } from './types';

const CM_PX = 37.795275591; // 1cm in pixels at 96dpi

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(val, max));
}

/* ─── Horizontal Ruler ─── */

interface HRulerProps {
  pageWidth: number;
  margins: Margins;
  onMarginsChange: (m: Partial<Margins>) => void;
  zoom?: number;
}

export function HorizontalRuler({ pageWidth, margins, onMarginsChange, zoom = 100 }: HRulerProps) {
  const zoomFactor = zoom / 100;
  const rulerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<'left' | 'right' | null>(null);

  const rulerCm = Math.floor(pageWidth / CM_PX);

  // Drag handlers (compensate for zoom transform)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current || !rulerRef.current) return;
    e.preventDefault();
    const rect = rulerRef.current.getBoundingClientRect();

    if (dragging.current === 'left') {
      let val = (e.clientX - rect.left) / zoomFactor;
      val = clamp(val, 20, pageWidth - margins.right - 50);
      onMarginsChange({ left: Math.round(val) });
    } else {
      let val = (rect.right - e.clientX) / zoomFactor;
      val = clamp(val, 20, pageWidth - margins.left - 50);
      onMarginsChange({ right: Math.round(val) });
    }
  }, [pageWidth, margins, onMarginsChange, zoomFactor]);

  const handleMouseUp = useCallback(() => {
    if (dragging.current) {
      dragging.current = null;
      document.body.style.cursor = '';
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const ticks = useMemo(() => {
    const items: React.ReactNode[] = [];
    for (let cm = 0; cm <= rulerCm; cm++) {
      const x = cm * CM_PX;
      const isMajor5 = cm % 5 === 0;
      const h = isMajor5 ? 10 : 6;

      // Main tick
      items.push(
        <line key={`t-${cm}`} x1={x} y1={24 - h} x2={x} y2={24} stroke="#9ca3af" strokeWidth={1} />
      );

      // Labels every 2cm (skip 0)
      if (cm > 0 && cm % 2 === 0) {
        items.push(
          <text key={`l-${cm}`} x={x} y={9} textAnchor="middle" fontSize={9} fill="#6b7280" fontFamily="Arial, sans-serif" fontWeight={500}>
            {cm}
          </text>
        );
      }

      // Half-cm tick
      if (cm < rulerCm) {
        const hx = x + CM_PX / 2;
        items.push(
          <line key={`h-${cm}`} x1={hx} y1={20} x2={hx} y2={24} stroke="#d1d5db" strokeWidth={0.5} />
        );
      }
    }
    return items;
  }, [rulerCm]);

  return (
    <div className="flex justify-center shrink-0 bg-gray-100 border-b border-gray-200 select-none" style={{ overflow: 'hidden' }}>
      <div
        ref={rulerRef}
        className="relative"
        style={{
          width: pageWidth,
          height: 24,
          transform: `scaleX(${zoomFactor})`,
          transformOrigin: 'center top',
        }}
      >
        {/* Margin shaded areas */}
        <div className="absolute top-0 h-full bg-blue-100/40" style={{ left: 0, width: margins.left }} />
        <div className="absolute top-0 h-full bg-blue-100/40" style={{ right: 0, width: margins.right }} />

        {/* SVG ticks */}
        <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
          {ticks}
        </svg>

        {/* Left margin marker (draggable) */}
        <div
          className="absolute top-0 h-full cursor-ew-resize z-10 group"
          style={{ left: margins.left - 4, width: 8 }}
          onMouseDown={(e) => { e.preventDefault(); dragging.current = 'left'; document.body.style.cursor = 'ew-resize'; }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-4 bg-blue-500 rounded-sm opacity-70 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Right margin marker (draggable) */}
        <div
          className="absolute top-0 h-full cursor-ew-resize z-10 group"
          style={{ left: pageWidth - margins.right - 4, width: 8 }}
          onMouseDown={(e) => { e.preventDefault(); dragging.current = 'right'; document.body.style.cursor = 'ew-resize'; }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-4 bg-blue-500 rounded-sm opacity-70 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}


/* ─── Vertical Ruler ─── */

interface VRulerProps {
  pageHeight: number;
  pages: number;
  margins: Margins;
  onMarginsChange: (m: Partial<Margins>) => void;
  zoom?: number;
}

export function VerticalRuler({ pageHeight, pages, margins, onMarginsChange, zoom = 100 }: VRulerProps) {
  const zoomFactor = zoom / 100;
  const rulerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<'top' | 'bottom' | null>(null);

  const pageCm = Math.floor(pageHeight / CM_PX);
  const totalHeight = pages * pageHeight;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current || !rulerRef.current) return;
    e.preventDefault();
    const rect = rulerRef.current.getBoundingClientRect();

    if (dragging.current === 'top') {
      let val = (e.clientY - rect.top) / zoomFactor;
      val = clamp(val, 20, pageHeight - margins.bottom - 100);
      onMarginsChange({ top: Math.round(val) });
    } else {
      let val = pageHeight - (e.clientY - rect.top) / zoomFactor;
      val = clamp(val, 20, pageHeight - margins.top - 100);
      onMarginsChange({ bottom: Math.round(val) });
    }
  }, [pageHeight, margins, onMarginsChange, zoomFactor]);

  const handleMouseUp = useCallback(() => {
    if (dragging.current) {
      dragging.current = null;
      document.body.style.cursor = '';
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const ticks = useMemo(() => {
    const items: React.ReactNode[] = [];

    for (let p = 0; p < pages; p++) {
      const offset = p * pageHeight;

      for (let cm = 0; cm <= pageCm; cm++) {
        const y = offset + cm * CM_PX;
        const isMajor5 = cm % 5 === 0;
        const w = isMajor5 ? 10 : 6;

        // Main tick
        items.push(
          <line key={`t-${p}-${cm}`} x1={24 - w} y1={y} x2={24} y2={y} stroke="#9ca3af" strokeWidth={1} />
        );

        // Labels every 2cm (skip 0)
        if (cm > 0 && cm % 2 === 0) {
          items.push(
            <text key={`l-${p}-${cm}`} x={6} y={y + 3} textAnchor="middle" fontSize={9} fill="#6b7280" fontFamily="Arial, sans-serif" fontWeight={500}>
              {cm}
            </text>
          );
        }

        // Half-cm tick
        if (cm < pageCm) {
          const hy = y + CM_PX / 2;
          items.push(
            <line key={`h-${p}-${cm}`} x1={21} y1={hy} x2={24} y2={hy} stroke="#d1d5db" strokeWidth={0.5} />
          );
        }
      }

      // Page separator line
      if (p < pages - 1) {
        const sy = (p + 1) * pageHeight;
        items.push(
          <line key={`sep-${p}`} x1={0} y1={sy} x2={24} y2={sy} stroke="#4b5563" strokeWidth={3} />
        );
      }
    }
    return items;
  }, [pages, pageCm, pageHeight]);

  // Margin masks per page
  const marginMasks = useMemo(() => {
    const masks: React.ReactNode[] = [];
    for (let p = 0; p < pages; p++) {
      const offset = p * pageHeight;
      // Top margin shaded
      masks.push(
        <div
          key={`mt-${p}`}
          className="absolute left-0 right-0 bg-blue-100/40"
          style={{ top: offset, height: margins.top }}
        />
      );
      // Bottom margin shaded
      masks.push(
        <div
          key={`mb-${p}`}
          className="absolute left-0 right-0 bg-blue-100/40"
          style={{ top: offset + pageHeight - margins.bottom, height: margins.bottom }}
        />
      );
    }
    return masks;
  }, [pages, pageHeight, margins]);

  return (
    <div
      ref={rulerRef}
      className="shrink-0 bg-gray-100 border-r border-gray-200 relative select-none"
      style={{
        width: 24,
        height: totalHeight * zoomFactor,
        transform: `scaleY(${zoomFactor})`,
        transformOrigin: 'left top',
      }}
    >
      {/* Margin shaded areas */}
      {marginMasks}

      {/* SVG ticks */}
      <svg className="absolute inset-0 w-full" style={{ height: totalHeight, overflow: 'visible' }}>
        {ticks}
      </svg>

      {/* Top margin marker (draggable) - first page */}
      <div
        className="absolute left-0 w-full cursor-ns-resize z-10 group"
        style={{ top: margins.top - 4, height: 8 }}
        onMouseDown={(e) => { e.preventDefault(); dragging.current = 'top'; document.body.style.cursor = 'ns-resize'; }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-4 bg-blue-500 rounded-sm opacity-70 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Bottom margin marker (draggable) - first page */}
      <div
        className="absolute left-0 w-full cursor-ns-resize z-10 group"
        style={{ top: pageHeight - margins.bottom - 4, height: 8 }}
        onMouseDown={(e) => { e.preventDefault(); dragging.current = 'bottom'; document.body.style.cursor = 'ns-resize'; }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-4 bg-blue-500 rounded-sm opacity-70 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
