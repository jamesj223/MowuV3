import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { HoldButton } from '@/components/ui/HoldButton';
import { Shield, Biohazard, Crown } from 'lucide-react';

export const DamageTracker: React.FC = () => {
  const {
    opponentHealth,
    startingOpponentHealth,
    totalDamageDealt,
    accumulatedDelta,
    isDeltaVisible,
    applyDamageToOpponent,
    applyOpponentHealthChange,
    opponentPoison,
    opponentCommanderDamage,
    adjustOpponentPoison,
    adjustOpponentCommanderDamage,
    trackOpponentPoison,
    trackOpponentCommanderDamage,
    toggleTrackOpponentPoison,
    toggleTrackOpponentCommanderDamage,
    isGameOver,
  } = useGameStore();

  const healthPercent = Math.max(
    0,
    Math.min(100, Math.round((opponentHealth / startingOpponentHealth) * 100))
  );

  return (
    <div className="flex flex-col bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm gap-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-wide text-neutral-300 uppercase">
              Opponent Life
            </h2>
            <p className="text-[10px] text-neutral-500">
              Total Dmg: <span className="font-mono text-neutral-400">{totalDamageDealt}</span>
            </p>
          </div>
        </div>

        {/* Debounced Floating Delta Indicator */}
        <div
          className={`transition-all duration-300 font-mono font-bold text-base px-2.5 py-0.5 rounded-full border shadow-md ${
            isDeltaVisible && accumulatedDelta !== 0
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-90 pointer-events-none'
          } ${
            accumulatedDelta < 0
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
          }`}
        >
          {accumulatedDelta > 0 ? `+${accumulatedDelta}` : accumulatedDelta}
        </div>
      </div>

      {/* Compact Primary Life Readout */}
      <div className="py-2 flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline justify-center gap-2">
          <span
            className={`text-5xl font-black font-mono tracking-tight drop-shadow-md transition-colors ${
              opponentHealth === 0
                ? 'text-emerald-400 animate-pulse'
                : opponentHealth <= 20
                ? 'text-amber-400'
                : 'text-white'
            }`}
          >
            {opponentHealth}
          </span>
          <span className="text-base font-mono text-neutral-500">
            / {startingOpponentHealth}
          </span>
        </div>

        {/* Health Progress Line */}
        <div className="w-full mt-2 bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
          <div
            className={`h-full transition-all duration-200 rounded-full ${
              healthPercent <= 20
                ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                : healthPercent <= 50
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${healthPercent}%` }}
          />
        </div>
      </div>

      {/* Streamlined Controls: Clean -1 and +1 with Hold-to-repeat / Long press for 10 */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <HoldButton
          onClickStep={() => applyDamageToOpponent(1)}
          onHoldStep={() => applyDamageToOpponent(10)}
          disabled={isGameOver}
          className="py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 disabled:opacity-30 text-rose-300 font-mono font-bold text-sm border border-rose-800/50 hover:border-rose-500 flex flex-col items-center justify-center"
          title="Click: -1 damage • Hold: -10 damage"
        >
          <span className="text-sm font-extrabold">-1 Damage</span>
          <span className="text-[9px] text-rose-400/60 font-sans font-normal">(Hold for -10)</span>
        </HoldButton>

        <HoldButton
          onClickStep={() => applyOpponentHealthChange(1)}
          onHoldStep={() => applyOpponentHealthChange(10)}
          className="py-2.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-emerald-300 font-mono font-bold text-sm border border-neutral-700 hover:border-emerald-500/50 flex flex-col items-center justify-center"
          title="Click: +1 life • Hold: +10 life"
        >
          <span className="text-sm font-extrabold">+1 Heal</span>
          <span className="text-[9px] text-emerald-400/60 font-sans font-normal">(Hold for +10)</span>
        </HoldButton>
      </div>

      {/* Alt-Win Toggles */}
      <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px]">
        <button
          onClick={toggleTrackOpponentPoison}
          className={`px-2 py-0.5 rounded font-medium border cursor-pointer transition-colors flex items-center gap-1 ${
            trackOpponentPoison
              ? 'bg-lime-500/20 text-lime-400 border-lime-500/40'
              : 'bg-neutral-850 text-neutral-500 border-neutral-800 hover:text-neutral-300'
          }`}
        >
          <Biohazard className="w-3 h-3" />
          <span>Infect</span>
        </button>

        <button
          onClick={toggleTrackOpponentCommanderDamage}
          className={`px-2 py-0.5 rounded font-medium border cursor-pointer transition-colors flex items-center gap-1 ${
            trackOpponentCommanderDamage
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'bg-neutral-850 text-neutral-500 border-neutral-800 hover:text-neutral-300'
          }`}
        >
          <Crown className="w-3 h-3" />
          <span>Cmdr</span>
        </button>
      </div>

      {/* 3 Opponents Poison Track (If Toggled On) */}
      {trackOpponentPoison && (
        <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-lime-900/40 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-lime-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Biohazard className="w-3 h-3" />
              <span>Opponent Poison Track (10 to kill)</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center">
            {([0, 1, 2] as const).map((idx) => {
              const val = opponentPoison[idx];
              const isDead = val >= 10;
              return (
                <div
                  key={idx}
                  className={`p-1.5 rounded-lg border flex flex-col items-center justify-between ${
                    isDead
                      ? 'bg-rose-950/40 border-rose-800 text-rose-400'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <span className="text-[9px] font-mono text-neutral-500">Opp {idx + 1}</span>
                  <span className={`text-base font-extrabold font-mono my-0.5 ${isDead ? 'text-rose-400' : 'text-lime-300'}`}>
                    {val}/10
                  </span>
                  <div className="flex gap-1 w-full">
                    <button
                      onClick={() => adjustOpponentPoison(idx, -1)}
                      disabled={val === 0}
                      className="flex-1 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-20 text-[10px] font-mono font-bold"
                    >
                      -
                    </button>
                    <button
                      onClick={() => adjustOpponentPoison(idx, 1)}
                      disabled={isDead}
                      className="flex-1 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-20 text-[10px] font-mono font-bold text-lime-400"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3 Opponents Commander Damage Track (If Toggled On) */}
      {trackOpponentCommanderDamage && (
        <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-amber-900/40 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Crown className="w-3 h-3" />
              <span>Commander Damage Pod (21 to kill)</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center">
            {([0, 1, 2] as const).map((idx) => {
              const val = opponentCommanderDamage[idx];
              const isDead = val >= 21;
              return (
                <div
                  key={idx}
                  className={`p-1.5 rounded-lg border flex flex-col items-center justify-between ${
                    isDead
                      ? 'bg-rose-950/40 border-rose-800 text-rose-400'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <span className="text-[9px] font-mono text-neutral-500">Opp {idx + 1}</span>
                  <span className={`text-base font-extrabold font-mono my-0.5 ${isDead ? 'text-rose-400' : 'text-amber-300'}`}>
                    {val}/21
                  </span>
                  <div className="flex gap-1 w-full">
                    <button
                      onClick={() => adjustOpponentCommanderDamage(idx, -1)}
                      disabled={val === 0}
                      className="flex-1 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-20 text-[10px] font-mono font-bold"
                    >
                      -
                    </button>
                    <button
                      onClick={() => adjustOpponentCommanderDamage(idx, 1)}
                      disabled={isDead}
                      className="flex-1 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-20 text-[10px] font-mono font-bold text-amber-400"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
