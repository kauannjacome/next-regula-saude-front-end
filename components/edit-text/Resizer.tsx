import React, { useEffect, useRef, useState, useCallback } from 'react';

interface ResizerProps {
  target: HTMLElement | null;
  onResize?: (w: number, h: number) => void;
  onResizeEnd?: () => void;
  pageContainerRef: React.RefObject<HTMLDivElement>;
}

export const Resizer: React.FC<ResizerProps> = ({ target, onResize, onResizeEnd, pageContainerRef }) => {
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const dropIndicatorRef = useRef<HTMLDivElement | null>(null);

  // Update overlay position based on target
  const updateOverlay = useCallback(() => {
    if (!target || !pageContainerRef.current) {
      setRect(null);
      return;
    }

    if (!target.isConnected) {
      setRect(null);
      return;
    }

    const targetRect = target.getBoundingClientRect();
    const pageRect = pageContainerRef.current.getBoundingClientRect();

    if (targetRect.width === 0 || targetRect.height === 0) {
      setRect(null);
      return;
    }

    setRect({
      top: targetRect.top - pageRect.top,
      left: targetRect.left - pageRect.left,
      width: targetRect.width,
      height: targetRect.height,
    });
  }, [target, pageContainerRef]);

  // Sync loop
  useEffect(() => {
    updateOverlay();
    const interval = setInterval(updateOverlay, 100);
    window.addEventListener('resize', updateOverlay);
    window.addEventListener('scroll', updateOverlay, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateOverlay);
      window.removeEventListener('scroll', updateOverlay, true);
    };
  }, [updateOverlay]);

  // Handle Resize Drag
  const handleResizeDown = (e: React.MouseEvent, pos: 'tl' | 'tr' | 'bl' | 'br') => {
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = target.offsetWidth;
    const startH = target.offsetHeight;
    const ratio = startW / startH;
    const isImage = target.tagName === 'IMG' || target.classList.contains('qr-code');

    // Calculate max allowed width based on page container
    const pageEl = pageContainerRef.current;
    const pageStyle = pageEl ? getComputedStyle(pageEl) : null;
    const maxW = pageEl
      ? pageEl.clientWidth - parseFloat(pageStyle?.paddingLeft || '0') - parseFloat(pageStyle?.paddingRight || '0')
      : 9999;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      let newW = startW;
      let newH = startH;

      if (pos === 'br') { newW = startW + dx; newH = startH + dy; }
      else if (pos === 'bl') { newW = startW - dx; newH = startH + dy; }
      else if (pos === 'tr') { newW = startW + dx; newH = startH - dy; }
      else if (pos === 'tl') { newW = startW - dx; newH = startH - dy; }

      if (newW < 20) newW = 20;
      if (newH < 20) newH = 20;
      if (newW > maxW) newW = maxW;

      if (isImage) {
        newH = newW / ratio;
      }

      target.style.width = `${newW}px`;
      target.style.height = `${newH}px`;

      updateOverlay();
      onResize?.(Math.round(newW), Math.round(newH));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      onResizeEnd?.();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // Handle Drag-to-Move
  const handleDragDown = (e: React.MouseEvent) => {
    if (!target) return;
    // Only allow drag for images and QR codes
    const isMovable = target.tagName === 'IMG' || target.classList.contains('qr-code');
    if (!isMovable) return;

    e.preventDefault();
    e.stopPropagation();

    const wrap = target.getAttribute('data-wrap');
    const isAbsolute = wrap === 'behind' || wrap === 'front';

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = parseInt(target.style.left) || 0;
    const startTop = parseInt(target.style.top) || 0;

    // Minimum distance (px) before we consider it an actual drag
    const MIN_DRAG_DISTANCE = 5;
    let hasDragged = false;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Only start drag after minimum distance
      if (!hasDragged && dist < MIN_DRAG_DISTANCE) return;

      if (!hasDragged) {
        hasDragged = true;
        // Create ghost
        const ghost = document.createElement('div');
        ghost.style.cssText = `
          position: fixed; pointer-events: none; z-index: 99999;
          width: 120px; height: 80px; opacity: 0.7;
          background: #e0e7ff; border: 2px dashed #3b82f6;
          border-radius: 4px; display: flex; align-items: center;
          justify-content: center; font-size: 10px; color: #3b82f6;
        `;
        ghost.textContent = 'Movendo...';
        document.body.appendChild(ghost);
        ghostRef.current = ghost;

        // Create drop indicator
        const indicator = document.createElement('div');
        indicator.style.cssText = `
          position: absolute; width: 2px; height: 20px;
          background: #3b82f6; z-index: 99998;
          pointer-events: none; display: none;
        `;
        pageContainerRef.current?.appendChild(indicator);
        dropIndicatorRef.current = indicator;
      }

      // Update ghost position
      if (ghostRef.current) {
        ghostRef.current.style.left = (ev.clientX + 10) + 'px';
        ghostRef.current.style.top = (ev.clientY + 10) + 'px';
      }

      if (isAbsolute) {
        // For behind/front: update position directly, clamped to page
        let newLeft = startLeft + dx;
        let newTop = startTop + dy;
        if (pageContainerRef.current) {
          const pw = pageContainerRef.current.clientWidth;
          const ph = pageContainerRef.current.clientHeight;
          const tw = target.offsetWidth;
          const th = target.offsetHeight;
          newLeft = Math.max(0, Math.min(newLeft, pw - tw));
          newTop = Math.max(0, Math.min(newTop, ph - th));
        }
        target.style.left = newLeft + 'px';
        target.style.top = newTop + 'px';
        updateOverlay();
      } else {
        // For flow elements: show drop indicator via caretRangeFromPoint
        if (dropIndicatorRef.current) {
          const range = (document as any).caretRangeFromPoint?.(ev.clientX, ev.clientY);
          if (range && pageContainerRef.current) {
            const rect = range.getBoundingClientRect();
            const pageRect = pageContainerRef.current.getBoundingClientRect();
            dropIndicatorRef.current.style.display = 'block';
            dropIndicatorRef.current.style.left = (rect.left - pageRect.left) + 'px';
            dropIndicatorRef.current.style.top = (rect.top - pageRect.top) + 'px';
            dropIndicatorRef.current.style.height = rect.height + 'px';
          }
        }
      }
    };

    const onUp = (ev: MouseEvent) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);

      // Cleanup ghost & indicator
      ghostRef.current?.remove();
      ghostRef.current = null;
      dropIndicatorRef.current?.remove();
      dropIndicatorRef.current = null;

      // Only move element if the user actually dragged
      if (hasDragged && !isAbsolute) {
        const range = (document as any).caretRangeFromPoint?.(ev.clientX, ev.clientY);
        if (range) {
          const parent = target.parentNode;
          if (parent) {
            target.remove();
            range.insertNode(target);
          }
        }
      }

      if (hasDragged) {
        updateOverlay();
        onResizeEnd?.();
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  if (!rect) return null;

  const isMovable = target && (target.tagName === 'IMG' || target.classList.contains('qr-code'));

  return (
    <div
      ref={overlayRef}
      className="absolute border-2 border-blue-500 pointer-events-none z-50 select-none"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        display: 'block',
      }}
    >
      {/* Center drag area for images */}
      {isMovable && (
        <div
          className="absolute inset-2 pointer-events-auto cursor-move"
          onMouseDown={handleDragDown}
          title="Arrastar para mover"
        />
      )}

      {/* Handles */}
      {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
        <div
          key={pos}
          className="absolute w-2.5 h-2.5 bg-blue-500 border border-white rounded-sm pointer-events-auto"
          style={{
            top: pos.includes('t') ? -5 : 'auto',
            bottom: pos.includes('b') ? -5 : 'auto',
            left: pos.includes('l') ? -5 : 'auto',
            right: pos.includes('r') ? -5 : 'auto',
            cursor: (pos === 'tl' || pos === 'br') ? 'nwse-resize' : 'nesw-resize',
          }}
          onMouseDown={(e) => handleResizeDown(e, pos)}
        />
      ))}
    </div>
  );
};
