import { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';

interface HotkeyCallbacks {
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onCloseAnyModal: () => void;
  hasOpenModal: boolean;
}

export const useHotkeys = ({
  onOpenHelp,
  onOpenSettings,
  onOpenStats,
  onCloseAnyModal,
  hasOpenModal,
}: HotkeyCallbacks) => {
  const {
    applyOpponentHealthChange,
    nextTurn,
    triggerEvent,
    resetGame,
    currentDrawnCard,
    closeDrawnCard,
  } = useGameStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Escape key closes modals or opens settings
      if (e.key === 'Escape') {
        if (currentDrawnCard) {
          closeDrawnCard();
          return;
        }
        if (hasOpenModal) {
          onCloseAnyModal();
          return;
        }
        onOpenSettings();
        return;
      }

      // Space / Enter dismisses drawn card if open
      if (currentDrawnCard && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        closeDrawnCard();
        return;
      }

      // Quick restart with current settings
      if (e.ctrlKey && key === 'q') {
        e.preventDefault();
        resetGame();
        return;
      }

      // Trigger manual event
      if (e.ctrlKey && key === 'e') {
        e.preventDefault();
        triggerEvent();
        return;
      }

      // Next Turn (Space or Enter)
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        nextTurn();
        return;
      }

      // Deal Damage to Opponent (Down arrow, S, or -)
      if (e.key === 'ArrowDown' || key === 's' || e.key === '-') {
        e.preventDefault();
        const amt = e.ctrlKey ? 10 : e.shiftKey ? 5 : 1;
        applyOpponentHealthChange(-amt);
        return;
      }

      // Heal / Rollback Opponent Life (Up arrow, W, or +)
      if (e.key === 'ArrowUp' || key === 'w' || e.key === '+') {
        e.preventDefault();
        const amt = e.ctrlKey ? 10 : e.shiftKey ? 5 : 1;
        applyOpponentHealthChange(amt);
        return;
      }

      // Open Help Cheat-sheet
      if (e.key === '?' || e.key === '/') {
        e.preventDefault();
        onOpenHelp();
        return;
      }

      // Open Stats / Benchmarks
      if (key === 'b') {
        e.preventDefault();
        onOpenStats();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    applyOpponentHealthChange,
    nextTurn,
    triggerEvent,
    resetGame,
    currentDrawnCard,
    closeDrawnCard,
    onOpenHelp,
    onOpenSettings,
    onOpenStats,
    onCloseAnyModal,
    hasOpenModal,
  ]);
};
