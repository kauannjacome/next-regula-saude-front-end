'use client';

import React, { useState } from 'react';
import ToolbarButton from './ToolbarButton';
import DropdownButton from './DropdownButton';
import SymbolsPicker from '../SymbolsPicker';
import type { DatabaseTable } from '../types';

function Sep() {
  return <div className="h-6 w-px bg-gray-300 mx-1 self-center shrink-0" />;
}

interface InsertTabProps {
  database: DatabaseTable[];
  onInsertTable: (rows: number, cols: number) => void;
  onInsertImage: () => void;
  onInsertImageUrl: () => void;
  onInsertLink: () => void;
  onInsertVariable: (varName: string) => void;
  onInsertPageBreak: () => void;
  onInsertHR: () => void;
  onInsertDate: () => void;
  onInsertTOC: () => void;
  onInsertQRCode?: (text: string, size?: number) => void | Promise<void>;
  onInsertSymbol?: (symbol: string) => void;
}

export default function InsertTab({
  database,
  onInsertTable,
  onInsertImage,
  onInsertImageUrl,
  onInsertLink,
  onInsertVariable,
  onInsertPageBreak,
  onInsertHR,
  onInsertDate,
  onInsertTOC,
  onInsertQRCode,
  onInsertSymbol,
}: InsertTabProps) {
  const [hoverRow, setHoverRow] = useState(0);
  const [hoverCol, setHoverCol] = useState(0);

  return (
    <div className="flex items-center flex-wrap gap-0.5">
      <ToolbarButton icon="image" label="Imagem" title="Inserir imagem" onClick={onInsertImage} />
      <ToolbarButton icon="image-plus" label="URL" title="Imagem por URL" onClick={onInsertImageUrl} />

      {/* Table picker */}
      <DropdownButton icon="table" label="Tabela">
        <div className="p-3 w-[300px]">
          <div className="mb-2 text-sm text-gray-600 font-medium text-center">
            {hoverRow > 0 ? `${hoverRow} x ${hoverCol}` : 'Inserir tabela'}
          </div>
          <div className="grid grid-cols-8 gap-0.5">
            {Array.from({ length: 64 }).map((_, i) => {
              const r = Math.floor(i / 8) + 1;
              const c = (i % 8) + 1;
              const isHighlighted = r <= hoverRow && c <= hoverCol;
              return (
                <div
                  key={i}
                  className={`w-7 h-7 border rounded-sm cursor-pointer transition-colors ${
                    isHighlighted ? 'bg-blue-200 border-blue-400' : 'bg-white border-gray-300'
                  }`}
                  onMouseEnter={() => { setHoverRow(r); setHoverCol(c); }}
                  onClick={() => onInsertTable(r, c)}
                />
              );
            })}
          </div>
        </div>
      </DropdownButton>

      <ToolbarButton icon="link" label="Link" onClick={onInsertLink} />

      {/* QR Code */}
      <DropdownButton icon="qr-code" label="QR Code">
        <div className="w-48">
          <button
            className="text-left px-4 py-2 hover:bg-blue-50 text-sm w-full border-none bg-transparent cursor-pointer"
            onClick={() => {
              if (typeof window !== 'undefined' && onInsertQRCode) {
                onInsertQRCode(window.location.href);
              }
            }}
          >
            URL da pagina
          </button>
          <button
            className="text-left px-4 py-2 hover:bg-blue-50 text-sm w-full border-none bg-transparent cursor-pointer"
            onClick={() => {
              const text = prompt('URL ou texto para o QR Code:');
              if (text?.trim() && onInsertQRCode) {
                onInsertQRCode(text.trim());
              }
            }}
          >
            URL/Texto personalizado
          </button>
        </div>
      </DropdownButton>

      <Sep />

      {/* Database variables */}
      {database.length > 0 && (
        <DropdownButton icon="database" label="Banco de Dados">
          <div className="w-64 max-h-80 overflow-y-auto">
            {database.map(table => (
              <React.Fragment key={table.tableName}>
                <div className="px-3 py-1.5 bg-gray-50 text-xs font-bold border-b text-gray-500 uppercase">
                  {table.displayName}
                </div>
                {table.fields.map(field => {
                  const varName = `{{${table.tableName.toLowerCase()}.${field.value}}}`;
                  return (
                    <button
                      key={field.value}
                      className="text-left w-full px-4 py-2 hover:bg-blue-50 text-sm border-l-2 border-transparent hover:border-blue-500"
                      onClick={() => onInsertVariable(varName)}
                    >
                      <div className="font-medium text-gray-800">{field.label}</div>
                      <div className="text-xs text-gray-400 font-mono bg-gray-50 px-1 rounded mt-0.5">{varName}</div>
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </DropdownButton>
      )}

      <Sep />

      <ToolbarButton icon="minus" label="Linha" title="Linha horizontal" onClick={onInsertHR} />
      <ToolbarButton icon="calendar" label="Data" onClick={onInsertDate} />
      <ToolbarButton icon="file-plus" label="Quebra" title="Quebra de pagina" onClick={onInsertPageBreak} />
      <Sep />
      <ToolbarButton icon="list-tree" label="Sumario" onClick={onInsertTOC} />

      {/* Symbols picker */}
      {onInsertSymbol && (
        <>
          <Sep />
          <DropdownButton icon="omega" label="Simbolos">
            <SymbolsPicker onInsert={onInsertSymbol} />
          </DropdownButton>
        </>
      )}
    </div>
  );
}
