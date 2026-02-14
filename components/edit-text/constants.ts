import type { PageSizeKey, PageSizeDefinition, Margins } from './types';

export const PAGE_SIZES: Record<PageSizeKey, PageSizeDefinition> = {
  A4: { w: 794, h: 1123, label: 'A4 (210 x 297 mm)' },
  Letter: { w: 816, h: 1056, label: 'Carta (216 x 279 mm)' },
  Legal: { w: 816, h: 1344, label: 'Oficio (216 x 356 mm)' },
  A3: { w: 1123, h: 1587, label: 'A3 (297 x 420 mm)' },
  A5: { w: 559, h: 794, label: 'A5 (148 x 210 mm)' },
  B5: { w: 665, h: 944, label: 'B5 (176 x 250 mm)' },
};

export const DEFAULT_MARGINS: Margins = { left: 96, right: 96, top: 96, bottom: 96 };

export const FONT_FAMILIES = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Calibri', 'Cambria', 'Garamond', 'Tahoma', 'Trebuchet MS',
  'Palatino Linotype', 'Book Antiqua', 'Segoe UI',
];

export const BLOCK_TYPES = [
  { value: 'p', label: 'Texto Normal' },
  { value: 'h1', label: 'Titulo 1' },
  { value: 'h2', label: 'Titulo 2' },
  { value: 'h3', label: 'Titulo 3' },
  { value: 'h4', label: 'Titulo 4' },
  { value: 'h5', label: 'Titulo 5' },
  { value: 'h6', label: 'Titulo 6' },
  { value: 'pre', label: 'Codigo' },
  { value: 'blockquote', label: 'Citacao' },
];

export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

export const TABS = ['Inicio', 'Arquivo', 'Editar', 'Exibir', 'Inserir', 'Formatar', 'Ferramentas'] as const;
