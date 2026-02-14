'use client';

import React from 'react';
import Icon from '../Icon';
import ToolbarButton from './ToolbarButton';
import DropdownButton from './DropdownButton';
import type { StyleState } from '../types';
import { FONT_FAMILIES, BLOCK_TYPES } from '../constants';

interface HomeTabProps {
  styles: StyleState;
  onExecCommand: (cmd: string, value?: string) => void;
  onSetFontSize: (size: number) => void;
  onSetFontFamily: (family: string) => void;
  onChangeCase: (type: 'upper' | 'lower' | 'title' | 'sentence') => void;
  onUndo: () => void;
  onRedo: () => void;
  onApplyABNT: () => void;
  onSetStyles: <K extends keyof StyleState>(key: K, value: StyleState[K]) => void;
}

function Sep() {
  return <div className="h-6 w-px bg-gray-300 mx-1 self-center shrink-0" />;
}

export default function HomeTab({
  styles,
  onExecCommand,
  onSetFontSize,
  onSetFontFamily,
  onChangeCase,
  onUndo,
  onRedo,
  onApplyABNT,
  onSetStyles,
}: HomeTabProps) {
  return (
    <div className="flex items-center flex-wrap gap-0.5">
      <ToolbarButton icon="undo" title="Desfazer (Ctrl+Z)" onClick={onUndo} />
      <ToolbarButton icon="redo" title="Refazer (Ctrl+Y)" onClick={onRedo} />
      <ToolbarButton icon="printer" title="Imprimir" onClick={() => window.print()} />
      <Sep />

      {/* Block type */}
      <div className="relative flex items-center bg-white border border-gray-300 rounded px-2 py-0.5 mx-1">
        <select
          value={styles.blockType}
          onChange={(e) => {
            onSetStyles('blockType', e.target.value);
            onExecCommand('formatBlock', e.target.value);
          }}
          className="appearance-none bg-transparent border-none text-sm text-gray-700 focus:outline-none cursor-pointer pr-4 w-28"
        >
          {BLOCK_TYPES.map(b => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
        <span className="absolute right-1.5 text-gray-500 pointer-events-none">
          <Icon name="chevron-down" size={12} />
        </span>
      </div>

      <Sep />

      {/* Font family */}
      <div className="relative flex items-center bg-white border border-gray-300 rounded px-2 py-0.5 mx-1">
        <select
          value={styles.fontFamily}
          onChange={(e) => {
            onSetStyles('fontFamily', e.target.value);
            onSetFontFamily(e.target.value);
          }}
          className="appearance-none bg-transparent border-none text-sm text-gray-700 focus:outline-none cursor-pointer pr-4 w-32"
          style={{ fontFamily: styles.fontFamily }}
        >
          {FONT_FAMILIES.map(f => (
            <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
          ))}
        </select>
        <span className="absolute right-1.5 text-gray-500 pointer-events-none">
          <Icon name="chevron-down" size={12} />
        </span>
      </div>

      <Sep />

      {/* Font size */}
      <div className="flex items-center bg-white border border-gray-300 rounded px-1 py-0.5 w-16 mx-1">
        <input
          type="number"
          min={1}
          max={120}
          value={styles.fontSize}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v > 0) {
              onSetStyles('fontSize', v);
              onSetFontSize(v);
            }
          }}
          className="w-full text-center outline-none bg-transparent border-none p-0 h-5 text-sm text-gray-700"
          title="Tamanho da fonte (pt)"
        />
        <span className="text-[10px] text-gray-400 select-none">pt</span>
      </div>

      <Sep />

      {/* Formatting */}
      <ToolbarButton icon="bold" title="Negrito (Ctrl+B)" onClick={() => onExecCommand('bold')} />
      <ToolbarButton icon="italic" title="Italico (Ctrl+I)" onClick={() => onExecCommand('italic')} />
      <ToolbarButton icon="underline" title="Sublinhado (Ctrl+U)" onClick={() => onExecCommand('underline')} />
      <ToolbarButton icon="strikethrough" title="Tachado" onClick={() => onExecCommand('strikeThrough')} />
      <ToolbarButton icon="superscript" title="Sobrescrito" onClick={() => onExecCommand('superscript')} />
      <ToolbarButton icon="subscript" title="Subscrito" onClick={() => onExecCommand('subscript')} />

      {/* Text color */}
      <div className="relative p-1 rounded hover:bg-gray-200 cursor-pointer flex items-center justify-center" title="Cor do texto">
        <Icon name="type" size={18} style={{ color: styles.textColor }} />
        <div className="h-1 w-4 absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full" style={{ backgroundColor: styles.textColor }} />
        <input
          type="color"
          value={styles.textColor}
          onChange={(e) => {
            onSetStyles('textColor', e.target.value);
            onExecCommand('foreColor', e.target.value);
          }}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
      </div>

      {/* Highlight color */}
      <div className="relative p-1 rounded hover:bg-gray-200 cursor-pointer flex items-center justify-center" title="Cor de realce">
        <Icon name="highlighter" size={18} style={{ color: styles.highlightColor }} />
        <div className="h-1 w-4 absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full" style={{ backgroundColor: styles.highlightColor }} />
        <input
          type="color"
          value={styles.highlightColor}
          onChange={(e) => {
            onSetStyles('highlightColor', e.target.value);
            onExecCommand('hiliteColor', e.target.value);
          }}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
      </div>

      <Sep />

      {/* Alignment */}
      <ToolbarButton icon="align-left" title="Alinhar a esquerda" onClick={() => onExecCommand('justifyLeft')} />
      <ToolbarButton icon="align-center" title="Centralizar" onClick={() => onExecCommand('justifyCenter')} />
      <ToolbarButton icon="align-right" title="Alinhar a direita" onClick={() => onExecCommand('justifyRight')} />
      <ToolbarButton icon="align-justify" title="Justificar" onClick={() => onExecCommand('justifyFull')} />

      <Sep />

      {/* Line spacing */}
      <DropdownButton icon="arrow-up-down" title="Espacamento">
        <div className="w-56">
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase border-b">Espacamento entre linhas</div>
          {[
            { v: '1', l: 'Simples (1.0)' },
            { v: '1.15', l: '1.15' },
            { v: '1.5', l: '1.5 (ABNT)', bold: true },
            { v: '2', l: 'Duplo (2.0)' },
          ].map(item => (
            <button
              key={item.v}
              className={`text-left px-4 py-2 hover:bg-blue-50 text-sm w-full border-none bg-transparent cursor-pointer ${item.bold ? 'font-medium text-blue-700' : ''}`}
              onClick={() => onExecCommand('lineHeight', item.v)}
            >
              {item.l}
            </button>
          ))}
        </div>
      </DropdownButton>

      <ToolbarButton icon="indent" title="Aumentar recuo" onClick={() => onExecCommand('indent')} />
      <ToolbarButton icon="outdent" title="Diminuir recuo" onClick={() => onExecCommand('outdent')} />

      <Sep />

      {/* ABNT button */}
      <button
        type="button"
        className="flex items-center gap-1 px-2 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-sm cursor-pointer"
        onClick={onApplyABNT}
        onMouseDown={(e) => e.preventDefault()}
        title="Aplicar padrao ABNT"
      >
        <span className="font-bold text-[10px]">ABNT</span>
        <Icon name="wand-2" size={14} />
      </button>

      <Sep />

      <ToolbarButton icon="list" title="Lista com marcadores" onClick={() => onExecCommand('insertUnorderedList')} />
      <ToolbarButton icon="list-ordered" title="Lista numerada" onClick={() => onExecCommand('insertOrderedList')} />

      <Sep />

      <ToolbarButton icon="eraser" title="Limpar formatacao" onClick={() => onExecCommand('removeFormat')} />

      {/* Change case */}
      <DropdownButton icon="a-large-small" title="Alterar caixa">
        <div className="w-48">
          <button className="text-left px-4 py-2 hover:bg-blue-50 text-sm w-full border-none bg-transparent cursor-pointer" onClick={() => onChangeCase('upper')}>MAIUSCULAS</button>
          <button className="text-left px-4 py-2 hover:bg-blue-50 text-sm w-full border-none bg-transparent cursor-pointer" onClick={() => onChangeCase('lower')}>minusculas</button>
          <button className="text-left px-4 py-2 hover:bg-blue-50 text-sm w-full border-none bg-transparent cursor-pointer" onClick={() => onChangeCase('title')}>Primeira Maiuscula</button>
          <button className="text-left px-4 py-2 hover:bg-blue-50 text-sm w-full border-none bg-transparent cursor-pointer" onClick={() => onChangeCase('sentence')}>Inicio de frase</button>
        </div>
      </DropdownButton>
    </div>
  );
}
