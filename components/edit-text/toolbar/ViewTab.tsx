'use client';

import React from 'react';
import Icon from '../Icon';
import DropdownButton from './DropdownButton';
import ToolbarButton from './ToolbarButton';
import { PAGE_SIZES } from '../constants';
import type { EditorState, PageSizeKey, Margins } from '../types';

function Sep() {
  return <div className="h-6 w-px bg-gray-300 mx-1 self-center shrink-0" />;
}

interface ViewTabProps {
  state: EditorState;
  onSetPageSize: (size: PageSizeKey) => void;
  onSetOrientation: (o: 'portrait' | 'landscape') => void;
  onSetMargins: (m: Partial<Margins>) => void;
  onSetColumns: (c: 1 | 2 | 3) => void;
  onToggleRuler: () => void;
  onToggleDarkMode: () => void;
  onSetPageBackground: (color: string) => void;
  onEditHeader?: () => void;
  onEditFooter?: () => void;
  onTogglePrimeiraPaginaDiferente?: () => void;
  onToggleParImparDiferente?: () => void;
}

export default function ViewTab({
  state,
  onSetPageSize,
  onSetOrientation,
  onSetMargins,
  onSetColumns,
  onToggleRuler,
  onToggleDarkMode,
  onSetPageBackground,
  onEditHeader,
  onEditFooter,
  onTogglePrimeiraPaginaDiferente,
  onToggleParImparDiferente,
}: ViewTabProps) {
  return (
    <div className="flex items-center flex-wrap gap-0.5">
      {/* Checkboxes */}
      <label className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 rounded cursor-pointer" onClick={onToggleRuler}>
        <input type="checkbox" checked={state.showRuler} readOnly className="pointer-events-none" />
        <span className="text-sm">Regua</span>
      </label>
      <label className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 rounded cursor-pointer" onClick={onToggleDarkMode}>
        <input type="checkbox" checked={state.darkMode} readOnly className="pointer-events-none" />
        <span className="text-sm">Modo escuro</span>
      </label>

      <Sep />

      {/* Page size */}
      <DropdownButton icon="file" label="Tamanho" title="Tamanho da pagina">
        <div className="w-56">
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase border-b">Tamanho da Pagina</div>
          {(Object.entries(PAGE_SIZES) as [PageSizeKey, { label: string }][]).map(([key, val]) => (
            <button
              key={key}
              className={`text-left px-4 py-2 hover:bg-blue-50 text-sm w-full border-none bg-transparent cursor-pointer ${state.pageSize === key ? 'font-bold text-blue-700' : ''}`}
              onClick={() => onSetPageSize(key)}
            >
              {val.label}
            </button>
          ))}
        </div>
      </DropdownButton>

      {/* Orientation */}
      <DropdownButton icon={state.pageOrientation === 'portrait' ? 'smartphone' : 'monitor'} label="Orientacao">
        <div className="w-48">
          <button
            className={`text-left px-4 py-2 hover:bg-blue-50 text-sm w-full flex items-center gap-2 border-none bg-transparent cursor-pointer ${state.pageOrientation === 'portrait' ? 'font-bold text-blue-700' : ''}`}
            onClick={() => onSetOrientation('portrait')}
          >
            <Icon name="smartphone" size={14} /> Retrato
          </button>
          <button
            className={`text-left px-4 py-2 hover:bg-blue-50 text-sm w-full flex items-center gap-2 border-none bg-transparent cursor-pointer ${state.pageOrientation === 'landscape' ? 'font-bold text-blue-700' : ''}`}
            onClick={() => onSetOrientation('landscape')}
          >
            <Icon name="monitor" size={14} /> Paisagem
          </button>
        </div>
      </DropdownButton>

      {/* Margins */}
      <DropdownButton icon="square-dashed-bottom" label="Margens">
        <div className="w-56">
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase border-b">Margens</div>
          {[
            { l: 'Normal (2.54cm)', m: { top: 96, right: 96, bottom: 96, left: 96 } },
            { l: 'Estreita (1.27cm)', m: { top: 48, right: 48, bottom: 48, left: 48 } },
            { l: 'Moderada (1.91cm)', m: { top: 72, right: 72, bottom: 72, left: 72 } },
            { l: 'Larga', m: { top: 120, right: 120, bottom: 96, left: 96 } },
          ].map(item => (
            <button key={item.l} className="text-left px-4 py-2 hover:bg-blue-50 text-sm w-full border-none bg-transparent cursor-pointer" onClick={() => onSetMargins(item.m)}>
              {item.l}
            </button>
          ))}
        </div>
      </DropdownButton>

      {/* Columns */}
      <DropdownButton icon="columns-2" label="Colunas">
        <div className="w-44">
          {([1, 2, 3] as const).map(c => (
            <button
              key={c}
              className={`text-left px-4 py-2 hover:bg-blue-50 text-sm w-full border-none bg-transparent cursor-pointer ${state.columns === c ? 'font-bold text-blue-700' : ''}`}
              onClick={() => onSetColumns(c)}
            >
              {c === 1 ? 'Uma coluna' : c === 2 ? 'Duas colunas' : 'Tres colunas'}
            </button>
          ))}
        </div>
      </DropdownButton>

      <Sep />

      {/* Page background */}
      <div className="relative flex items-center gap-1 px-1.5 py-1 rounded hover:bg-gray-200 cursor-pointer" title="Cor de fundo">
        <Icon name="paint-bucket" size={18} />
        <span className="text-sm font-medium">Fundo</span>
        <input
          type="color"
          value={state.pageBackground}
          onChange={(e) => onSetPageBackground(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
      </div>

      <Sep />

      {/* Header / Footer */}
      <ToolbarButton icon="panel-top" label="Cabecalho" title="Editar cabecalho" onClick={onEditHeader} />
      <ToolbarButton icon="panel-bottom" label="Rodape" title="Editar rodape" onClick={onEditFooter} />

      <label className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 rounded cursor-pointer" onClick={onTogglePrimeiraPaginaDiferente}>
        <input type="checkbox" checked={state.primeiraPaginaDiferente} readOnly className="pointer-events-none" />
        <span className="text-sm">1a pagina diferente</span>
      </label>
      <label className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 rounded cursor-pointer" onClick={onToggleParImparDiferente}>
        <input type="checkbox" checked={state.parImparDiferente} readOnly className="pointer-events-none" />
        <span className="text-sm">Par/impar diferente</span>
      </label>

      <Sep />

      <ToolbarButton icon="maximize" label="Tela inteira" onClick={() => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      }} />
    </div>
  );
}
