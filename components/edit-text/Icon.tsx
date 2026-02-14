'use client';

import React from 'react';
import {
  Undo2, Redo2, Printer, Bold, Italic, Underline, Strikethrough,
  Superscript, Subscript, Type, Highlighter,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ArrowUpDown, IndentIncrease, IndentDecrease, Wand2,
  List, ListOrdered, Eraser, ALargeSmall, ChevronDown,
  FolderOpen, FileDown, FileText, Download, FileType,
  Scissors, Copy, Clipboard, ScanLine, Search,
  File, Smartphone, Monitor, SquareDashedBottom, Columns2,
  PaintBucket, Maximize,
  Image, ImagePlus, Table, Link, Database,
  Minus, Plus, Calendar, FilePlus, ListTree, WholeWord,
  SquareCheck, Palette, QrCode, PanelTop, PanelBottom, Omega,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  'undo': Undo2,
  'undo-2': Undo2,
  'redo': Redo2,
  'redo-2': Redo2,
  'printer': Printer,
  'bold': Bold,
  'italic': Italic,
  'underline': Underline,
  'strikethrough': Strikethrough,
  'superscript': Superscript,
  'subscript': Subscript,
  'type': Type,
  'highlighter': Highlighter,
  'align-left': AlignLeft,
  'align-center': AlignCenter,
  'align-right': AlignRight,
  'align-justify': AlignJustify,
  'arrow-up-down': ArrowUpDown,
  'indent': IndentIncrease,
  'indent-increase': IndentIncrease,
  'outdent': IndentDecrease,
  'indent-decrease': IndentDecrease,
  'wand-2': Wand2,
  'list': List,
  'list-ordered': ListOrdered,
  'eraser': Eraser,
  'a-large-small': ALargeSmall,
  'chevron-down': ChevronDown,
  'folder-open': FolderOpen,
  'file-down': FileDown,
  'file-text': FileText,
  'download': Download,
  'file-type': FileType,
  'scissors': Scissors,
  'copy': Copy,
  'clipboard': Clipboard,
  'scan-line': ScanLine,
  'search': Search,
  'file': File,
  'smartphone': Smartphone,
  'monitor': Monitor,
  'square-dashed-bottom': SquareDashedBottom,
  'columns-2': Columns2,
  'paint-bucket': PaintBucket,
  'maximize': Maximize,
  'image': Image,
  'image-plus': ImagePlus,
  'table': Table,
  'link': Link,
  'database': Database,
  'minus': Minus,
  'plus': Plus,
  'calendar': Calendar,
  'file-plus': FilePlus,
  'list-tree': ListTree,
  'whole-word': WholeWord,
  'square-check': SquareCheck,
  'palette': Palette,
  'qr-code': QrCode,
  'panel-top': PanelTop,
  'panel-bottom': PanelBottom,
  'omega': Omega,
};

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Icon({ name, size = 18, className, style }: IconProps) {
  const Component = ICON_MAP[name];
  if (!Component) {
    return <span className={className} style={{ width: size, height: size, display: 'inline-block', ...style }} />;
  }
  return <Component size={size} className={className} style={style} />;
}
