'use client';

import React from 'react';
import HomeTab from './HomeTab';
import FileTab from './FileTab';
import EditTab from './EditTab';
import ViewTab from './ViewTab';
import InsertTab from './InsertTab';
import FormatTab from './FormatTab';
import ToolsTab from './ToolsTab';
import type { EditorState, StyleState, PageSizeKey, Margins, DatabaseTable } from '../types';
import { TABS } from '../constants';
import { ContextToolbar } from '../ContextToolbar';

interface ToolbarProps {
  state: EditorState;
  database: DatabaseTable[];
  activeContext?: 'Imagem' | 'Tabela' | 'QRCode' | null;
  selectedElement?: HTMLElement | null;
  onUpdateStats?: () => void;
  onSetTab: (tab: string) => void;
  onExecCommand: (cmd: string, value?: string) => void;
  onSetFontSize: (size: number) => void;
  onSetFontFamily: (family: string) => void;
  onChangeCase: (type: 'upper' | 'lower' | 'title' | 'sentence') => void;
  onUndo: () => void;
  onRedo: () => void;
  onApplyABNT: () => void;
  onSetStyles: <K extends keyof StyleState>(key: K, value: StyleState[K]) => void;
  onExport: (format: 'pdf' | 'docx' | 'html' | 'txt') => void;
  onImport: () => void;
  onSetPageSize: (size: PageSizeKey) => void;
  onSetOrientation: (o: 'portrait' | 'landscape') => void;
  onSetMargins: (m: Partial<Margins>) => void;
  onSetColumns: (c: 1 | 2 | 3) => void;
  onToggleRuler: () => void;
  onToggleDarkMode: () => void;
  onSetZoom: (z: number) => void;
  onSetPageBackground: (color: string) => void;
  onInsertTable: (rows: number, cols: number) => void;
  onInsertImage: () => void;
  onInsertImageUrl: () => void;
  onInsertLink: () => void;
  onInsertVariable: (varName: string) => void;
  onInsertPageBreak: () => void;
  onInsertHR: () => void;
  onInsertDate: () => void;
  onInsertTOC: () => void;
  onToggleTrackChanges: () => void;
  onWordCount: () => void;
  onInsertQRCode?: (text: string, size?: number) => void;
  onEditHeader?: () => void;
  onEditFooter?: () => void;
  onTogglePrimeiraPaginaDiferente?: () => void;
  onToggleParImparDiferente?: () => void;
  onFindReplace?: () => void;
  onInsertSymbol?: (symbol: string) => void;
}

export default function Toolbar(props: ToolbarProps) {
  const { state, onSetTab } = props;
  const activeTab = state.activeTab;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Inicio':
        return (
          <HomeTab
            styles={state.styles}
            onExecCommand={props.onExecCommand}
            onSetFontSize={props.onSetFontSize}
            onSetFontFamily={props.onSetFontFamily}
            onChangeCase={props.onChangeCase}
            onUndo={props.onUndo}
            onRedo={props.onRedo}
            onApplyABNT={props.onApplyABNT}
            onSetStyles={props.onSetStyles}
          />
        );
      case 'Arquivo':
        return (
          <FileTab
            onExport={props.onExport}
            onImport={props.onImport}
            onPrint={() => window.print()}
          />
        );
      case 'Editar':
        return (
          <EditTab
            onUndo={props.onUndo}
            onRedo={props.onRedo}
            onExecCommand={props.onExecCommand}
            onFindReplace={props.onFindReplace}
          />
        );
      case 'Exibir':
        return (
          <ViewTab
            state={state}
            onSetPageSize={props.onSetPageSize}
            onSetOrientation={props.onSetOrientation}
            onSetMargins={props.onSetMargins}
            onSetColumns={props.onSetColumns}
            onToggleRuler={props.onToggleRuler}
            onToggleDarkMode={props.onToggleDarkMode}
            onSetPageBackground={props.onSetPageBackground}
            onEditHeader={props.onEditHeader}
            onEditFooter={props.onEditFooter}
            onTogglePrimeiraPaginaDiferente={props.onTogglePrimeiraPaginaDiferente}
            onToggleParImparDiferente={props.onToggleParImparDiferente}
          />
        );
      case 'Inserir':
        return (
          <InsertTab
            database={props.database}
            onInsertTable={props.onInsertTable}
            onInsertImage={props.onInsertImage}
            onInsertImageUrl={props.onInsertImageUrl}
            onInsertLink={props.onInsertLink}
            onInsertVariable={props.onInsertVariable}
            onInsertPageBreak={props.onInsertPageBreak}
            onInsertHR={props.onInsertHR}
            onInsertDate={props.onInsertDate}
            onInsertTOC={props.onInsertTOC}
            onInsertQRCode={props.onInsertQRCode}
            onInsertSymbol={props.onInsertSymbol}
          />
        );
      case 'Formatar':
        return <FormatTab onExecCommand={props.onExecCommand} />;
      case 'Ferramentas':
        return (
          <ToolsTab
            trackChanges={state.trackChanges}
            onToggleTrackChanges={props.onToggleTrackChanges}
            onInsertTOC={props.onInsertTOC}
            onWordCount={props.onWordCount}
          />
        );
      default:
        // Abas contextuais (Imagem, Tabela, QRCode)
        if ((activeTab === 'Imagem' || activeTab === 'Tabela' || activeTab === 'QRCode') && props.selectedElement) {
          return (
            <ContextToolbar
              activeType={activeTab as any}
              target={props.selectedElement}
              onUpdate={() => props.onUpdateStats?.()}
            />
          );
        }
        return <span className="text-sm text-gray-400 px-2">{activeTab}</span>;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shrink-0" onMouseDown={(e) => { if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'SELECT') e.preventDefault(); }}>
      {/* Tab menu */}
      <div className="flex items-center gap-0.5 px-4 border-b border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab}
            type="button"
            className={`px-4 py-1.5 text-sm font-medium rounded-t transition-colors cursor-pointer border-none ${activeTab === tab
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
            onClick={() => onSetTab(tab)}
          >
            {tab}
          </button>
        ))}
        {/* Dynamic Context Tabs */}
        {props.activeContext && props.selectedElement && (
          <button
            type="button"
            className={`px-4 py-1.5 text-sm font-medium rounded-t transition-colors cursor-pointer border-none ${activeTab === props.activeContext
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'text-blue-600 hover:bg-blue-50'
              }`}
            onClick={() => onSetTab(props.activeContext!)}
          >
            {props.activeContext} Formato
          </button>
        )}
      </div>

      {/* Toolbar content */}
      <div className="flex items-center flex-wrap gap-1 px-4 py-1.5 min-h-[44px] bg-gray-50 border-b border-gray-200">
        {renderTabContent()}
      </div>
    </header>
  );
}
