'use client';

import React from 'react';
import ToolbarButton from './ToolbarButton';

function Sep() {
  return <div className="h-6 w-px bg-gray-300 mx-1 self-center shrink-0" />;
}

interface FileTabProps {
  onExport: (format: 'pdf' | 'docx' | 'html' | 'txt') => void;
  onImport: () => void;
  onPrint: () => void;
}

export default function FileTab({ onExport, onImport, onPrint }: FileTabProps) {
  return (
    <div className="flex items-center flex-wrap gap-0.5">
      <ToolbarButton icon="folder-open" label="Abrir" title="Importar arquivo" onClick={onImport} />
      <Sep />
      <ToolbarButton icon="file-down" label="PDF" title="Exportar PDF" onClick={() => onExport('pdf')} />
      <ToolbarButton icon="file-text" label="DOCX" title="Exportar DOCX" onClick={() => onExport('docx')} />
      <ToolbarButton icon="download" label="HTML" title="Exportar HTML" onClick={() => onExport('html')} />
      <ToolbarButton icon="file-type" label="TXT" title="Exportar TXT" onClick={() => onExport('txt')} />
      <Sep />
      <ToolbarButton icon="printer" label="Imprimir" title="Imprimir (Ctrl+P)" onClick={onPrint} />
    </div>
  );
}
