'use client';

import React, { useState } from 'react';

interface SymbolsPickerProps {
  onInsert: (symbol: string) => void;
}

const SYMBOL_CATEGORIES: Record<string, string[]> = {
  'Matematica': [
    '±', '×', '÷', '≠', '≈', '≤', '≥', '∞', '√', '∑',
    '∏', '∫', '∂', '∆', '∇', '∈', '∉', '⊂', '⊃', '∪',
    '∩', '∅', '¹', '²', '³', '¼', '½', '¾', '‰', '°',
  ],
  'Moedas': [
    '€', '£', '¥', '¢', '₹', '₽', '₩', '₿', '₫', '₺',
    '₴', '₸', '₱', '₡', '₵',
  ],
  'Setas': [
    '←', '→', '↑', '↓', '↔', '↕', '⇐', '⇒', '⇑', '⇓',
    '⇔', '↗', '↘', '↙', '↖', '▶', '◀', '▲', '▼',
  ],
  'Legal / Marcas': [
    '©', '®', '™', '§', '¶', '†', '‡', '•', '◦', '※',
  ],
  'Grego': [
    'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ',
    'λ', 'μ', 'ν', 'ξ', 'π', 'ρ', 'σ', 'τ', 'φ', 'χ',
    'ψ', 'ω', 'Ω', 'Σ', 'Δ', 'Π', 'Φ', 'Ψ', 'Γ', 'Λ',
  ],
  'Tipografia': [
    '\u2014', '\u2013', '\u2026', '\u00AB', '\u00BB', '\u2039', '\u203A',
    '\u201C', '\u201D', '\u2018', '\u2019', '\u201A', '\u201E',
    '\u00A1', '\u00BF', '\u00B7', '\u2016', '\u00A6', '\u2042',
  ],
};

const CATEGORY_NAMES = Object.keys(SYMBOL_CATEGORIES);

export default function SymbolsPicker({ onInsert }: SymbolsPickerProps) {
  const [activeCategory, setActiveCategory] = useState(CATEGORY_NAMES[0]);
  const symbols = SYMBOL_CATEGORIES[activeCategory] || [];

  return (
    <div className="w-72 p-2">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-1 mb-2 border-b border-gray-200 pb-2">
        {CATEGORY_NAMES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`px-2 py-0.5 text-xs rounded cursor-pointer border-none transition-colors ${
              activeCategory === cat
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Symbol grid */}
      <div className="grid grid-cols-8 gap-0.5">
        {symbols.map((symbol, i) => (
          <button
            key={`${symbol}-${i}`}
            type="button"
            className="w-8 h-8 flex items-center justify-center text-base hover:bg-blue-50 hover:text-blue-700 rounded cursor-pointer border border-gray-200 bg-white transition-colors"
            onClick={() => onInsert(symbol)}
            title={`U+${symbol.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')}`}
          >
            {symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
