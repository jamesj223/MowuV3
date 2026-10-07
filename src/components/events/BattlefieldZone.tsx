import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { PlaytestCard } from '@/components/cards/PlaytestCard';
import { CardModal } from '@/components/cards/CardModal';
import type { ActivePermanent, ResolvedEvent } from '@/types/card';
import { ShieldAlert, Trash2, History, Sparkles } from 'lucide-react';

export const BattlefieldZone: React.FC = () => {
  const {
    activePermanents,
    eventHistory,
    dismissPermanent,
    clearAllPermanents,
    triggerEvent,
  } = useGameStore();

  const [inspectedCard, setInspectedCard] = useState<ActivePermanent | ResolvedEvent | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="flex flex-col bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm h-full justify-between min-h-[500px]">
      {/* Playmat Zone Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold tracking-wide text-neutral-300 uppercase">
              Opponent Battlefield
            </h2>
            <p className="text-[10px] text-neutral-500">
              Active Permanents & Blockers ({activePermanents.length})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activePermanents.length > 0 && (
            <button
              onClick={clearAllPermanents}
              className="text-xs px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-rose-400 border border-neutral-700 flex items-center gap-1 cursor-pointer transition-colors"
              title="Board wipe / Destroy all opponent permanents"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Board</span>
            </button>
          )}

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
              showHistory
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-400 border-neutral-700'
            }`}
            title="View resolved spells log"
          >
            <History className="w-3.5 h-3.5" />
            <span>Spells Log ({eventHistory.length})</span>
          </button>
        </div>
      </div>

      {/* Main Playmat Field: Expands fully across widescreen and wraps smoothly */}
      <div className="flex-grow py-4 overflow-y-auto max-h-[620px] scrollbar-thin">
        {activePermanents.length === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-neutral-800/80 rounded-xl bg-neutral-950/40">
            <span className="text-4xl mb-3">🛡️</span>
            <p className="text-sm font-bold text-neutral-300">
              Opponent battlefield is clear
            </p>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Creatures, blockers, and continuous taxes will appear here as turns advance based on your Commander Bracket.
            </p>
            <button
              onClick={() => triggerEvent()}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>Trigger Test Event (Ctrl+E)</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3.5 items-start justify-start pt-1">
            {activePermanents.map((perm) => (
              <div key={perm.instanceId} className="shrink-0">
                <PlaytestCard
                  name={perm.name}
                  typeLine={perm.typeLine}
                  artFile={perm.artFile}
                  renderedText={perm.renderedText}
                  flavorText={perm.flavorText}
                  power={perm.power}
                  toughness={perm.toughness}
                  variant="in_play"
                  showDismiss={true}
                  onDismiss={() => dismissPermanent(perm.instanceId)}
                  onClick={() => setInspectedCard(perm)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Spell History Drawer */}
      {showHistory && (
        <div className="pt-3 border-t border-neutral-800 shrink-0">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            Resolved Spells Log
          </h3>
          {eventHistory.length === 0 ? (
            <p className="text-xs text-neutral-600">No spells resolved yet this run.</p>
          ) : (
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {eventHistory.map((ev) => (
                <div
                  key={ev.instanceId}
                  onClick={() => setInspectedCard(ev)}
                  className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-amber-400 font-bold">
                      T{ev.turnResolved}
                    </span>
                    <span className="text-xs font-semibold text-white">{ev.name}</span>
                    <span className="text-[10px] text-neutral-400">({ev.typeLine})</span>
                  </div>
                  <span className="text-xs text-neutral-400 truncate max-w-[240px]">
                    {ev.renderedText}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full-size Card Inspection Modal */}
      {inspectedCard && (
        <CardModal
          card={inspectedCard}
          onClose={() => setInspectedCard(null)}
        />
      )}
    </div>
  );
};
