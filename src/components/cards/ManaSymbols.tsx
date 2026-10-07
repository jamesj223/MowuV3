import React from 'react';

interface ManaSymbolsProps {
  cost: string;
  className?: string;
}

export const ManaSymbols: React.FC<ManaSymbolsProps> = ({ cost, className = '' }) => {
  if (!cost) return null;

  // Match symbols like {W}, {U}, {B}, {R}, {G}, {1}, {2}, etc.
  const regex = /\{([^}]+)\}/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(cost)) !== null) {
    matches.push(match[1]);
  }

  const getPipStyle = (symbol: string) => {
    switch (symbol.toUpperCase()) {
      case 'W':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'U':
        return 'bg-sky-200 text-sky-900 border-sky-400';
      case 'B':
        return 'bg-neutral-800 text-neutral-100 border-neutral-600';
      case 'R':
        return 'bg-rose-500 text-white border-rose-600';
      case 'G':
        return 'bg-emerald-600 text-white border-emerald-700';
      default:
        // Generic number or colorless
        return 'bg-neutral-300 text-neutral-800 border-neutral-400';
    }
  };

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {matches.map((sym, idx) => (
        <span
          key={idx}
          className={`inline-flex items-center justify-center font-bold font-mono rounded-full border shadow-xs select-none w-5 h-5 text-xs ${getPipStyle(
            sym
          )}`}
          title={`{${sym}}`}
        >
          {sym}
        </span>
      ))}
    </span>
  );
};
