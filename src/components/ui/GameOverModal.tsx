import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useDeckStore } from '@/store/useDeckStore';
import { COMMANDER_BRACKETS } from '@/types/game';
import { Trophy, RotateCcw, Play, CheckCircle2, Biohazard, Crown } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  onNewGame: () => void;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ isOpen, onNewGame, onRestart }) => {
  const {
    turn,
    opponentHealth,
    startingOpponentHealth,
    totalDamageDealt,
    currentDeckName,
    bracket,
    winReason,
    eventHistory,
    activePermanents,
  } = useGameStore();

  const { recordMatch } = useDeckStore();
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const totalEvents = eventHistory.length + activePermanents.length;
  const bracketConfig = COMMANDER_BRACKETS[bracket];

  const handleSave = () => {
    if (saved) return;
    recordMatch({
      deckName: currentDeckName || 'Unnamed Deck',
      turns: turn,
      startingHealth: startingOpponentHealth,
      finalHealth: opponentHealth,
      damageDealt: totalDamageDealt,
      bracket,
      winReason: winReason || 'life',
      eventCount: totalEvents,
      won: true,
    });
    setSaved(true);
  };

  const getVictoryTitle = () => {
    if (winReason === 'poison') return 'Infect Victory!';
    if (winReason === 'commander_damage') return 'Voltron Victory!';
    return 'Defenses Crushed!';
  };

  const getVictorySubtitle = () => {
    if (winReason === 'poison') {
      return `All 3 opponents eliminated with 10 poison counters in ${turn} turns!`;
    }
    if (winReason === 'commander_damage') {
      return `All 3 opponents defeated with 21 commander damage in ${turn} turns!`;
    }
    return `You eliminated opponent life in ${turn} turns at ${bracketConfig.tag}!`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-md bg-neutral-900 border-2 border-amber-500/50 rounded-2xl p-6 shadow-2xl text-center items-center">
        {/* Victory Icon */}
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-400 flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(245,158,11,0.4)] animate-bounce">
          {winReason === 'poison' ? (
            <Biohazard className="w-8 h-8 text-lime-400" />
          ) : winReason === 'commander_damage' ? (
            <Crown className="w-8 h-8 text-amber-400" />
          ) : (
            <Trophy className="w-8 h-8" />
          )}
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight">{getVictoryTitle()}</h2>
        <p className="text-sm text-neutral-400 mt-1">{getVictorySubtitle()}</p>

        {/* Stats Summary Box */}
        <div className="w-full grid grid-cols-3 gap-2 my-5 p-3 rounded-xl bg-neutral-950/70 border border-neutral-800">
          <div>
            <span className="text-[10px] uppercase font-mono text-neutral-500">Turns</span>
            <p className="text-2xl font-extrabold font-mono text-emerald-400">{turn}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-neutral-500">Damage</span>
            <p className="text-2xl font-extrabold font-mono text-amber-400">{totalDamageDealt}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-neutral-500">Events Survived</span>
            <p className="text-2xl font-extrabold font-mono text-sky-400">{totalEvents}</p>
          </div>
        </div>

        {/* Save Match Button */}
        <button
          onClick={handleSave}
          disabled={saved}
          className={`w-full py-2.5 rounded-xl font-medium text-xs mb-4 flex items-center justify-center gap-2 border transition-all ${
            saved
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700 cursor-pointer'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{saved ? 'Recorded to Match History' : 'Save Run to History'}</span>
        </button>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={onRestart}
            className="btn-press py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm border border-neutral-700 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart</span>
          </button>
          <button
            onClick={onNewGame}
            className="btn-press py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm border border-amber-400 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-950/40"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>New Game</span>
          </button>
        </div>
      </div>
    </div>
  );
};
