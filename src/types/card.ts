import type { CommanderBracket } from './game';

export type EventCategory =
  | 'creature'
  | 'board_wipe'
  | 'removal'
  | 'tax'
  | 'disruption'
  | 'lifegain'
  | 'combo';

/**
 * How a permanent's counters are interpreted:
 * - 'plus-one': +1/+1 counters added to power and toughness.
 * - 'swarm': number of identical bodies (each attacks separately).
 * - 'tax': tax counters (the card's text says what each one costs you).
 * - 'study': study counters (Scholar Mowu's lessons).
 */
export type CounterType = 'plus-one' | 'swarm' | 'tax' | 'study';

/**
 * A static effect printed on one of Mowu's permanents (equipment, anthems).
 * It applies only while that permanent is on the battlefield (ADR-019).
 */
export interface StaticBuff {
  /** 'commander': Mowu's commander; 'creatures': all of Mowu's creatures; 'tokens': tokens of `tokenId`. */
  target: 'commander' | 'creatures' | 'tokens';
  tokenId?: string;
  power: number;
  toughness: number;
  keywords?: string[];
}

/**
 * Effects the app applies automatically when a card resolves, or when a
 * printed upkeep trigger fires. Anything only the player can do (discard,
 * sacrifice, pay) stays in the card text for the player to resolve.
 */
export type CardEffect =
  /** Put counters on Mowu's commander, on the source permanent, or on each of Mowu's tax permanents. */
  | { type: 'counters'; target: 'commander' | 'self' | 'tax-permanents'; amount: number }
  /** Create tokens (they join an existing stack of the same token where possible). */
  | { type: 'create-tokens'; tokenId: string; count: number }
  /** Give the player poison counters (optionally only if they already have some: "proliferate"). */
  | { type: 'player-poison'; amount: number; onlyIfPoisoned?: boolean }
  /** The player loses (negative) or gains life, if their life is being tracked. */
  | { type: 'player-life'; amount: number }
  /** Mowu (the opponent pod) gains life. */
  | { type: 'opponent-life'; amount: number }
  /** If the source has at least `threshold` counters, remove that many and tell the player `text`. */
  | { type: 'threshold'; threshold: number; text: string };

/** Conditions for Mowu to consider casting a card (no point pumping a commander that isn't there). */
export type CardRequirement = 'commander-on-battlefield' | 'tax-permanent' | 'player-poisoned';

export type ComboPiece = 'A' | 'B' | 'C';

export interface CardStats {
  renderedText: string;
  power?: number;
  toughness?: number;
  healAmount?: number;      // if card heals the opponent
  counters?: number;        // overrides initialCounters (e.g. scaled swarm size)
  effects?: CardEffect[];   // applied when the card resolves (spells) or enters (permanents)
  upkeep?: CardEffect[];    // printed "at the beginning of Mowu's upkeep" trigger (permanents)
  buff?: StaticBuff;        // printed static effect (permanents)
}

export interface EventCardDefinition {
  id: string;
  name: string;
  manaCost: string;
  typeLine: string;
  artFile: string;             // relative to /cards/
  category: EventCategory;
  isPermanent: boolean;       // creatures & enchantments stay on battlefield
  minTurn?: number;           // turns before this can appear
  flavorText?: string;
  /** Commander cards only: which Mowu this is the commander card for. */
  signatureCommanderId?: string;
  /** Only these Mowu commanders cast this card (their archetype cards). */
  exclusiveTo?: string[];
  /** Bracket range (1–5) this card appears in. Custom counts as 2. */
  minBracket?: number;
  maxBracket?: number;
  requires?: CardRequirement[];
  comboPiece?: ComboPiece;
  basePower?: number;
  baseToughness?: number;
  initialCounters?: number;
  counterType?: CounterType;
  templateText: string;
  // Scaler computes dynamic card text and stats given current turn & Commander bracket
  computeStats: (turn: number, bracket: CommanderBracket) => CardStats;
}

export interface ActivePermanent {
  instanceId: string;
  cardId: string;
  name: string;
  manaCost: string;
  typeLine: string;
  artFile: string;
  renderedText: string;
  flavorText?: string;
  power?: number;
  toughness?: number;
  counters: number;
  counterType?: CounterType;
  turnPlayed: number;
  enteredOnOpponentTurn?: boolean; // for summoning sickness
  isCommander?: boolean;           // Mowu's commander: returns to the command zone when it leaves
  isToken?: boolean;
  upkeep?: CardEffect[];
  buff?: StaticBuff;
  comboPiece?: ComboPiece;
}

export interface ResolvedEvent {
  instanceId: string;
  cardId: string;
  name: string;
  typeLine: string;
  artFile: string;
  renderedText: string;
  turnResolved: number;
  healAmount?: number;   // opponent life gained, so a counter can undo it
}

/** Everything a resolved card changed automatically, so "Countered" can reverse it. */
export interface EffectUndo {
  removeInstanceIds: string[];
  counterChanges: { instanceId: string; amount: number }[];
  playerPoison: number;
  playerLife: number;
  opponentLife: number;
}
