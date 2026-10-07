import React from 'react';
import { X, Keyboard, HelpCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const hotkeys = [
    { action: 'Next Turn', keys: ['Space', 'Enter'] },
    { action: 'Deal Damage (-1 Life)', keys: ['Down', 'S', '-'] },
    { action: 'Deal Damage (-5 Life)', keys: ['Shift + Down', 'Shift + S'] },
    { action: 'Deal Damage (-10 Life)', keys: ['Ctrl + Down', 'Ctrl + S'] },
    { action: 'Heal / Rollback (+1 Life)', keys: ['Up', 'W', '+'] },
    { action: 'Heal / Rollback (+5 Life)', keys: ['Shift + Up', 'Shift + W'] },
    { action: 'Heal / Rollback (+10 Life)', keys: ['Ctrl + Up', 'Ctrl + W'] },
    { action: 'Trigger Random Event', keys: ['Ctrl + E'] },
    { action: 'Quick Restart Game', keys: ['Ctrl + Q'] },
    { action: 'Open Analytics & Benchmarks', keys: ['B'] },
    { action: 'Open Settings / New Game', keys: ['Esc'] },
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
              Mowu v3 scales event difficulty and turn cadence to match the official MTG Commander
              Brackets:
            </p>
            <ul className="text-xs text-neutral-400 mt-2 space-y-1 list-disc list-inside">
              <li><strong className="text-emerald-400">Bracket 1 (Precon)</strong>: 10–13 turn goal, mild disruption.</li>
              <li><strong className="text-sky-400">Bracket 2 (Casual)</strong>: 8–10 turn goal, balanced interaction.</li>
              <li><strong className="text-amber-400">Bracket 3 (Optimized)</strong>: 5–7 turn goal, heavy threats & taxes.</li>
              <li><strong className="text-rose-400">Bracket 4 (cEDH)</strong>: 3–5 turn goal, brutal stax & fast clocks.</li>
            </ul>

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
