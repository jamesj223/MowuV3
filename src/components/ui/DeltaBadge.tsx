import React from 'react';

/** Floating running total of recent life changes (e.g. "-22"), fading out after a pause. */
export const DeltaBadge: React.FC<{ delta: number; visible: boolean; className?: string }> = ({
  delta,
  visible,
  className = '',
}) => (
  <span
    aria-live="polite"
    className={`rounded-full border px-1.5 py-0.5 font-mono text-[10px] font-bold shadow-md transition-all duration-300 ${
      visible && delta !== 0 ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
    } ${
      delta < 0
        ? 'border-rose-500/50 bg-rose-500/20 text-rose-400'
        : 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
    } ${className}`}
  >
    {delta > 0 ? `+${delta}` : delta}
  </span>
);
