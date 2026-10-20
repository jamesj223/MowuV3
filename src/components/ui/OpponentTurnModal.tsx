import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { PlaytestCard } from '@/components/cards/PlaytestCard';
import { Swords, Sparkles, Coffee, ChevronRight, Skull } from 'lucide-react';

export const OpponentTurnModal: React.FC = () => {
  const {
    opponentTurnState,
    opponentCommander,
    turn,
    advanceOpponentPhase,
    endOpponentTurn,
    currentDrawnCard,
  } = useGameStore();

  if (!opponentTurnState) return null;

  const { phase, attackers, idleText } = opponentTurnState;
  const commander = opponentCommander;
  const accentColor = commander?.accentColor ?? 'amber';

  // Color utility map for dynamic accent coloring
  const colorMap: Record<string, { bg: string; border: string; text: string; glow: string; badge: string }> = {
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', glow: 'shadow-amber-500/20', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
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
      case 'event': return 'Main Phase — Casting Spell';
      case 'combat': return 'Combat Phase — Declaring Attackers';
      case 'idle': return 'Passing the Turn';
      case 'complete': return 'Turn Complete';
    }
  };

  const getButtonText = () => {
    if (phase === 'event') {
      return attackers.length > 0 ? 'Continue to Combat' : 'Continue';
    }
    if (phase === 'combat') return 'End Opponent Turn';
    return 'Continue to Your Turn';
  };

  const totalAttackPower = attackers.reduce((sum, a) => sum + a.power, 0);

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
            </div>
          )}

          {/* Combat Phase Content */}
          {phase === 'combat' && attackers.length > 0 && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-rose-300 flex items-center gap-2">
                    <Swords className="w-4 h-4" />
                    {attackers.length} creature{attackers.length !== 1 ? 's' : ''} attacking!
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
                          <p className="text-sm font-bold text-white">{attacker.name}</p>
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

              <p className="text-xs text-neutral-500 text-center italic">
                Assign blockers and take damage as needed, then end the opponent's turn.
              </p>
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
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 shrink-0">
          <button
            onClick={handleContinue}
            className={`btn-press w-full py-3 rounded-xl bg-gradient-to-r from-neutral-700 to-neutral-600 hover:from-neutral-600 hover:to-neutral-500 text-white font-bold text-sm shadow-md border border-neutral-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all`}
          >
            <ChevronRight className="w-4 h-4" />
            <span>{getButtonText()} (Space / Enter)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
