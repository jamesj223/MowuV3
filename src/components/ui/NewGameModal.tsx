import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useDeckStore } from '@/store/useDeckStore';
import type { CommanderBracket } from '@/types/game';
import { COMMANDER_BRACKETS } from '@/types/game';
import { X, Play, Settings } from 'lucide-react';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({ isOpen, onClose }) => {
  const {
    startingOpponentHealth,
    startingPlayerLife,
    bracket,
    customEventFrequency,
    trackPlayer,
    currentDeckName,
    startNewGame,
  } = useGameStore();

  const { decks, addDeck } = useDeckStore();

  const [deckName, setDeckName] = useState(currentDeckName || '');
  const [oppHealth, setOppHealth] = useState(startingOpponentHealth);
  const [playerLife, setPlayerLife] = useState(startingPlayerLife);
  const [selectedBracket, setSelectedBracket] = useState<CommanderBracket>(bracket);
  const [customFreq, setCustomFreq] = useState(customEventFrequency || 4);
  const [enablePlayerTrack, setEnablePlayerTrack] = useState(trackPlayer);

  if (!isOpen) return null;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDeckName = deckName.trim() || 'Untitled Deck';

    if (!decks.some((d) => d.name.toLowerCase() === finalDeckName.toLowerCase())) {
      addDeck({ name: finalDeckName, bracket: selectedBracket });
    }

    startNewGame({
      deckName: finalDeckName,
      startingOpponentHealth: oppHealth,
      startingPlayerLife: playerLife,
      bracket: selectedBracket,
      customEventFrequency: customFreq,
      trackPlayer: enablePlayerTrack,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Start New Game</h2>
              <p className="text-xs text-neutral-400">Configure parameters for your goldfish run</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleStart} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Deck Selection / Input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Deck Name
            </label>
            <input
              type="text"
              list="deckList"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Select existing deck or enter new name"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
            <datalist id="deckList">
              {decks.map((d) => (
                <option key={d.id} value={d.name} />
              ))}
            </datalist>
          </div>

          {/* Commander Bracket Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Commander Bracket System</span>
              <span className="text-amber-400 font-mono text-[11px] font-normal">
                {COMMANDER_BRACKETS[selectedBracket].targetTurns}
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              {(['b1', 'b2', 'b3', 'b4'] as CommanderBracket[]).map((b) => {
                const conf = COMMANDER_BRACKETS[b];
                const isSelected = selectedBracket === b;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBracket(b)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-neutral-850 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                        : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                        {conf.tag}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">
                        {conf.targetTurns}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1 line-clamp-2">
                      {conf.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Off / Custom Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setSelectedBracket('off')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  selectedBracket === 'off'
                    ? 'bg-neutral-800 text-white border-amber-400'
                    : 'bg-neutral-950/40 text-neutral-500 border-neutral-800 hover:text-neutral-300'
                }`}
              >
                Solitaire (Events Off)
              </button>
              <button
                type="button"
                onClick={() => setSelectedBracket('custom')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  selectedBracket === 'custom'
                    ? 'bg-neutral-800 text-white border-amber-400'
                    : 'bg-neutral-950/40 text-neutral-500 border-neutral-800 hover:text-neutral-300'
                }`}
              >
                Custom Frequency
              </button>
            </div>

            {selectedBracket === 'custom' && (
              <div className="mt-2.5 flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-xs text-neutral-400">Trigger event every:</span>
                <input
                  type="number"
                  min={1}
                  value={customFreq}
                  onChange={(e) => setCustomFreq(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-white font-mono text-xs text-center"
                />
                <span className="text-xs text-neutral-400">turns</span>
              </div>
            )}
          </div>

          {/* Opponent Starting Health & Player Life */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Opponent Life
              </label>
              <input
                type="number"
                min={1}
                value={oppHealth}
                onChange={(e) => setOppHealth(Math.max(1, parseInt(e.target.value) || 120))}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
              />
              <div className="flex gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setOppHealth(120)}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono border cursor-pointer ${
                    oppHealth === 120
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  120 (Pod)
                </button>
                <button
                  type="button"
                  onClick={() => setOppHealth(40)}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono border cursor-pointer ${
                    oppHealth === 40
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  40 (1v1)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Player Life
              </label>
              <input
                type="number"
                min={1}
                value={playerLife}
                onChange={(e) => setPlayerLife(Math.max(1, parseInt(e.target.value) || 40))}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
              />
              <div className="flex gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setPlayerLife(40)}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono border cursor-pointer ${
                    playerLife === 40
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  40 Life
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerLife(20)}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono border cursor-pointer ${
                    playerLife === 20
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  20 Life
                </button>
              </div>
            </div>
          </div>

          {/* Player Tracking Toggle */}
          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-neutral-300 block">
                Track Player Status
              </span>
              <span className="text-[11px] text-neutral-500 block">
                Show player life, poison counters, and commander damage
              </span>
            </div>
            <input
              type="checkbox"
              checked={enablePlayerTrack}
              onChange={(e) => setEnablePlayerTrack(e.target.checked)}
              className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="btn-press w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm shadow-lg shadow-amber-950/40 border border-amber-400/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Goldfish Game</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
