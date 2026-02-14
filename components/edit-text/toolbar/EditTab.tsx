'use client';

import React from 'react';
import ToolbarButton from './ToolbarButton';

function Sep() {
  return <div className="h-6 w-px bg-gray-300 mx-1 self-center shrink-0" />;
}

interface EditTabProps {
  onUndo: () => void;
  onRedo: () => void;
  onExecCommand: (cmd: string) => void;
  onFindReplace?: () => void;
}

export default function EditTab({ onUndo, onRedo, onExecCommand, onFindReplace }: EditTabProps) {
  return (
    <div className="flex items-center flex-wrap gap-0.5">
      <ToolbarButton icon="undo" title="Desfazer" onClick={onUndo} />
      <ToolbarButton icon="redo" title="Refazer" onClick={onRedo} />
      <Sep />
      <ToolbarButton icon="scissors" label="Recortar" title="Ctrl+X" onClick={() => document.execCommand('cut')} />
      <ToolbarButton icon="copy" label="Copiar" title="Ctrl+C" onClick={() => document.execCommand('copy')} />
      <ToolbarButton icon="clipboard" label="Colar" title="Ctrl+V" onClick={() => document.execCommand('paste')} />
      <Sep />
      <ToolbarButton icon="scan-line" label="Selecionar tudo" onClick={() => onExecCommand('selectAll')} />
      <Sep />
      <ToolbarButton icon="search" label="Localizar" title="Ctrl+F" onClick={() => {
        if (onFindReplace) {
          onFindReplace();
        } else if (typeof window !== 'undefined') {
          (window as any).find?.();
        }
      }} />
      <ToolbarButton icon="whole-word" label="Substituir" title="Ctrl+H" onClick={() => {
        onFindReplace?.();
      }} />
    </div>
  );
}
