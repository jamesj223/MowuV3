export type CommanderBracket = 'b1' | 'b2' | 'b3' | 'b4' | 'custom' | 'off';

export interface BracketConfig {
  id: CommanderBracket;
  name: string;
  tag: string;
  description: string;
  targetTurns: string;     // e.g. "10-13 turns"
  eventFrequency: number;  // turns between events
  badgeColor: string;
}

export const COMMANDER_BRACKETS: Record<CommanderBracket, BracketConfig> = {
  b1: {
    id: 'b1',
    name: 'Bracket 1: Exhibition / Precon',
    tag: 'B1: Precon',
    description: 'Casual un-upgraded precons & low power. Relaxed pacing.',
    targetTurns: '10–13+ turns',
    eventFrequency: 6,
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
  b2: {
    id: 'b2',
    name: 'Bracket 2: Core Casual',
    tag: 'B2: Casual',
    description: 'Upgraded precons & average EDH decks. Balanced interaction.',
    targetTurns: '8–10 turns',
    eventFrequency: 4,
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
  },
  b3: {
    id: 'b3',
    name: 'Bracket 3: Optimized',
    tag: 'B3: Optimized',
    description: 'Tuned synergies, fast mana, efficient win conditions.',
    targetTurns: '5–7 turns',
    eventFrequency: 3,
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
  b4: {
    id: 'b4',
    name: 'Bracket 4: cEDH / Max Power',
    tag: 'B4: cEDH',
    description: 'Competitive EDH. Turn 2–4 win attempts, aggressive stax.',
    targetTurns: '3–5 turns',
    eventFrequency: 2,
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  },
  custom: {
    id: 'custom',
    name: 'Custom Frequency',
    tag: 'Custom',
    description: 'User-configured turn frequency for events.',
    targetTurns: 'Custom',
    eventFrequency: 4,
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  },
  off: {
    id: 'off',
    name: 'Events Off',
    tag: 'Solitaire',
    description: 'Standard goldfish with no opponent events.',
    targetTurns: 'N/A',
    eventFrequency: 0,
    badgeColor: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  },
};

export interface GameSettings {
  startingOpponentHealth: number; // default: 120 (for 3-opponent pod) or 40
  startingPlayerLife: number;     // default: 40 (for player)
  bracket: CommanderBracket;      // default: 'b2'
  customEventFrequency: number;   // when bracket is 'custom'
  trackPlayer: boolean;           // show player life
  trackPlayerPoison: boolean;     // show player poison (default: false)
  trackPlayerCommanderDamage: boolean; // show player commander damage (default: false)
  trackOpponentPoison: boolean;   // show 3 opponent poison tracks (default: false)
  trackOpponentCommanderDamage: boolean; // show 3 opponent commander damage tracks (default: false)
}

export interface TurnSnapshot {
  turn: number;
  damageThisTurn: number;
  opponentHealth: number;
  totalDamage: number;
  timestamp: number;
}

export interface MatchRecord {
  id: string;
  deckName: string;
  turns: number;
  startingHealth: number;
  finalHealth: number;
  damageDealt: number;
  bracket: CommanderBracket;
  winReason?: 'life' | 'poison' | 'commander_damage';
  timestamp: string;
  eventCount: number;
  won: boolean;
}

export interface DeckProfile {
  id: string;
  name: string;
  commander?: string;
  bracket?: CommanderBracket;
  colors?: string[]; // W, U, B, R, G
  notes?: string;
  createdAt: string;
}
