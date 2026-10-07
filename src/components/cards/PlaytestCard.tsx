import React, { useEffect, useState } from 'react';
import { ManaSymbols } from './ManaSymbols';
import { Minus, Plus, Skull, X, ZoomIn } from 'lucide-react';

interface PlaytestCardProps {
  name: string;
  manaCost?: string;
  typeLine: string;
  artFile: string;
  renderedText: string;
  flavorText?: string;
  power?: number | string;
  toughness?: number | string;
  counters?: number;
  variant?: 'in_play' | 'detailed';
  size?: 'sm' | 'md' | 'lg';
  onDismiss?: () => void;
  onClick?: () => void;
  onCounterChange?: (amount: number) => void;
  onContextMenuAction?: (action: 'increment' | 'decrement' | 'destroy') => void;
  showDismiss?: boolean;
}

export const PlaytestCard: React.FC<PlaytestCardProps> = ({
  name,
  manaCost = '',
  typeLine,
  artFile,
  renderedText,
  flavorText,
  power,
  toughness,
  counters = 0,
  variant = 'in_play',
  size = 'sm',
  onDismiss,
  onClick,
  onCounterChange,
  onContextMenuAction,
  showDismiss = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const isCreature = power !== undefined && toughness !== undefined;

  useEffect(() => {
    if (!contextMenuOpen) return;
    const closeMenu = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-counter-menu]')) setContextMenuOpen(false);
    };
    window.addEventListener('pointerdown', closeMenu);
    return () => window.removeEventListener('pointerdown', closeMenu);
  }, [contextMenuOpen]);

  // If in_play: ultra-clean, stripped down of unnecessary fluff (no flavor text, no set symbol, compact)
  if (variant === 'in_play') {
    return (
      <div
        onClick={() => {
          setContextMenuOpen(false);
          onClick?.();
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setContextMenuOpen(true);
        }}
        className={`relative group rounded-xl bg-neutral-900 border border-neutral-700 hover:border-amber-400 text-neutral-900 shadow-lg select-none flex flex-col justify-between transition-all duration-150 w-38 sm:w-44 min-h-[220px] max-h-[260px] p-2 cursor-pointer hover:-translate-y-1 hover:shadow-2xl`}
        style={{
          background: 'linear-gradient(145deg, #1e222b 0%, #13161d 100%)',
        }}
      >
        {/* Playtest Card Inner Face */}
        <div className="flex flex-col flex-grow rounded-lg bg-[#faf8f2] border border-[#333] p-1.5 overflow-hidden shadow-inner">
          {/* Header: Name only (no mana clutter needed in play) */}
          <div className="flex items-center justify-between bg-[#eeebe2] border border-[#ccc] rounded px-1.5 py-0.5 mb-1 shadow-2xs">
            <span className="font-serif font-bold text-neutral-900 text-[11px] truncate" title={name}>
              {name}
            </span>
          </div>

          {/* Art Window (Compact) */}
          <div className="relative w-full h-18 bg-[#e2dec9] rounded border border-[#999] overflow-hidden mb-1 flex items-center justify-center shrink-0">
            {!imageError ? (
              <img
                src={`/cards/${artFile}`}
                alt={name}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center text-xs text-neutral-500 bg-amber-50/60 w-full h-full font-mono">
                🎨 MS Paint
              </div>
            )}

            <div className="absolute bottom-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white rounded p-0.5">
              <ZoomIn className="w-3 h-3" />
            </div>
          </div>

          {/* Type Line */}
          <div className="bg-[#eeebe2] border border-[#ccc] rounded px-1 py-0.2 mb-1">
            <span className="font-serif font-semibold text-neutral-800 text-[9px] truncate block">
              {typeLine}
            </span>
          </div>

          {/* Rules Text Box */}
          <div className="flex-grow flex flex-col justify-between bg-[#fbf9f4] border border-[#ddd] rounded p-1 overflow-y-auto">
            <div className="font-sans text-neutral-900 font-medium text-[10px] leading-tight whitespace-pre-line">
              {renderedText}
            </div>
          </div>

          {/* P/T Box and bottom-left counter control if creature */}
          {isCreature && (
            <div className="flex items-center justify-end gap-1.5 mt-1">
              <div className="flex h-5 items-center rounded bg-[#e4e0d2] border border-[#555] font-serif font-bold text-neutral-900 px-1.5 py-0.2 text-[10px] shadow-2xs">
                {power} / {toughness}
              </div>
            </div>
          )}
        </div>

        {counters > 0 && onCounterChange && (
          <div className="absolute bottom-2 left-2 z-20 flex h-5 items-center gap-1 rounded-full border border-amber-500/40 bg-neutral-950/95 p-0.5 text-[9px] font-black text-amber-300 shadow-lg">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onCounterChange(-1);
              }}
              disabled={counters === 0}
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-neutral-800 text-[10px] text-white hover:bg-neutral-700 disabled:opacity-30"
              title="Remove one counter"
            >
              −
            </button>
            <span className="min-w-4 text-center font-mono">{counters}</span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onCounterChange(1);
              }}
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[10px] text-neutral-950 hover:bg-amber-400"
              title="Add one counter"
            >
              +
            </button>
          </div>
        )}

        {contextMenuOpen && onContextMenuAction && (
          <div data-counter-menu className="absolute bottom-2 left-2 z-30 min-w-44 rounded-xl border border-neutral-700 bg-neutral-950 p-1.5 text-xs text-neutral-200 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => { onContextMenuAction('increment'); setContextMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-neutral-800">
              <Plus className="w-3 w-3" /> Add counter
            </button>
            <button type="button" onClick={() => { onContextMenuAction('decrement'); setContextMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-neutral-800">
              <Minus className="w-3 h-3" /> Remove counter
            </button>
            <button type="button" onClick={() => { onContextMenuAction('destroy'); setContextMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-rose-400 hover:bg-rose-950/50">
              <Skull className="w-3 h-3" /> Destroy
            </button>
          </div>
        )}

        {/* Dismiss / Destroy Button */}
        {showDismiss && onDismiss && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-1 shadow-lg border-2 border-neutral-900 cursor-pointer transition-transform hover:scale-110 active:scale-95 z-20"
            title="Destroy / Dismiss this card"
          >
            {isCreature ? <Skull className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    );
  }

  // Detailed Full-size Card (for Zoom Modal)
  const sizeConfig = {
    sm: {
      container: 'w-48 min-h-[300px] text-xs p-2.5',
      artHeight: 'h-24',
      titleSize: 'text-xs font-bold truncate',
      typeSize: 'text-[10px]',
      bodySize: 'text-[11px] leading-tight',
      ptSize: 'text-xs px-1.5 py-0.5',
    },
    md: {
      container: 'w-64 min-h-[380px] text-sm p-3.5',
      artHeight: 'h-36',
      titleSize: 'text-sm font-bold truncate',
      typeSize: 'text-xs',
      bodySize: 'text-xs leading-normal',
      ptSize: 'text-sm px-2 py-0.5',
    },
    lg: {
      container: 'w-80 sm:w-92 min-h-[480px] text-base p-4',
      artHeight: 'h-48',
      titleSize: 'text-lg font-bold',
      typeSize: 'text-sm',
      bodySize: 'text-sm leading-relaxed',
      ptSize: 'text-base px-3 py-1 font-bold',
    },
  }[size];

  return (
    <div
      onClick={onClick}
      className={`relative group rounded-xl bg-neutral-900 border-2 border-neutral-700 text-neutral-900 shadow-xl select-none flex flex-col justify-between transition-all duration-150 ${sizeConfig.container}`}
      style={{
        background: 'linear-gradient(145deg, #1f242e 0%, #151821 100%)',
        boxShadow: '0 8px 24px -4px rgba(0,0,0,0.7)',
      }}
    >
      <div className="flex flex-col flex-grow rounded-lg bg-[#faf8f2] border-2 border-[#333] p-2.5 overflow-hidden shadow-inner">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#eeebe2] border border-[#bbb] rounded px-2 py-1 mb-2 shadow-2xs">
          <span className={`font-serif tracking-tight text-neutral-900 ${sizeConfig.titleSize}`} title={name}>
            {name}
          </span>
          {manaCost && <ManaSymbols cost={manaCost} />}
        </div>

        {/* Art Window */}
        <div className={`relative w-full ${sizeConfig.artHeight} bg-[#e2dec9] rounded border border-[#999] overflow-hidden mb-2 flex items-center justify-center`}>
          {!imageError ? (
            <img
              src={`/cards/${artFile}`}
              alt={name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-2 text-center text-neutral-600 bg-amber-50/50 w-full h-full">
              <span className="text-xl">🎨</span>
              <span className="text-xs font-mono font-semibold text-neutral-700">MS Paint Canvas</span>
              <span className="text-[10px] text-neutral-500 font-mono">/public/cards/{artFile}</span>
            </div>
          )}
        </div>

        {/* Type Line */}
        <div className="flex items-center justify-between bg-[#eeebe2] border border-[#bbb] rounded px-2 py-0.5 mb-2">
          <span className={`font-serif font-semibold text-neutral-800 ${sizeConfig.typeSize}`}>
            {typeLine}
          </span>
        </div>

        {/* Rules Text Box */}
        <div className="flex-grow flex flex-col justify-between bg-[#fbf9f4] border border-[#ccc] rounded p-2 overflow-y-auto">
          <div className={`font-sans text-neutral-900 whitespace-pre-line font-medium ${sizeConfig.bodySize}`}>
            {renderedText}
          </div>

          {flavorText && (
            <div className="mt-2 pt-1 border-t border-neutral-300 font-serif italic text-neutral-600 text-xs leading-snug">
              {flavorText}
            </div>
          )}
        </div>

        {/* P/T Badge */}
        {isCreature && (
          <div className="flex justify-end mt-1.5">
            <div className={`rounded-md bg-[#e4e0d2] border-2 border-[#555] font-serif font-bold text-neutral-900 shadow-sm ${sizeConfig.ptSize}`}>
              {power} / {toughness}
            </div>
          </div>
        )}

        {/* Artist credit */}
        <div className="flex items-center justify-between text-[9px] font-mono text-neutral-500 mt-1 px-0.5">
          <span>Illus. James (MS Paint)</span>
          <span>© Mowu MTG</span>
        </div>
      </div>
    </div>
  );
};
