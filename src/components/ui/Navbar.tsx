import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { COMMANDER_BRACKETS } from '@/types/game';
import {
  RotateCcw,
  PlusCircle,
  BarChart3,
  HelpCircle,
  Layers,
} from 'lucide-react';

interface NavbarProps {
  onOpenNewGame: () => void;
  onOpenStats: () => void;
  onOpenHelp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewGame,
  onOpenStats,
  onOpenHelp,
}) => {
  const {
    currentDeckName,
    turn,
    opponentHealth,
    startingOpponentHealth,
    bracket,
    resetGame,
  } = useGameStore();

  const bracketConfig = COMMANDER_BRACKETS[bracket];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500 bg-clip-text text-transparent">
              MOWU
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-widest font-bold">
              v3.0
            </span>
          </div>

          {/* Active Deck Pill */}
          <button
            onClick={onOpenNewGame}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-700/80 text-xs font-medium cursor-pointer transition-colors max-w-[220px]"
            title="Click to change deck or settings"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{currentDeckName || 'Select Deck'}</span>
          </button>
        </div>

        {/* Live HUD Snippet */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 shadow-inner">
            <span>
              Turn: <strong className="text-white font-bold">{turn}</strong>
            </span>
            <span>•</span>
            <span>
              Opponent Life:{' '}
              <strong className="text-rose-400 font-bold">{opponentHealth}</strong>/
              {startingOpponentHealth}
            </span>
            <span>•</span>
            <span className="font-bold text-sky-400">{bracketConfig.tag}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => resetGame()}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/80 cursor-pointer transition-colors"
            title="Quick Restart (Ctrl+Q)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenStats}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/80 cursor-pointer transition-colors"
            title="Analytics & Match History (B)"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenHelp}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/80 cursor-pointer transition-colors"
            title="Keyboard Shortcuts & Help (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenNewGame}
            className="btn-press px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/40 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Game</span>
          </button>
        </div>
      </div>
    </header>
  );
};
