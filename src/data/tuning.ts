/**
 * Mowu's difficulty dials, all in one place. These are our own tuning numbers,
 * not official bracket guidance (that lives in src/types/game.ts). Adjust them
 * after playtesting; tests check behaviour, not these exact values.
 */
import type { CommanderBracket } from '@/types/game';

/** Mowu never has more than this much mana in a turn. */
export const MANA_BUDGET_CAP = 10;

/**
 * Extra mana on top of the turn number ("ramp"). The main difficulty dial:
 * higher brackets climb the mana curve faster.
 */
export const rampFor = (bracket: CommanderBracket, turn: number): number => {
  switch (bracket) {
    case 'b3':
      return turn >= 3 ? 1 : 0;
    case 'b4':
      return turn >= 4 ? 2 : turn >= 2 ? 1 : 0;
    case 'b5':
      return 2;
    default:
      return 0;
  }
};

/** Cheaper plays allowed after the main play each turn (mana permitting). */
export const EXTRA_PLAYS: Record<CommanderBracket, number> = {
  b1: 0,
  b2: 0,
  b3: 1,
  b4: 2,
  b5: 2,
  custom: 0,
  off: 0,
};

/** Brackets where Mowu casts something every turn (ADR-018). Others use the event cadence. */
export const ACTS_EVERY_TURN: Record<CommanderBracket, boolean> = {
  b1: false,
  b2: true,
  b3: true,
  b4: true,
  b5: true,
  custom: false,
  off: false,
};

/** Cards cast within this many recent turns are less likely to be picked again. */
export const RECENT_TURNS = 2;
export const RECENT_CARD_WEIGHT = 0.25;

/**
 * Main-play preference for bigger spells: weight is multiplied by
 * (1 + BIG_PLAY_BIAS * manaValue), so Mowu tends to use his mana.
 */
export const BIG_PLAY_BIAS = 0.5;

/**
 * A Mowu's own archetype cards (`exclusiveTo`) are this many times likelier
 * than generic cards, so each commander visibly plays to his plan.
 */
export const ARCHETYPE_CARD_WEIGHT = 3;

/** Card categories never cast as a cheap extra (they should be the turn's headline). */
export const MAIN_PLAY_ONLY_CATEGORIES = ['board_wipe'] as const;

/** Scales X values and P/T on scaling cards (see computeStats in src/data/cards.ts). */
export const bracketMultiplier = (bracket: CommanderBracket): number => {
  switch (bracket) {
    case 'b1': return 0.75;
    case 'b2': return 1.0;
    case 'b3': return 1.25;
    case 'b4': return 1.6;
    case 'b5': return 2.0;
    default: return 1.0;
  }
};

/** A value per bracket. Custom plays like Core (B2); Solitaire never casts. */
export const perBracket = <T,>(b1: T, b2: T, b3: T, b4: T, b5: T): Record<CommanderBracket, T> => ({
  b1, b2, b3, b4, b5, custom: b2, off: b2,
});

/** Numbers printed on the generic cards (src/data/cards.ts). */
export const CARD_TUNING = {
  /** Homing Fireball Pigeon: damage = max(min, round(turn × bracketMultiplier + 1)). */
  pigeonMinDamage: 2,
  /** Gargantuan Wall of Beef: toughness = max(min, round(turn × bracketMultiplier + 2)). */
  wallOfBeefMinToughness: 4,
  /** Wrath of Oops: hits everything from this turn on (or always at these brackets)… */
  wrathFullFromTurn: 6,
  wrathAlwaysFull: perBracket(false, false, false, true, true),
  /** …otherwise destroys creatures with mana value up to this. */
  wrathMaxManaValue: perBracket(3, 4, 5, 5, 5),
  bureaucraticDelayTax: perBracket(1, 1, 1, 2, 3),
  meatPieHeal: perBracket(4, 6, 8, 10, 14),
  /** Toxic Mosquito Swarm size (bigger from turn 6). */
  mosquitoSwarm: perBracket(1, 1, 1, 2, 3),
  mosquitoSwarmLate: perBracket(2, 2, 2, 2, 3),
  mosquitoLateFromTurn: 6,
  /** Apex Behemoth: P/T = max(min, turn + bonus). */
  apexMinStat: 5,
  apexBonus: perBracket(1, 1, 2, 4, 6),
  bellyRubLife: perBracket(2, 3, 3, 4, 5),
  barkAlarmDamage: perBracket(2, 2, 3, 3, 4),
};
