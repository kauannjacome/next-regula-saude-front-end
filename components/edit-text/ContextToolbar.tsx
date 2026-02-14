
import React, { useState } from 'react';
import { Trash2, RotateCcw, RotateCw, FlipHorizontal, FlipVertical, AlignLeft, AlignRight, Square, Box, RectangleHorizontal, Minus, ArrowUp, ArrowDown, TableCellsMerge, TableCellsSplit, ArrowUpDown, Columns2, Rows2, PaintBucket, Type, Frame, Edit3, RefreshCw, RotateCcw as ResetIcon, Replace, WrapText, Split, BringToFront, SendToBack } from 'lucide-react';
import { ImageHelper } from './utils/ImageHelper';
import { TableHelper } from './utils/TableHelper';
import { QRCodeHelper } from './utils/QRCodeHelper';

interface ContextToolbarProps {
  activeType: 'Imagem' | 'Tabela' | 'QRCode' | null;
  target: HTMLElement | null;
  onUpdate: () => void;
}

export const ContextToolbar: React.FC<ContextToolbarProps> = ({ activeType, target, onUpdate }) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  if (!target) return null;

  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  // --- IMAGE TOOLBAR ---
  if (activeType === 'Imagem') {
    const currentWrap = ImageHelper.getWrapMode(target);
    const imgW = target.offsetWidth;
    const imgH = target.offsetHeight;
    const currentOpacity = Math.round((parseFloat(target.style.opacity) || 1) * 100);

    const handleSwapImage = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          (target as HTMLImageElement).src = ev.target?.result as string;
          onUpdate();
        };
        reader.readAsDataURL(file);
      };
      input.click();
    };

    const handleResetTransform = () => {
      target.style.transform = '';
      target.style.opacity = '';
      onUpdate();
    };

    const handleSetAltText = () => {
      const current = target.getAttribute('alt') || '';
      const newAlt = prompt('Texto alternativo (alt):', current);
      if (newAlt !== null) {
        target.setAttribute('alt', newAlt);
        onUpdate();
      }
    };

    const wrapIcons: Record<string, React.ReactNode> = {
      'inline': <WrapText size={14} />,
      'square-left': <AlignLeft size={14} />,
      'square-right': <AlignRight size={14} />,
      'top-bottom': <Split size={14} />,
      'behind': <SendToBack size={14} />,
      'front': <BringToFront size={14} />
    };

    return (
      <div className="flex items-center gap-2 h-full">
        {/* Wrap Mode */}
        <div className="flex items-center gap-1 border-r pr-2 h-6">
          <span className="text-[10px] font-bold text-gray-500 uppercase mr-1">Quebra</span>
          {(['inline', 'square-left', 'square-right', 'top-bottom', 'behind', 'front'] as const).map(m => (
            <button
              key={m}
              className={`p-1 rounded hover:bg-gray-200 ${currentWrap === m ? 'bg-blue-100 text-blue-700' : ''}`}
              onClick={() => ImageHelper.setWrap(target, m, onUpdate)}
              title={m}
            >
              {wrapIcons[m]}
            </button>
          ))}
        </div>

        {/* Dimensions */}
        <div className="flex items-center gap-1 border-r pr-2 h-6">
          <span className="text-[10px] font-bold text-gray-500 uppercase">Tam.</span>
          <input
            type="number"
            className="w-12 h-6 text-xs border rounded px-1"
            value={imgW}
            onChange={(e) => ImageHelper.updateSize(target, 'w', parseInt(e.target.value), onUpdate)}
          />
          <span className="text-xs text-gray-400">x</span>
          <input
            type="number"
            className="w-12 h-6 text-xs border rounded px-1"
            value={imgH}
            onChange={(e) => ImageHelper.updateSize(target, 'h', parseInt(e.target.value), onUpdate)}
          />
        </div>

        {/* Opacity */}
        <div className="flex items-center gap-1 border-r pr-2 h-6">
          <span className="text-[10px] font-bold text-gray-500 uppercase">Opac.</span>
          <input
            type="range"
            min={10}
            max={100}
            value={currentOpacity}
            onChange={(e) => {
              target.style.opacity = String(parseInt(e.target.value) / 100);
              onUpdate();
            }}
            className="w-16 h-4"
            title={`Opacidade: ${currentOpacity}%`}
          />
          <span className="text-[10px] text-gray-500 w-7">{currentOpacity}%</span>
        </div>

        {/* Rotate */}
        <div className="flex items-center gap-0.5 border-r pr-2 h-6">
          <button onClick={() => ImageHelper.rotate(target, -90, onUpdate)} className="p-1 hover:bg-gray-100 rounded" title="Girar Esq."><RotateCcw size={14} /></button>
          <button onClick={() => ImageHelper.rotate(target, 90, onUpdate)} className="p-1 hover:bg-gray-100 rounded" title="Girar Dir."><RotateCw size={14} /></button>
          <button onClick={() => ImageHelper.flip(target, 'h', onUpdate)} className="p-1 hover:bg-gray-100 rounded" title="Espelhar H"><FlipHorizontal size={14} /></button>
          <button onClick={() => ImageHelper.flip(target, 'v', onUpdate)} className="p-1 hover:bg-gray-100 rounded" title="Espelhar V"><FlipVertical size={14} /></button>
        </div>

        {/* Border */}
        <div className="flex items-center gap-0.5 border-r pr-2 h-6">
          <button onClick={() => ImageHelper.setBorder(target, 'none', onUpdate)} className="p-1 hover:bg-gray-100 rounded" title="Sem Borda"><Minus size={14} /></button>
          <button onClick={() => ImageHelper.setBorder(target, 'thin', onUpdate)} className="p-1 hover:bg-gray-100 rounded" title="Borda Fina"><Square size={14} /></button>
          <button onClick={() => ImageHelper.setBorder(target, 'rounded', onUpdate)} className="p-1 hover:bg-gray-100 rounded" title="Arredondada"><RectangleHorizontal size={14} /></button>
          <button onClick={() => ImageHelper.setBorder(target, 'shadow', onUpdate)} className="p-1 hover:bg-gray-100 rounded" title="Sombra"><Box size={14} /></button>
        </div>

        {/* Extra actions */}
        <div className="flex items-center gap-0.5 border-r pr-2 h-6">
          <button onClick={handleResetTransform} className="p-1 hover:bg-gray-100 rounded" title="Reset Transformacoes"><ResetIcon size={14} /></button>
          <button onClick={handleSwapImage} className="p-1 hover:bg-gray-100 rounded" title="Trocar Imagem"><Replace size={14} /></button>
          <button onClick={handleSetAltText} className="p-1 hover:bg-gray-100 rounded" title="Texto Alt"><Type size={14} /></button>
        </div>

        {/* Remove */}
        <button
          className="p-1 text-red-600 hover:bg-red-50 rounded"
          onClick={() => { target.remove(); onUpdate(); }}
          title="Remover Imagem"
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  // --- TABLE TOOLBAR ---
  if (activeType === 'Tabela') {
    return (
      <div className="flex items-center gap-2 h-full text-sm">
        {/* Insert */}
        <div className="relative">
          <button className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded" onClick={() => toggleDropdown('insert')}>
            <ArrowDown size={14} /> Inserir ...
          </button>
          {activeDropdown === 'insert' && (
            <div className="absolute top-full left-0 bg-white border shadow-lg rounded p-1 flex flex-col w-32 z-50">
              <button className="text-left px-2 py-1 hover:bg-gray-50 flex gap-2" onClick={() => TableHelper.insertRow('above', onUpdate)}>Linha Acima</button>
              <button className="text-left px-2 py-1 hover:bg-gray-50 flex gap-2" onClick={() => TableHelper.insertRow('after', onUpdate)}>Linha Abaixo</button>
              <div className="border-t my-1" />
              <button className="text-left px-2 py-1 hover:bg-gray-50 flex gap-2" onClick={() => TableHelper.insertColumn('before', onUpdate)}>Coluna Esq.</button>
              <button className="text-left px-2 py-1 hover:bg-gray-50 flex gap-2" onClick={() => TableHelper.insertColumn('after', onUpdate)}>Coluna Dir.</button>
            </div>
          )}
        </div>

        {/* Delete */}
        <div className="relative">
          <button className="flex items-center gap-1 px-2 py-1 hover:bg-red-50 text-red-600 rounded" onClick={() => toggleDropdown('delete')}>
            <Trash2 size={14} /> Excluir ...
          </button>
          {activeDropdown === 'delete' && (
            <div className="absolute top-full left-0 bg-white border shadow-lg rounded p-1 flex flex-col w-32 z-50">
              <button className="text-left px-2 py-1 hover:bg-red-50 text-red-600" onClick={() => TableHelper.deleteRow(onUpdate)}>Excluir Linha</button>
              <button className="text-left px-2 py-1 hover:bg-red-50 text-red-600" onClick={() => TableHelper.deleteColumn(onUpdate)}>Excluir Coluna</button>
              <div className="border-t my-1" />
              <button className="text-left px-2 py-1 hover:bg-red-50 text-red-600 font-bold" onClick={() => TableHelper.deleteTable(onUpdate)}>Excluir Tabela</button>
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-gray-300 mx-1"></div>

        {/* Merge/Split */}
        <button className="p-1 hover:bg-gray-100 rounded" onClick={() => TableHelper.mergeCells(onUpdate)} title="Mesclar"><TableCellsMerge size={16} /></button>
        <button className="p-1 hover:bg-gray-100 rounded" onClick={() => TableHelper.splitCell(onUpdate)} title="Dividir"><TableCellsSplit size={16} /></button>

        <div className="w-px h-4 bg-gray-300 mx-1"></div>

        {/* Align */}
        <button className="p-1 hover:bg-gray-100 rounded" onClick={() => TableHelper.setVerticalAlign('top', onUpdate)} title="Alinhar Topo"><ArrowUp size={14} /></button>
        <button className="p-1 hover:bg-gray-100 rounded" onClick={() => TableHelper.setVerticalAlign('middle', onUpdate)} title="Alinhar Meio"><ArrowUpDown size={14} /></button>
        <button className="p-1 hover:bg-gray-100 rounded" onClick={() => TableHelper.setVerticalAlign('bottom', onUpdate)} title="Alinhar Base"><ArrowDown size={14} /></button>

        <div className="w-px h-4 bg-gray-300 mx-1"></div>

        {/* Distribute */}
        <button className="p-1 hover:bg-gray-100 rounded" onClick={() => TableHelper.distributeColumns(onUpdate)} title="Distribuir Colunas"><Columns2 size={14} /></button>
        <button className="p-1 hover:bg-gray-100 rounded" onClick={() => TableHelper.distributeRows(onUpdate)} title="Distribuir Linhas"><Rows2 size={14} /></button>

        <div className="w-px h-4 bg-gray-300 mx-1"></div>

        {/* Colors */}
        <div className="flex items-center gap-1">
          <div className="relative group">
            <button className="p-1 hover:bg-gray-100 rounded"><PaintBucket size={14} /></button>
            <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => TableHelper.setCellStyle({ backgroundColor: e.target.value }, onUpdate)} title="Cor de Fundo" />
          </div>
          <div className="relative group">
            <button className="p-1 hover:bg-gray-100 rounded"><Frame size={14} /></button>
            <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => TableHelper.setCellStyle({ borderColor: e.target.value }, onUpdate)} title="Cor da Borda" />
          </div>
          <div className="relative group">
            <button className="p-1 hover:bg-gray-100 rounded"><Type size={14} /></button>
            <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => TableHelper.setCellStyle({ color: e.target.value }, onUpdate)} title="Cor do Texto" />
          </div>
        </div>
      </div>
    );
  }

  // --- QRCODE TOOLBAR ---
  if (activeType === 'QRCode') {
    const qrText = QRCodeHelper.getText(target);
    const qrSize = target.offsetWidth || 150;
    const currentWrap = QRCodeHelper.getWrapMode(target);
    const truncated = qrText.length > 30 ? qrText.substring(0, 30) + '...' : qrText;

    const handleEditURL = () => {
      const newText = prompt('URL ou texto do QR Code:', qrText);
      if (newText !== null && newText.trim()) {
        QRCodeHelper.regenerate(target, newText.trim(), qrSize, onUpdate);
      }
    };

    return (
      <div className="flex items-center gap-2 h-full">
        {/* Current text */}
        <div className="flex items-center gap-1 border-r pr-2 h-6 max-w-[180px]">
          <span className="text-[10px] font-bold text-gray-500 uppercase mr-1">QR</span>
          <span className="text-xs text-gray-600 truncate" title={qrText}>{truncated || '(vazio)'}</span>
        </div>

        {/* Edit / Regenerate */}
        <div className="flex items-center gap-0.5 border-r pr-2 h-6">
          <button onClick={handleEditURL} className="p-1 hover:bg-gray-100 rounded" title="Editar URL"><Edit3 size={14} /></button>
          <button onClick={() => QRCodeHelper.regenerate(target, qrText, qrSize, onUpdate)} className="p-1 hover:bg-gray-100 rounded" title="Regenerar"><RefreshCw size={14} /></button>
        </div>

        {/* Wrap Mode */}
        <div className="flex items-center gap-1 border-r pr-2 h-6">
          <span className="text-[10px] font-bold text-gray-500 uppercase mr-1">Quebra</span>
          {(['inline', 'square-left', 'square-right', 'top-bottom', 'behind', 'front'] as const).map(m => (
            <button
              key={m}
              className={`p-1 rounded hover:bg-gray-200 ${currentWrap === m ? 'bg-blue-100 text-blue-700' : ''}`}
              onClick={() => QRCodeHelper.setWrap(target, m, onUpdate)}
              title={m}
            >
              <span className="text-[10px] font-bold">{m.charAt(0).toUpperCase()}</span>
            </button>
          ))}
        </div>

        {/* Size slider */}
        <div className="flex items-center gap-1 border-r pr-2 h-6">
          <span className="text-[10px] font-bold text-gray-500 uppercase">Tam.</span>
          <input
            type="range"
            min={30}
            max={500}
            value={qrSize}
            onChange={(e) => QRCodeHelper.setSize(target, parseInt(e.target.value), onUpdate)}
            className="w-20 h-4"
          />
          <span className="text-[10px] text-gray-500 w-8">{qrSize}px</span>
        </div>

        {/* Remove */}
        <button
          className="p-1 text-red-600 hover:bg-red-50 rounded"
          onClick={() => { target.remove(); onUpdate(); }}
          title="Remover QR Code"
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  return null;
};
