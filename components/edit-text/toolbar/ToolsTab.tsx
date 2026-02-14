'use client';

import React from 'react';
import ToolbarButton from './ToolbarButton';

function Sep() {
  return <div className="h-6 w-px bg-gray-300 mx-1 self-center shrink-0" />;
}

interface ToolsTabProps {
  trackChanges: boolean;
  onToggleTrackChanges: () => void;
  onInsertTOC: () => void;
  onWordCount: () => void;
}

export default function ToolsTab({
  trackChanges,
  onToggleTrackChanges,
  onInsertTOC,
  onWordCount,
}: ToolsTabProps) {
  return (
    <div className="flex items-center flex-wrap gap-0.5">
      <ToolbarButton icon="whole-word" label="Contagem" title="Contagem de palavras" onClick={onWordCount} />
      <Sep />
      <ToolbarButton icon="list-tree" label="Sumario" onClick={onInsertTOC} />
      <Sep />
      <label className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 rounded cursor-pointer" onClick={onToggleTrackChanges}>
        <input type="checkbox" checked={trackChanges} readOnly className="pointer-events-none" />
        <span className="text-sm">Controle de alteracoes</span>
      </label>
    </div>
  );
}
