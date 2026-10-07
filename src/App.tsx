import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useHotkeys } from '@/hooks/useHotkeys';
import { Navbar } from '@/components/ui/Navbar';
import { DamageTracker } from '@/components/counters/DamageTracker';
import { TurnCounter } from '@/components/counters/TurnCounter';
import { PlayerTracker } from '@/components/counters/PlayerTracker';
import { BattlefieldZone } from '@/components/events/BattlefieldZone';
import { CardModal } from '@/components/cards/CardModal';
import { NewGameModal } from '@/components/ui/NewGameModal';
import { StatsModal } from '@/components/stats/StatsModal';
import { HelpModal } from '@/components/ui/HelpModal';
import { GameOverModal } from '@/components/ui/GameOverModal';
import { Keyboard } from 'lucide-react';
import type { ActivePermanent, ResolvedEvent } from '@/types/card';

export const App: React.FC = () => {
  const {
    isGameOver,
    currentDrawnCard,
    closeDrawnCard,
    resetGame,
  } = useGameStore();

  const [isNewGameOpen, setIsNewGameOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [inspectedCard, setInspectedCard] = useState<ActivePermanent | ResolvedEvent | null>(null);

  const hasOpenModal =
    isNewGameOpen ||
    isStatsOpen ||
    isHelpOpen ||
    Boolean(currentDrawnCard) ||
    Boolean(inspectedCard);

  const handleCloseAnyModal = () => {
    setIsNewGameOpen(false);
    setIsStatsOpen(false);
    setIsHelpOpen(false);
    closeDrawnCard();
    setInspectedCard(null);
  };

  useHotkeys({
    onOpenHelp: () => setIsHelpOpen(true),
    onOpenSettings: () => setIsNewGameOpen(true),
    onOpenStats: () => setIsStatsOpen(true),
    onCloseAnyModal: handleCloseAnyModal,
    hasOpenModal,
  });

  return (
    <div className="min-h-screen bg-[#0d0f14] text-neutral-200 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      {/* Top Navbar */}
      <Navbar
        onOpenNewGame={() => setIsNewGameOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Expansive Cockpit: Widescreen-optimized flex layout */}
      <main className="flex-grow w-full max-w-[1850px] mx-auto p-3 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
          {/* Left Wing: Turn & Player Status (Slim 280-320px dock) */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col space-y-4">
            <TurnCounter />
            <PlayerTracker />
          </div>

          {/* Center Stage: The Opponent Battlefield (Takes all remaining width, 70%+ of screen!) */}
          <div className="flex-1 min-w-0 flex flex-col">
            <BattlefieldZone onInspectCard={setInspectedCard} />
          </div>

          {/* Right Wing: Opponent Life & Alt-Win Trackers (Slim 280-320px dock) */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col">
            <DamageTracker />
          </div>
        </div>
      </main>

      {/* Footer / Hotkey Hints Bar */}
      <footer className="border-t border-neutral-900 bg-neutral-950/80 py-3 px-6 text-center text-xs text-neutral-500">
        <div className="max-w-[1850px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-neutral-500" />
            <span className="flex items-center gap-1.5 flex-wrap justify-center">
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-850 border border-neutral-800 text-[10px] text-neutral-300 font-mono">
                  Space
                </kbd>{' '}
                Next Turn
              </span>
              <span>•</span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-850 border border-neutral-800 text-[10px] text-neutral-300 font-mono">
                  S / Down
                </kbd>{' '}
                Deal Damage
              </span>
              <span>•</span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-850 border border-neutral-800 text-[10px] text-neutral-300 font-mono">
                  W / Up
                </kbd>{' '}
                Heal / Rollback
              </span>
              <span>•</span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-850 border border-neutral-800 text-[10px] text-neutral-300 font-mono">
                  Ctrl+Q
                </kbd>{' '}
                Restart
              </span>
              <span>•</span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-850 border border-neutral-800 text-[10px] text-neutral-300 font-mono">
                  ?
                </kbd>{' '}
                Hotkeys
              </span>
            </span>
          </div>

          <div className="text-neutral-500 font-mono text-[11px]">
            Mowu v3.0 • MTG Commander Goldfish Companion
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CardModal
        card={currentDrawnCard}
        onClose={closeDrawnCard}
        isNewDraw={true}
      />

      <CardModal
        card={inspectedCard}
        onClose={() => setInspectedCard(null)}
      />

      <GameOverModal
        isOpen={isGameOver}
        onRestart={resetGame}
        onNewGame={() => setIsNewGameOpen(true)}
      />

      <NewGameModal
        isOpen={isNewGameOpen}
        onClose={() => setIsNewGameOpen(false)}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};

export default App;
