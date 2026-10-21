import { EVENT_CARDS } from '@/data/cards';

/**
 * Preload card artwork into browser cache on startup.
 * Prevents visual pop-in / lag when cards are displayed in play or modals.
 */
export function preloadCardArt(): void {
  if (typeof window === 'undefined') return;

  const preloaded = new Set<string>();

  for (const card of EVENT_CARDS) {
    if (card.artFile && !preloaded.has(card.artFile)) {
      preloaded.add(card.artFile);
      const img = new Image();
      img.src = `/cards/${card.artFile}`;
    }
  }
}
