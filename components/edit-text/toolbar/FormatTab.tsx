'use client';

import React from 'react';
import ToolbarButton from './ToolbarButton';

function Sep() {
  return <div className="h-6 w-px bg-gray-300 mx-1 self-center shrink-0" />;
}

interface FormatTabProps {
  onExecCommand: (cmd: string) => void;
}

export default function FormatTab({ onExecCommand }: FormatTabProps) {
  return (
    <div className="flex items-center flex-wrap gap-0.5">
      <div className="flex gap-0.5 border border-gray-200 rounded p-0.5 bg-white">
        <ToolbarButton icon="bold" title="Negrito" onClick={() => onExecCommand('bold')} />
        <ToolbarButton icon="italic" title="Italico" onClick={() => onExecCommand('italic')} />
        <ToolbarButton icon="underline" title="Sublinhado" onClick={() => onExecCommand('underline')} />
        <ToolbarButton icon="strikethrough" title="Tachado" onClick={() => onExecCommand('strikeThrough')} />
      </div>

      <Sep />

      <div className="flex gap-0.5 border border-gray-200 rounded p-0.5 bg-white">
        <ToolbarButton icon="superscript" title="Sobrescrito" onClick={() => onExecCommand('superscript')} />
        <ToolbarButton icon="subscript" title="Subscrito" onClick={() => onExecCommand('subscript')} />
      </div>

      <Sep />

      <div className="flex gap-0.5 border border-gray-200 rounded p-0.5 bg-white">
        <ToolbarButton icon="align-left" title="Esquerda" onClick={() => onExecCommand('justifyLeft')} />
        <ToolbarButton icon="align-center" title="Centro" onClick={() => onExecCommand('justifyCenter')} />
        <ToolbarButton icon="align-right" title="Direita" onClick={() => onExecCommand('justifyRight')} />
        <ToolbarButton icon="align-justify" title="Justificar" onClick={() => onExecCommand('justifyFull')} />
      </div>

      <Sep />

      <ToolbarButton icon="eraser" label="Limpar formatacao" onClick={() => onExecCommand('removeFormat')} />
    </div>
  );
}
