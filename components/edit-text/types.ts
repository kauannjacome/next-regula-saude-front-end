export type PageSizeKey = 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5' | 'B5';

export interface PageSizeDefinition {
  w: number;
  h: number;
  label: string;
}

export interface Margins {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface PageConfig {
  size?: PageSizeKey;
  orientation?: 'portrait' | 'landscape';
  margins?: Partial<Margins>;
  columns?: 1 | 2 | 3;
  background?: string;
  headerHTML?: string;
  footerHTML?: string;
  watermarkText?: string;
  watermarkOpacity?: number;
  primeiraPaginaDiferente?: boolean;
  parImparDiferente?: boolean;
  primeiraPaginaHeaderHTML?: string;
  primeiraPaginaFooterHTML?: string;
  paginasParesHeaderHTML?: string;
  paginasParesFooterHTML?: string;
}

export interface DatabaseField {
  label: string;
  value: string;
}

export interface DatabaseTable {
  tableName: string;
  displayName: string;
  fields: DatabaseField[];
}

export interface QuickText {
  id: string;
  label: string;
  content: string;
}

export interface WordStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  paragraphs: number;
  lines: number;
  pages: number;
}

export interface StyleState {
  fontSize: number;
  fontFamily: string;
  blockType: string;
  textColor: string;
  highlightColor: string;
}

export interface EditorState {
  activeTab: string;
  showRuler: boolean;
  zoom: number;
  margins: Margins;
  pageSize: PageSizeKey;
  pageOrientation: 'portrait' | 'landscape';
  styles: StyleState;
  darkMode: boolean;
  columns: 1 | 2 | 3;
  pageBackground: string;
  headerHTML: string;
  footerHTML: string;
  watermarkText: string;
  watermarkOpacity: number;
  trackChanges: boolean;
  primeiraPaginaDiferente: boolean;
  parImparDiferente: boolean;
  primeiraPaginaHeaderHTML: string;
  primeiraPaginaFooterHTML: string;
  paginasParesHeaderHTML: string;
  paginasParesFooterHTML: string;
}

export interface Marker {
  type: 'variable' | 'text';
  value: string;
  table?: string;
  field?: string;
}

export interface SerializedDocument {
  html: string;
  markers: Marker[];
  pageConfig: PageConfig;
  dbModels: { table: string; displayName: string; fields: { label: string; value: string }[] }[];
  quickTexts: QuickText[];
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'html' | 'txt';
  filename?: string;
  output?: 'download' | 'blob';
}

export interface ExportResult {
  format: string;
  filename: string;
  blob?: Blob;
  mimeType: string;
  size: number;
}

export type ToolbarTab = 'Home' | 'File' | 'Edit' | 'View' | 'Insert' | 'Format' | 'Tools';

export interface EditorHandle {
  getHTML: () => string;
  setHTML: (html: string) => void;
  getText: () => string;
  serialize: () => SerializedDocument;
  exportDoc: (options?: ExportOptions) => Promise<ExportResult>;
  importFile: (file?: File) => Promise<void>;
  undo: () => void;
  redo: () => void;
  setDatabaseSchema: (schema: DatabaseTable[]) => void;
  setQuickTexts: (texts: QuickText[]) => void;
  loadBackendData: (data: { dbModels?: DatabaseTable[]; quickTexts?: QuickText[] }) => void;
  execCommand: (cmd: string, value?: string) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  insertTable: (rows: number, cols: number) => void;
  insertPageBreak: () => void;
  setZoom: (percent: number) => void;
  clear: () => void;
}

export interface EditorProps {
  title?: string;
  initialContent?: string;
  onChange?: (html: string) => void;
  onStats?: (stats: WordStats) => void;
  onReady?: () => void;
  database?: DatabaseTable[];
  quickTexts?: QuickText[];
  readOnly?: boolean;
  darkMode?: boolean;
  pageConfig?: PageConfig;
  className?: string;
  subscriberId?: number | string;
}
