import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { PlaytestCard } from '@/components/cards/PlaytestCard';
import { canAutoContinue, getComboStatus, totalAttackPower as sumAttackPower } from '@/logic/game';
import { HoldButton } from '@/components/ui/HoldButton';
import { DeltaBadge } from '@/components/ui/DeltaBadge';
import { IDLE_AUTO_SKIP_MS, useIdleAutoSkip } from '@/hooks/useIdleAutoSkip';
import { Swords, Sparkles, Coffee, ChevronRight, Skull, Heart, Biohazard, Crown } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

export const OpponentTurnModal: React.FC = () => {
  const {
    opponentTurnState,
    opponentCommander,
    turn,
    advanceOpponentPhase,
    endOpponentTurn,
    counterCurrentCard,
    currentDrawnCard,
    activePermanents,
    bracket,
    playerLife,
    poisonCounters,
    commanderDamage,
    adjustPlayerLife,
    adjustPoison,
    adjustCommanderDamage,
    playerAccumulatedDelta,
    isPlayerDeltaVisible,
  } = useGameStore(
    useShallow((s) => ({
      opponentTurnState: s.opponentTurnState,
      opponentCommander: s.opponentCommander,
      turn: s.turn,
      advanceOpponentPhase: s.advanceOpponentPhase,
      endOpponentTurn: s.endOpponentTurn,
      counterCurrentCard: s.counterCurrentCard,
      currentDrawnCard: s.currentDrawnCard,
      activePermanents: s.activePermanents,
      bracket: s.bracket,
      playerLife: s.playerLife,
      poisonCounters: s.poisonCounters,
      commanderDamage: s.commanderDamage,
      adjustPlayerLife: s.adjustPlayerLife,
      adjustPoison: s.adjustPoison,
      adjustCommanderDamage: s.adjustCommanderDamage,
      playerAccumulatedDelta: s.playerAccumulatedDelta,
      isPlayerDeltaVisible: s.isPlayerDeltaVisible,
    })),
  );

  const [isPaused, setIsPaused] = useState(false);
  const combo = getComboStatus(activePermanents, bracket);
  const comboAlert = combo.oneAway || combo.assembled;
  const autoContinue = opponentTurnState
    ? canAutoContinue(opponentTurnState.phase, opponentTurnState.attackers.length, comboAlert)
    : false;

  // Auto-continue after 5s when there's nothing to do (idle turn, or no-combat turn summary).
  // Hooks must run before the early return below.
  const remainingMs = useIdleAutoSkip(autoContinue, isPaused, () => {
    const s = useGameStore.getState();
    const t = s.opponentTurnState;
    if (t && canAutoContinue(t.phase, t.attackers.length, comboAlert)) s.endOpponentTurn();
  });
  const timeLeft = remainingMs / 1000;

  // The pointer can't "leave" a button that unmounted, so un-pause when the countdown stops
  if (!autoContinue && isPaused) setIsPaused(false);

  if (!opponentTurnState) return null;

  const { phase, attackers, idleText, casts, plannedCardIds, manaBudget } = opponentTurnState;
  const upkeepLog = opponentTurnState.upkeepLog ?? [];
  const currentCast = currentDrawnCard ? casts.find((c) => c.instanceId === currentDrawnCard.instanceId) : undefined;
  const castNumber = casts.length;
  const castsPlanned = plannedCardIds.length;
  const moreCardsComing = phase === 'event' && castNumber < castsPlanned;
  const commander = opponentCommander;
  const accentColor = commander?.accentColor ?? 'amber';

  // Color utility map for dynamic accent coloring
  const colorMap: Record<string, { bg: string; border: string; text: string; glow: string; badge: string }> = {
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', glow: 'shadow-amber-500/20', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    lime: { bg: 'bg-lime-500/10', border: 'border-lime-500/30', text: 'text-lime-400', glow: 'shadow-lime-500/20', badge: 'bg-lime-500/20 text-lime-300 border-lime-500/40' },
    sky: { bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-400', glow: 'shadow-sky-500/20', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', glow: 'shadow-blue-500/20', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', glow: 'shadow-rose-500/20', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', glow: 'shadow-purple-500/20', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  };

  const colors = colorMap[accentColor] || colorMap.amber;

  const handleContinue = () => {
    if (phase === 'idle' || phase === 'complete') {
      endOpponentTurn();
    } else {
      advanceOpponentPhase();
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case 'event': return castsPlanned > 1 ? `Main Phase — Spell ${castNumber} of ${castsPlanned}` : 'Main Phase — Casting Spell';
      case 'combat': return 'Combat Phase — Declaring Attackers';
      case 'idle': return 'Passing the Turn';
      case 'complete': return 'Turn Complete';
    }
  };

  const getButtonText = () => {
    if (phase === 'event') {
      return moreCardsComing ? 'Next Card (Space / Enter)' : 'Continue (Space / Enter)';
    }
    if (phase === 'combat') return 'End Opponent Turn (Space / Enter)';
    if (autoContinue) {
      return isPaused
        ? 'Paused — Continue to Your Turn (Space / Enter)'
        : `Your turn in ${Math.ceil(timeLeft)}s... (Space / Enter)`;
    }
    return 'Continue to Your Turn (Space / Enter)';
  };

  const totalAttackPower = sumAttackPower(attackers);
  const attackerCount = attackers.reduce((sum, a) => sum + a.count, 0);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`relative flex flex-col w-full max-w-lg max-h-[90vh] bg-neutral-900 border ${colors.border} rounded-2xl shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Commander Banner */}
        <div className={`flex items-center justify-between p-4 border-b border-neutral-800 shrink-0 ${colors.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center text-2xl shadow-lg ${colors.glow}`}>
              {commander?.avatar ?? '👤'}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {commander?.name ?? "Opponent's Turn"}
              </h2>
              {commander && (
                <p className={`text-xs ${colors.text} font-medium`}>
                  {commander.title} • {commander.archetype}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-mono text-neutral-400">
              Turn {turn}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold font-mono ${colors.badge}`}>
              Opponent Phase
            </span>
          </div>
        </div>

        {/* Phase Content (Scrollable if card is large) */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto flex flex-col justify-center">
          {/* Phase Label */}
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
            {phase === 'event' && <Sparkles className={`w-4 h-4 ${colors.text}`} />}
            {phase === 'combat' && <Swords className={`w-4 h-4 ${colors.text}`} />}
            {(phase === 'idle' || phase === 'complete') && <Coffee className={`w-4 h-4 ${colors.text}`} />}
            <span>{getPhaseLabel()}</span>
          </div>

          {/* Event Phase Content */}
          {phase === 'event' && (
            <div className="flex flex-col items-center gap-3">
              <div className={`w-full p-2.5 rounded-xl ${colors.bg} border ${colors.border} text-center`}>
                <p className="text-xs font-semibold text-neutral-200">
                  {commander?.name ?? 'Opponent'} casts a spell!
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">
                  {manaBudget} mana this turn
                </p>
              </div>

              {currentDrawnCard && (
                <div className="flex justify-center scale-95 transition-transform">
                  <PlaytestCard
                    name={currentDrawnCard.name}
                    manaCost={'manaCost' in currentDrawnCard ? currentDrawnCard.manaCost : ''}
                    typeLine={currentDrawnCard.typeLine}
                    artFile={currentDrawnCard.artFile}
                    renderedText={currentDrawnCard.renderedText}
                    flavorText={'flavorText' in currentDrawnCard ? currentDrawnCard.flavorText : undefined}
                    power={'power' in currentDrawnCard ? currentDrawnCard.power : undefined}
                    toughness={'toughness' in currentDrawnCard ? currentDrawnCard.toughness : undefined}
                    variant="detailed"
                    size="sm"
                  />
                </div>
              )}

              {/* What the card did automatically */}
              {currentCast?.effectLog && currentCast.effectLog.length > 0 && (
                <ul className="w-full text-xs text-neutral-300 space-y-0.5">
                  {currentCast.effectLog.map((line) => (
                    <li key={line}>→ {line}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Start of turn: printed upkeep triggers on Mowu's permanents */}
          {upkeepLog.length > 0 && (
            <div className="rounded-xl bg-neutral-950/60 border border-neutral-800 p-2.5">
              <p className="text-[10px] uppercase font-mono text-neutral-500 mb-1">Upkeep</p>
              <ul className="space-y-0.5 text-xs text-neutral-300">
                {upkeepLog.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Turn log: everything Mowu cast this turn */}
          {casts.length > 0 && phase !== 'event' && (
            <div className="rounded-xl bg-neutral-950/60 border border-neutral-800 p-2.5">
              <p className="text-[10px] uppercase font-mono text-neutral-500 mb-1">Cast this turn</p>
              <ul className="space-y-0.5 text-xs">
                {casts.map((c) => (
                  <li key={c.instanceId} className={c.countered ? 'text-neutral-500 line-through' : 'text-neutral-300'}>
                    {c.name}
                    {c.countered && <span className="ml-1 no-underline text-[10px] text-sky-400">(countered)</span>}
                    {!c.countered && c.effectLog && c.effectLog.length > 0 && (
                      <span className="block pl-3 text-[11px] text-neutral-500">{c.effectLog.join(' ')}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Combat Phase Content */}
          {phase === 'combat' && attackers.length > 0 && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-rose-300 flex items-center gap-2">
                    <Swords className="w-4 h-4" />
                    {attackerCount} creature{attackerCount !== 1 ? 's' : ''} attacking!
                  </p>
                  <span className="text-xs font-mono text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                    {totalAttackPower} total power
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {attackers.map((attacker) => (
                    <div
                      key={attacker.instanceId}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                          <Skull className="w-4 h-4 text-rose-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">
                            {attacker.name}
                            {attacker.count > 1 && (
                              <span className="ml-1 font-mono text-rose-300">×{attacker.count}</span>
                            )}
                            {attacker.isCommander && (
                              <span
                                className="ml-1.5 text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                title="Unblocked damage from this creature is also commander damage"
                              >
                                Commander
                              </span>
                            )}
                          </p>
                          {attacker.keywords && (
                            <p className="text-[10px] text-neutral-400 font-mono">
                              {attacker.keywords}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold font-mono text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                          {attacker.power}/{attacker.toughness}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Your side of combat: apply what got through without leaving this screen */}
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
                <p className="text-[11px] text-neutral-400">
                  Block with your creatures (Mowu's tapped creatures can't block; only his creatures with "Blocks if
                  able" block). Then take the unblocked damage here. Hold a button for ±10.
                </p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                    <Heart className="w-3.5 h-3.5 text-emerald-400 fill-current" /> Your life
                  </span>
                  <span className="flex items-center gap-2">
                    <DeltaBadge delta={playerAccumulatedDelta} visible={isPlayerDeltaVisible} />
                    <span className="text-lg font-black font-mono text-white min-w-8 text-right">{playerLife}</span>
                    <HoldButton
                      onClickStep={() => adjustPlayerLife(-1)}
                      onHoldStep={() => adjustPlayerLife(-10)}
                      className="w-7 h-7 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-mono font-bold text-sm border border-rose-800/50 flex items-center justify-center"
                      title="Click: -1 • Hold: -10"
                    >
                      -
                    </HoldButton>
                    <HoldButton
                      onClickStep={() => adjustPlayerLife(1)}
                      onHoldStep={() => adjustPlayerLife(10)}
                      className="w-7 h-7 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 font-mono font-bold text-sm border border-emerald-800/50 flex items-center justify-center"
                      title="Click: +1 • Hold: +10"
                    >
                      +
                    </HoldButton>
                  </span>
                </div>
                {attackers.some((a) => /Toxic/.test(a.keywords)) && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                      <Biohazard className="w-3.5 h-3.5 text-lime-400" /> Your poison (Toxic)
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-lg font-black font-mono text-lime-300 min-w-8 text-right">{poisonCounters}</span>
                      <button type="button" onClick={() => adjustPoison(-1)} className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 font-mono font-bold text-sm">-</button>
                      <button type="button" onClick={() => adjustPoison(1)} className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 font-mono font-bold text-sm text-lime-400">+</button>
                    </span>
                  </div>
                )}
                {attackers.some((a) => a.isCommander) && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                      <Crown className="w-3.5 h-3.5 text-amber-400" /> Commander damage taken
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-lg font-black font-mono text-amber-300 min-w-8 text-right">{commanderDamage}</span>
                      <HoldButton
                        onClickStep={() => adjustCommanderDamage(-1)}
                        onHoldStep={() => adjustCommanderDamage(-10)}
                        className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 font-mono font-bold text-sm flex items-center justify-center"
                        title="Click: -1 • Hold: -10"
                      >
                        -
                      </HoldButton>
                      <HoldButton
                        onClickStep={() => adjustCommanderDamage(1)}
                        onHoldStep={() => adjustCommanderDamage(10)}
                        className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 font-mono font-bold text-sm text-amber-400 flex items-center justify-center"
                        title="Click: +1 • Hold: +10"
                      >
                        +
                      </HoldButton>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Idle Phase Content */}
          {phase === 'idle' && idleText && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <span className="text-4xl mb-4">{commander?.avatar ?? '💤'}</span>
              <p className="text-base font-medium text-neutral-300 italic max-w-sm">
                "{idleText}"
              </p>
              <p className="text-xs text-neutral-500 mt-3">
                No spells cast, no creatures attacking.
              </p>
            </div>
          )}

          {/* Complete Phase Content */}
          {phase === 'complete' && (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <span className="text-3xl mb-3">✅</span>
              <p className="text-sm font-medium text-neutral-300">
                {commander?.name ?? 'Opponent'} passes the turn.
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div
          className="p-4 border-t border-neutral-800 bg-neutral-950/60 shrink-0"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {phase === 'event' && currentDrawnCard && (
            <button
              onClick={counterCurrentCard}
              className="btn-press w-full mb-2 py-2 rounded-xl bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 font-semibold text-xs border border-sky-800/60 cursor-pointer transition-all"
              title="You countered this spell: it doesn't resolve"
            >
              Countered (C)
            </button>
          )}
          <button
            onClick={handleContinue}
            className={`btn-press relative overflow-hidden w-full py-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-white font-bold text-sm shadow-md border border-neutral-700 flex items-center justify-center gap-2 cursor-pointer transition-all`}
          >
            {/* Animated progress bar fill during idle countdown */}
            {autoContinue && (
              <div
                className="absolute left-0 top-0 bottom-0 bg-neutral-700/60 transition-[width] duration-100 ease-linear pointer-events-none"
                style={{ width: `${((IDLE_AUTO_SKIP_MS - remainingMs) / IDLE_AUTO_SKIP_MS) * 100}%` }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <ChevronRight className="w-4 h-4" />
              <span>{getButtonText()}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
