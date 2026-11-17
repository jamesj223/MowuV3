import React from 'react';
import { X, Keyboard, HelpCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const hotkeys = [
    { action: 'Next Turn / Continue', keys: ['Space', 'Enter'] },
    { action: 'Deal Damage (-1 Life)', keys: ['Down', 'S', '-'] },
    { action: 'Deal Damage (-5 Life)', keys: ['Shift + Down', 'Shift + S'] },
    { action: 'Deal Damage (-10 Life)', keys: ['Alt + Down', 'Alt + S'] },
    { action: 'Heal / Rollback (+1 Life)', keys: ['Up', 'W', '+'] },
    { action: 'Heal / Rollback (+5 Life)', keys: ['Shift + Up', 'Shift + W'] },
    { action: 'Heal / Rollback (+10 Life)', keys: ['Alt + Up', 'Alt + W'] },
    { action: 'Trigger Random Event', keys: ['E'] },
    { action: "Counter Mowu's Spell (his turn)", keys: ['C'] },
    { action: 'Restart Game (asks first)', keys: ['Shift + R'] },
    { action: 'Open Analytics & Benchmarks', keys: ['B'] },
    { action: 'Close Dialog / Open New Game', keys: ['Esc'] },
    { action: 'Help Cheat-sheet', keys: ['?', '/'] },
  ];

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
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Keyboard Shortcuts & Guide</h2>
              <p className="text-xs text-neutral-400">Play fast without taking your hands off the keyboard</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Hotkeys Reference
            </h3>
            <div className="rounded-xl border border-neutral-800 divide-y divide-neutral-850 overflow-hidden">
              {hotkeys.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3.5 py-2.5 bg-neutral-950/40 hover:bg-neutral-950/80 transition-colors text-xs"
                >
                  <span className="text-neutral-300 font-medium">{h.action}</span>
                  <div className="flex gap-1.5">
                    {h.keys.map((k, j) => (
                      <kbd
                        key={j}
                        className="px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-200 font-mono text-[11px] font-semibold shadow-xs"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800">
            <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Commander Bracket System</span>
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Brackets follow Wizards of the Coast's Commander Brackets (October 2025 update). Each
              bracket sets how many turns you should expect to play before anyone wins or loses. The
              victory screen shows that next to the turn you won on.
            </p>
            <ul className="text-xs text-neutral-400 mt-2 space-y-1 list-disc list-inside">
              <li><strong className="text-emerald-400">Bracket 1: Exhibition</strong>: theme over power; at least 9 turns.</li>
              <li><strong className="text-sky-400">Bracket 2: Core</strong>: unoptimized, low-pressure; at least 8 turns.</li>
              <li><strong className="text-amber-400">Bracket 3: Upgraded</strong>: strong synergy, one-big-turn wins; at least 6 turns.</li>
              <li><strong className="text-orange-400">Bracket 4: Optimized</strong>: lethal, consistent and fast; at least 4 turns.</li>
              <li><strong className="text-rose-400">Bracket 5: cEDH</strong>: built for the cEDH metagame; any turn.</li>
            </ul>

            <div className="mt-3 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-400">
              <strong className="text-amber-400 block mb-1">🐕 Opponent Turn System & Commanders</strong>
              Each turn alternates between your turn and an Opponent turn. Mowu has a mana budget that grows each turn (faster at higher brackets) and, outside Bracket 1, casts at least one card every turn. Press C (or Countered) if you counter a spell he casts. Each Mowu has a commander card: he casts it from the command zone when he can afford it, and if it's destroyed it returns there and costs {2} more next time. Each Mowu plays to his archetype with his own cards. Effects the app can apply (counters, tokens, your poison, Mowu's life) happen automatically and are shown in the turn log; the rest is on the card for you to resolve. Archmage Mowu's combo is tracked above the battlefield: if every piece is on his battlefield at the start of his turn, you lose. Creatures the opponent casts during their own turn can't attack until their next turn unless they have Haste. A Mowu variant commander matching your bracket is randomly assigned, biasing card appearances, declaring combat attacks with non-defender creatures, and providing archetype-specific flavour text.
            </div>

            <p className="text-xs text-neutral-400 mt-3">
              <strong className="text-neutral-300">Rollback</strong> (+ / W / Up) undoes damage you dealt this turn.
              Opponent life gain from event cards never reduces your damage stats.
              Use the <strong className="text-neutral-300">flag</strong> button to concede and log a loss.
            </p>

            <p className="text-xs text-neutral-500 mt-3">
              Custom MS Paint card artwork can be added directly to{' '}
              <code className="text-neutral-400 bg-neutral-800 px-1 py-0.5 rounded font-mono">
                mowu-v3/public/cards/
              </code>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium cursor-pointer"
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
