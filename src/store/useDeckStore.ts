import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CommanderBracket, DeckProfile, MatchRecord, WinReason } from '@/types/game';
import { COMMANDER_BRACKETS } from '@/types/game';

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

const BRACKETS = Object.keys(COMMANDER_BRACKETS) as CommanderBracket[];
const WIN_REASONS: readonly WinReason[] = ['life', 'poison', 'commander_damage'];

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Validate an imported deck, dropping unknown/invalid optional fields. */
export const parseDeck = (raw: unknown): DeckProfile | null => {
  if (!isRecord(raw) || typeof raw.id !== 'string' || typeof raw.name !== 'string') return null;
  return {
    id: raw.id,
    name: raw.name,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    commander: typeof raw.commander === 'string' ? raw.commander : undefined,
    bracket: BRACKETS.includes(raw.bracket as CommanderBracket) ? (raw.bracket as CommanderBracket) : undefined,
    colors: Array.isArray(raw.colors) ? raw.colors.filter((c): c is string => typeof c === 'string') : undefined,
    notes: typeof raw.notes === 'string' ? raw.notes : undefined,
  };
};

/** Validate an imported match record. Returns null if any required field is missing or malformed. */
export const parseMatch = (raw: unknown): MatchRecord | null => {
  if (!isRecord(raw)) return null;
  const { id, deckName, turns, startingHealth, finalHealth, damageDealt, bracket, timestamp, eventCount, won, winReason, lossReason } = raw;
  if (
    typeof id !== 'string' ||
    typeof deckName !== 'string' ||
    !isFiniteNumber(turns) ||
    !isFiniteNumber(startingHealth) ||
    !isFiniteNumber(finalHealth) ||
    !isFiniteNumber(damageDealt) ||
    !BRACKETS.includes(bracket as CommanderBracket) ||
    typeof timestamp !== 'string' ||
    Number.isNaN(Date.parse(timestamp))
  ) {
    return null;
  }
  return {
    id,
    deckName,
    turns,
    startingHealth,
    finalHealth,
    damageDealt,
    bracket: bracket as CommanderBracket,
    timestamp,
    eventCount: isFiniteNumber(eventCount) ? eventCount : 0,
    won: typeof won === 'boolean' ? won : true,
    winReason: WIN_REASONS.includes(winReason as WinReason) ? (winReason as WinReason) : undefined,
    lossReason: lossReason === 'combo' || lossReason === 'conceded' ? lossReason : undefined,
  };
};

export const useDeckStore = create<DeckStoreState>()(
  persist(
    (set, get) => ({
      decks: [],
      matches: [],

      addDeck: (newDeck) => {
        const id = makeId('deck');
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
          id: makeId('match'),
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
          const parsed: unknown = JSON.parse(jsonData);
          if (!isRecord(parsed) || !Array.isArray(parsed.decks) || !Array.isArray(parsed.matches)) {
            return false;
          }
          const decks = parsed.decks.map(parseDeck);
          const matches = parsed.matches.map(parseMatch);
          // Reject the whole file rather than silently importing a partial backup
          if (decks.some((d) => d === null) || matches.some((m) => m === null)) return false;
          set({ decks: decks as DeckProfile[], matches: matches as MatchRecord[] });
          return true;
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
