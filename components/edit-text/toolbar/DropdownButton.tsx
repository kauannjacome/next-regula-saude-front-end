'use client';

import React, { useState, useRef, useEffect } from 'react';
import Icon from '../Icon';

interface DropdownButtonProps {
  icon: string;
  label?: string;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function DropdownButton({
  icon,
  label,
  title,
  children,
  className = '',
}: DropdownButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        className="flex items-center gap-1 px-1.5 py-1 rounded text-sm text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer border-none"
        title={title}
        onClick={() => setOpen(!open)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <Icon name={icon} size={18} />
        {label && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
        <Icon name="chevron-down" size={12} style={{ opacity: 0.5 }} />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-xl rounded-md py-1 z-[99999] min-w-[180px]"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}
