export type CommanderBracket = 'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'custom' | 'off';

export type WinReason = 'life' | 'poison' | 'commander_damage';

export interface BracketConfig {
  id: CommanderBracket;
  name: string;
  tag: string;
  /** Short summary for compact UI (picker cards, tooltips). */
  description: string;
  /** Display text for the turn expectation, e.g. "9+ turns". */
  targetTurns: string;
  /**
   * Official minimum: "you should expect to be able to play at least N turns
   * before you win or lose". A win on turn N or earlier is faster than the
   * bracket expects. null = no expectation (cEDH, custom, off).
   */
  minTurns: number | null;
  /** Official "Players expect" bullets, verbatim. Empty for custom/off. */
  expectations: string[];
  eventFrequency: number;  // turns between events (game tuning, not official)
  badgeColor: string;
}

/**
 * Bracket names, expectations and turn guidance are quoted from Wizards of the
 * Coast's "Commander Brackets Beta Update – October 21, 2025":
 * https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025
 *
 * Wizards describes these as expectations rather than hard rules. Note that
 * Core (Bracket 2) is deliberately no longer tied to precons.
 * `description` is our own one-line summary; `eventFrequency` is app tuning.
 */
export const COMMANDER_BRACKETS: Record<CommanderBracket, BracketConfig> = {
  b1: {
    id: 'b1',
    name: 'Bracket 1: Exhibition',
    tag: 'B1: Exhibition',
    description: 'Theme over power. Show off your creation.',
    targetTurns: '9+ turns',
    minTurns: 9,
    expectations: [
      'Decks to prioritize a goal, theme, or idea over power',
      'Rules around card legality or viable commanders to have some flexibility depending on the pod',
      'Win conditions to be highly thematic or substandard',
      'Gameplay to be an opportunity to show off your creations',
    ],
    eventFrequency: 6,
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
  b2: {
    id: 'b2',
    name: 'Bracket 2: Core',
    tag: 'B2: Core',
    description: 'Unoptimized, straightforward decks. Low-pressure, social games.',
    targetTurns: '8+ turns',
    minTurns: 8,
    expectations: [
      'Decks to be unoptimized and straightforward, with some cards chosen to maximize creativity and/or entertainment',
      'Win conditions to be incremental, telegraphed on the board, and disruptable',
      'Gameplay to be low pressure with an emphasis on social interaction',
      'Gameplay to be proactive and considerate, letting each deck showcase its plan',
    ],
    eventFrequency: 4,
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
  },
  b3: {
    id: 'b3',
    name: 'Bracket 3: Upgraded',
    tag: 'B3: Upgraded',
    description: 'Strong synergy and card quality. Can win in one big turn.',
    targetTurns: '6+ turns',
    minTurns: 6,
    expectations: [
      'Decks to be powered up with strong synergy and high card quality; they can effectively disrupt opponents',
      'Game Changers that are likely to be value engines and game-ending spells',
      'Win conditions that can be deployed in one big turn from hand, usually because of steadily accrued resources',
      'Gameplay to feature many proactive and reactive plays',
    ],
    eventFrequency: 3,
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
  b4: {
    id: 'b4',
    name: 'Bracket 4: Optimized',
    tag: 'B4: Optimized',
    description: 'Lethal, consistent and fast, but not built for the cEDH metagame.',
    targetTurns: '4+ turns',
    minTurns: 4,
    expectations: [
      'Decks not to adhere to the cEDH metagame reserved for Bracket 5',
      'Decks to be lethal, consistent, and fast, designed to take people down as fast as possible',
      'Game Changers that are likely to be fast mana, snowballing resource engines, free disruption, and tutors',
      'Win conditions to vary but be efficient and instantaneous',
      'Gameplay to be explosive and powerful, featuring huge threats and efficient disruption to match',
    ],
    eventFrequency: 2,
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  },
  b5: {
    id: 'b5',
    name: 'Bracket 5: cEDH',
    tag: 'B5: cEDH',
    description: 'Built for the cEDH metagame. Games could end on any turn.',
    targetTurns: 'Any turn',
    minTurns: null,
    expectations: [
      'Decks that are meticulously designed to battle in the cEDH metagame, with the ability to win quickly or generate overwhelming resources; often built using existing cEDH knowledge, tools, and/or decklists',
      'Win conditions to be optimized for efficiency and consistency',
      'Gameplay to be intricate and advanced, with razor-thin margins for error; players prioritize victory over all else',
    ],
    eventFrequency: 1,
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  },
  custom: {
    id: 'custom',
    name: 'Custom Frequency',
    tag: 'Custom',
    description: 'User-configured turn frequency for events.',
    targetTurns: 'Custom',
    minTurns: null,
    expectations: [],
    eventFrequency: 4,
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  },
  off: {
    id: 'off',
    name: 'Events Off',
    tag: 'Solitaire',
    description: 'Standard goldfish with no opponent events.',
    targetTurns: 'N/A',
    minTurns: null,
    expectations: [],
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
  winReason?: WinReason;           // only set for wins
  timestamp: string;
  eventCount: number;
  won: boolean;                    // false = conceded / lost
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
