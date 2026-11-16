import { useGameStore } from '@/store/useGameStore';
import { useDeckStore } from '@/store/useDeckStore';
import { buildMatchRecord } from '@/logic/game';

/** True when there is unsaved progress in the current (unfinished) game. */
export const isGameInProgress = (): boolean => {
  const s = useGameStore.getState();
  return (
    !s.isGameOver &&
    (s.turn > 1 || s.totalDamageDealt > 0 || s.activePermanents.length > 0 || s.eventHistory.length > 0)
  );
};

/** Restart with the current settings, asking first if that would throw away progress. */
export const confirmAndRestart = (): void => {
  if (isGameInProgress() && !window.confirm('Restart the current game? Progress will be lost.')) {
    return;
  }
  useGameStore.getState().resetGame();
};

/** Record the current game as a loss in match history, then restart. */
export const concedeGame = (): void => {
  const game = useGameStore.getState();
  if (game.isGameOver) return;
  if (!window.confirm(`Concede on turn ${game.turn} and record a loss for "${game.currentDeckName || 'Unnamed Deck'}"?`)) {
    return;
  }
  useDeckStore.getState().recordMatch(buildMatchRecord(game, false));
  game.resetGame();
};
