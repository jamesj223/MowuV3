import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { HoldButton } from '@/components/ui/HoldButton';
import { Heart, Biohazard, Crown } from 'lucide-react';

export const PlayerTracker: React.FC = () => {
  const {
    playerLife,
    poisonCounters,
    commanderDamage,
    adjustPlayerLife,
    adjustPoison,
    adjustCommanderDamage,
    trackPlayer,
    trackPlayerPoison,
    trackPlayerCommanderDamage,
    toggleTrackPlayerPoison,
    toggleTrackPlayerCommanderDamage,
  } = useGameStore();

  if (!trackPlayer) return null;

  return (
    <div className="flex flex-col bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm gap-2">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
            Player Status
          </span>
        </div>

        {/* Small toggles for alt player counters */}
        <div className="flex items-center gap-1 text-[10px]">
          <button
            onClick={toggleTrackPlayerPoison}
            className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer flex items-center gap-1 ${
              trackPlayerPoison
                ? 'bg-lime-500/20 text-lime-400 border-lime-500/40'
                : 'text-neutral-500 border-transparent hover:text-neutral-300'
            }`}
            title="Toggle player poison counter"
          >
            <Biohazard className="w-3 h-3" />
            Poison
          </button>
          <button
            onClick={toggleTrackPlayerCommanderDamage}
            className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer flex items-center gap-1 ${
              trackPlayerCommanderDamage
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'text-neutral-500 border-transparent hover:text-neutral-300'
            }`}
            title="Toggle commander damage taken"
          >
            <Crown className="w-3 h-3" />
            Cmdr
          </button>
        </div>
      </div>

      {/* Main Life Row */}
      <div className="flex items-center justify-between bg-neutral-950/60 rounded-xl p-2.5 border border-neutral-800">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-emerald-400 fill-current" />
          <span className="text-xs font-semibold text-neutral-300">Life Total</span>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className={`text-2xl font-black font-mono ${
              playerLife <= 10 ? 'text-rose-400 animate-pulse' : 'text-white'
            }`}
          >
            {playerLife}
          </span>

          <div className="flex items-center gap-1">
            <HoldButton
              onClickStep={() => adjustPlayerLife(-1)}
              onHoldStep={() => adjustPlayerLife(-10)}
              className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-mono font-bold text-white flex items-center justify-center"
              title="Click: -1 life • Hold: -10"
            >
              -
            </HoldButton>
            <HoldButton
              onClickStep={() => adjustPlayerLife(1)}
              onHoldStep={() => adjustPlayerLife(10)}
              className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-mono font-bold text-white flex items-center justify-center"
              title="Click: +1 life • Hold: +10"
            >
              +
            </HoldButton>
          </div>
        </div>
      </div>

      {/* Optional Player Poison Track */}
      {trackPlayerPoison && (
        <div className="flex items-center justify-between bg-neutral-950/60 rounded-xl px-2.5 py-1.5 border border-lime-900/40">
          <div className="flex items-center gap-1.5 text-xs text-lime-400 font-medium">
            <Biohazard className="w-3.5 h-3.5" />
            <span>Poison Counters</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-base font-bold font-mono ${poisonCounters >= 10 ? 'text-rose-400' : 'text-lime-300'}`}>
              {poisonCounters}/10
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => adjustPoison(-1)}
                disabled={poisonCounters === 0}
                className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-20 text-xs font-mono font-bold"
              >
                -
              </button>
              <button
                onClick={() => adjustPoison(1)}
                disabled={poisonCounters >= 10}
                className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-20 text-xs font-mono font-bold text-lime-400"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Optional Player Commander Damage Track */}
      {trackPlayerCommanderDamage && (
        <div className="flex items-center justify-between bg-neutral-950/60 rounded-xl px-2.5 py-1.5 border border-amber-900/40">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
            <Crown className="w-3.5 h-3.5" />
            <span>Commander Damage Taken</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-base font-bold font-mono ${commanderDamage >= 21 ? 'text-rose-400' : 'text-amber-300'}`}>
              {commanderDamage}/21
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => adjustCommanderDamage(-1)}
                disabled={commanderDamage === 0}
                className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-20 text-xs font-mono font-bold"
              >
                -
              </button>
              <button
                onClick={() => adjustCommanderDamage(1)}
                disabled={commanderDamage >= 21}
                className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-20 text-xs font-mono font-bold text-amber-400"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
