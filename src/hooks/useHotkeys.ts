import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { confirmAndRestart } from '@/lib/gameActions';

interface HotkeyCallbacks {
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onCloseAnyModal: () => void;
  hasOpenModal: boolean;
}

/**
 * Keyboard shortcuts.
 *
 * Modifiers: Shift = x5, Alt = x10. Ctrl/Cmd combos are deliberately left to the
 * browser (Ctrl+W / Ctrl+Q can't be intercepted and would close the tab/browser).
 * Letter keys use `event.code` so they work on any layout and with Alt on macOS.
 */
export const useHotkeys = (callbacks: HotkeyCallbacks) => {
  // Keep the latest callbacks in a ref so the listener is attached once.
  const cb = useRef(callbacks);
  useEffect(() => {
    cb.current = callbacks;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) {
        return;
      }
      if (e.ctrlKey || e.metaKey) return;

      const { onOpenHelp, onOpenSettings, onOpenStats, onCloseAnyModal, hasOpenModal } = cb.current;
      const game = useGameStore.getState();
      const opp = game.turnPhase === 'opponent' ? game.opponentTurnState : null;
      const isConfirmKey = e.key === ' ' || e.key === 'Enter';

      // Holding Space/Enter must not fast-forward through turns
      if (isConfirmKey && e.repeat) {
        e.preventDefault();
        return;
      }

      const advanceOpponentTurn = () => {
        if (!opp) return;
        if (game.currentDrawnCard && opp.phase === 'event') {
          game.closeDrawnCard();
          game.advanceOpponentPhase();
        } else if (opp.phase === 'idle' || opp.phase === 'complete') {
          game.endOpponentTurn();
        } else {
          game.advanceOpponentPhase();
        }
      };

      // C during Mowu's main phase: the player countered the spell being cast
      if (opp && opp.phase === 'event' && game.currentDrawnCard && e.code === 'KeyC' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        game.counterCurrentCard();
        return;
      }

      if (e.key === 'Escape') {
        if (opp) return advanceOpponentTurn();
        if (game.currentDrawnCard) return game.closeDrawnCard();
        if (hasOpenModal) return onCloseAnyModal();
        return onOpenSettings();
      }

      if (isConfirmKey) {
        e.preventDefault();
        if (opp) return advanceOpponentTurn();
        if (hasOpenModal) return onCloseAnyModal();
        game.nextTurn();
        return;
      }

      // Everything below acts on the board, so ignore it while anything covers the board.
      if (hasOpenModal || opp) return;

      if (e.key === '?' || e.code === 'Slash') {
        e.preventDefault();
        onOpenHelp();
        return;
      }

      if (e.code === 'KeyR' && e.shiftKey) {
        e.preventDefault();
        if (game.isGameOver) game.resetGame();
        else confirmAndRestart();
        return;
      }

      if (game.isGameOver) return;

      const isPlusKey = e.key === '+' || e.code === 'Equal' || e.code === 'NumpadAdd';
      const isMinusKey = e.key === '-' || e.code === 'Minus' || e.code === 'NumpadSubtract';
      // '+' needs Shift on many layouts, so Shift doesn't multiply the +/- keys
      const amount = e.altKey ? 10 : e.shiftKey && !isPlusKey && !isMinusKey ? 5 : 1;

      if (e.code === 'ArrowDown' || e.code === 'KeyS' || isMinusKey) {
        e.preventDefault();
        game.applyOpponentHealthChange(-amount);
        return;
      }

      if (e.code === 'ArrowUp' || e.code === 'KeyW' || isPlusKey) {
        e.preventDefault();
        game.applyOpponentHealthChange(amount);
        return;
      }

      if (e.code === 'KeyE' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        game.triggerEvent();
        return;
      }

      if (e.code === 'KeyB' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        onOpenStats();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
