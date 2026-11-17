import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { COMMANDER_BRACKETS } from '@/types/game';
import { ACTS_EVERY_TURN } from '@/data/tuning';
import { COMMANDER_TAX, getCommanderCost, getManaBudget } from '@/logic/opponent';
import { getCommanderCard } from '@/data/commanderCards';
import { Play, Sparkles, Clock, Undo2, User, Swords } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

export const TurnCounter: React.FC = () => {
  const {
    turn,
    turnPhase,
    nextTurn,
    prevTurn,
    triggerEvent,
    bracket,
    customEventFrequency,
    isGameOver,
    opponentCommander,
    commanderTimesCast,
    commanderInPlay,
  } = useGameStore(
    useShallow((s) => ({
      turn: s.turn,
      turnPhase: s.turnPhase,
      nextTurn: s.nextTurn,
      prevTurn: s.prevTurn,
      triggerEvent: s.triggerEvent,
      bracket: s.bracket,
      customEventFrequency: s.customEventFrequency,
      isGameOver: s.isGameOver,
      opponentCommander: s.opponentCommander,
      commanderTimesCast: s.commanderTimesCast,
      commanderInPlay: s.activePermanents.some((p) => p.isCommander),
    })),
  );

  const bracketConfig = COMMANDER_BRACKETS[bracket];
  const freq = bracket === 'custom' ? customEventFrequency : bracketConfig.eventFrequency;
  const turnsUntilEvent = freq > 0 ? freq - (turn % freq) : null;
  const actsEveryTurn = ACTS_EVERY_TURN[bracket];
  const commanderCard = getCommanderCard(opponentCommander?.id);
  const isOpponentPhase = turnPhase === 'opponent';

  return (
    <div className="flex flex-col bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm gap-2">
      {/* Header with Bracket Badge */}
      <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-wide text-neutral-300 uppercase">
              Turn & Tempo
            </h2>
            <p className="text-[10px] text-neutral-500">
              Expected game: <span className="text-neutral-300 font-mono">{bracketConfig.targetTurns}</span>
            </p>
          </div>
        </div>

        <span
          className={`text-[11px] px-2 py-0.5 rounded-full font-bold border font-mono ${bracketConfig.badgeColor}`}
          title={bracketConfig.description}
        >
          {bracketConfig.tag}
        </span>
      </div>

      {/* Commander Display (if assigned) */}
      {opponentCommander && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-neutral-950/60 border border-neutral-800">
          <span className="text-lg">{opponentCommander.avatar}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-neutral-200 truncate">
              vs. {opponentCommander.name}
            </p>
            <p className="text-[9px] text-neutral-500 font-mono truncate">
              {opponentCommander.archetype}
            </p>
            {commanderCard && (
              <p className="text-[9px] font-mono truncate mt-0.5" title="Commander tax: {2} more for each previous cast">
                {commanderInPlay ? (
                  <span className="text-amber-400">On the battlefield</span>
                ) : (
                  <span className="text-neutral-400">
                    Command zone • costs {getCommanderCost(commanderCard, commanderTimesCast)}
                    {commanderTimesCast > 0 && ` (tax +${commanderTimesCast * COMMANDER_TAX})`}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Primary Turn Readout */}
      <div className="py-2 flex items-center justify-between bg-neutral-950/60 rounded-xl px-3 py-2 border border-neutral-800">
        <div className="flex items-center gap-2">
          <button
            onClick={prevTurn}
            disabled={turn <= 1 || isOpponentPhase}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-20 text-neutral-400 hover:text-white border border-neutral-700 cursor-pointer transition-all"
            title="Step back 1 turn"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <div className="flex flex-col">
            <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500">
              Turn
            </span>
            <span className="text-3xl font-black font-mono text-white leading-none">
              {turn}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {/* Phase Indicator */}
          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isOpponentPhase
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
          }`}>
            {isOpponentPhase ? (
              <>
                <Swords className="w-3 h-3" />
                <span>Opp</span>
              </>
            ) : (
              <>
                <User className="w-3 h-3" />
                <span>You</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {actsEveryTurn ? (
              <span
                className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-1 rounded border border-neutral-800"
                title="Mowu casts at least one card every turn in this bracket, spending up to this much mana"
              >
                Mowu: {getManaBudget(turn, bracket)} mana
              </span>
            ) : freq > 0 && (
              <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                {turnsUntilEvent === freq ? (
                  <span className="text-amber-400 font-bold">Event now!</span>
                ) : (
                  <span>Next: T{turn + (turnsUntilEvent ?? 0)}</span>
                )}
              </span>
            )}

            <button
              onClick={() => triggerEvent()}
              disabled={isOpponentPhase}
              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-pointer transition-all disabled:opacity-30"
              title="Draw manual event card (E)"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Big Action Button: Next Turn */}
      <button
        onClick={nextTurn}
        disabled={isGameOver || isOpponentPhase}
        className="btn-press w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-sky-950/40 border border-sky-400/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        <span>End Your Turn (Space / Enter)</span>
      </button>
    </div>
  );
};
