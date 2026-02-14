'use client';

import React from 'react';
import Icon from '../Icon';

interface ToolbarButtonProps {
  icon: string;
  label?: string;
  title?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export default function ToolbarButton({
  icon,
  label,
  title,
  active,
  onClick,
  className = '',
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={`
        flex items-center justify-center gap-1.5 px-1.5 py-1 rounded text-sm
        transition-colors cursor-pointer border-none
        ${active
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-700 hover:bg-gray-200'
        }
        ${className}
      `}
      title={title}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
    >
      <Icon name={icon} size={18} />
      {label && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
      {children}
    </button>
  );
}
