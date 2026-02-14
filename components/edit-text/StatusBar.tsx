'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import type { WordStats } from './types';

interface StatusBarProps {
  stats: WordStats;
  zoom: number;
  onZoomChange: (z: number) => void;
  currentPage?: number;
}

export default function StatusBar({ stats, zoom, onZoomChange, currentPage }: StatusBarProps) {
  return (
    <footer className="bg-white border-t border-gray-200 flex items-center justify-between px-4 py-1.5 text-xs text-gray-500 shrink-0">
      <div className="flex items-center gap-4">
        <span>{stats.words} palavras</span>
        <span>{stats.characters} caracteres</span>
        <span>Pagina {currentPage ?? 1} de {stats.pages}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="hover:bg-gray-200 rounded p-1 border-none cursor-pointer bg-transparent flex items-center justify-center"
          onClick={() => onZoomChange(Math.max(25, zoom - 10))}
        >
          <Minus size={14} />
        </button>
        <span className="min-w-[40px] text-center">{zoom}%</span>
        <input
          type="range"
          min={25}
          max={200}
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="w-24"
        />
        <button
          type="button"
          className="hover:bg-gray-200 rounded p-1 border-none cursor-pointer bg-transparent flex items-center justify-center"
          onClick={() => onZoomChange(Math.min(200, zoom + 10))}
        >
          <Plus size={14} />
        </button>
      </div>
    </footer>
  );
}
