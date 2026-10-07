import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeckProfile, MatchRecord } from '@/types/game';

interface DeckStoreState {
  decks: DeckProfile[];
  matches: MatchRecord[];
  
  // Actions
  addDeck: (deck: Omit<DeckProfile, 'id' | 'createdAt'>) => string;
  updateDeck: (id: string, updates: Partial<DeckProfile>) => void;
  deleteDeck: (id: string) => void;
  recordMatch: (match: Omit<MatchRecord, 'id' | 'timestamp'>) => void;
  deleteMatch: (id: string) => void;
  clearHistory: () => void;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
}

const DEFAULT_DECKS: DeckProfile[] = [
  {
    id: 'deck-1',
    name: 'Food and Fellowship',
    commander: 'Frodo & Sam',
    colors: ['W', 'B', 'G'],
    notes: 'Tokens and lifegain engine',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'deck-2',
    name: 'Riders of Rohan',
    commander: 'Éowyn, Shieldmaiden',
    colors: ['U', 'R', 'W'],
    notes: 'Aggressive Human tribal',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'deck-3',
    name: 'Hosts of Mordor',
    commander: 'Sauron, Lord of the Rings',
    colors: ['U', 'B', 'R'],
    notes: 'Amass Orcs and graveyard reanimator',
    createdAt: new Date().toISOString(),
  },
];

export const useDeckStore = create<DeckStoreState>()(
  persist(
    (set, get) => ({
      decks: DEFAULT_DECKS,
      matches: [],

      addDeck: (newDeck) => {
        const id = `deck-${Date.now()}`;
        const deck: DeckProfile = {
          ...newDeck,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ decks: [...state.decks, deck] }));
        return id;
      },

      updateDeck: (id, updates) => {
        set((state) => ({
          decks: state.decks.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        }));
      },

      deleteDeck: (id) => {
        set((state) => ({
          decks: state.decks.filter((d) => d.id !== id),
        }));
      },

      recordMatch: (matchData) => {
        const record: MatchRecord = {
          ...matchData,
          id: `match-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          matches: [record, ...state.matches],
        }));
      },

      deleteMatch: (id) => {
        set((state) => ({
          matches: state.matches.filter((m) => m.id !== id),
        }));
      },

      clearHistory: () => {
        set({ matches: [] });
      },

      exportData: () => {
        const { decks, matches } = get();
        return JSON.stringify({ decks, matches, version: '3.0' }, null, 2);
      },

      importData: (jsonData: string) => {
        try {
          const parsed = JSON.parse(jsonData);
          if (Array.isArray(parsed.decks) && Array.isArray(parsed.matches)) {
            set({ decks: parsed.decks, matches: parsed.matches });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'mowu-v3-deck-store',
    }
  )
);
