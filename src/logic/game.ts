/**
 * Pure game-logic helpers. Nothing in here touches the store, timers, the DOM
 * or Math.random directly (randomness is injected), so it is all unit-testable.
 */
import type { CommanderBracket, MatchRecord, TurnSnapshot, WinReason } from '@/types/game';
import { COMMANDER_BRACKETS } from '@/types/game';
import type { ActivePermanent, EventCardDefinition, EventCategory } from '@/types/card';
import type { AttackingCreature } from '@/types/opponent';

export type Triple = [number, number, number];

export const POISON_LETHAL = 10;
export const COMMANDER_DAMAGE_LETHAL = 21;

export const ATTACK_KEYWORDS = [
  'Haste',
  'Trample',
  'Flying',
  'Vigilance',
  'Deathtouch',
  'Reach',
  'Toxic',
  'Lifelink',
  'First Strike',
  'Double Strike',
  'Menace',
] as const;

/** Whole-word, case-insensitive keyword match (so "Reach" doesn't match "breach"). */
export const hasKeyword = (text: string, keyword: string): boolean => {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
};

export const extractKeywords = (text: string): string =>
  ATTACK_KEYWORDS.filter((kw) => hasKeyword(text, kw)).join(', ');

export const getEventFrequency = (bracket: CommanderBracket, customFrequency: number): number =>
  bracket === 'custom' ? customFrequency : COMMANDER_BRACKETS[bracket].eventFrequency;

export const isEventTurn = (turn: number, frequency: number): boolean =>
  frequency > 0 && turn % frequency === 0;

export const checkVictory = (
  health: number,
  poison: Triple,
  commanderDamage: Triple,
  trackPoison: boolean,
  trackCommanderDamage: boolean,
): { isWon: boolean; reason: WinReason | null } => {
  if (health <= 0) return { isWon: true, reason: 'life' };
  if (trackPoison && poison.every((p) => p >= POISON_LETHAL)) {
    return { isWon: true, reason: 'poison' };
  }
  if (trackCommanderDamage && commanderDamage.every((d) => d >= COMMANDER_DAMAGE_LETHAL)) {
    return { isWon: true, reason: 'commander_damage' };
  }
  return { isWon: false, reason: null };
};

/**
 * Power/toughness of a single permanent after counters.
 * +1/+1 counters pump the creature; swarm counters count copies instead.
 */
export const getEffectiveStats = (
  p: Pick<ActivePermanent, 'power' | 'toughness' | 'counters' | 'counterType'>,
): { power?: number; toughness?: number } => {
  if (p.counterType === 'plus-one') {
    return {
      power: p.power === undefined ? undefined : p.power + p.counters,
      toughness: p.toughness === undefined ? undefined : p.toughness + p.counters,
    };
  }
  return { power: p.power, toughness: p.toughness };
};

/** A creature that entered during this opponent turn can't attack unless it has Haste. */
export const isSummoningSick = (p: ActivePermanent, currentTurn: number): boolean =>
  p.turnPlayed === currentTurn &&
  Boolean(p.enteredOnOpponentTurn) &&
  !hasKeyword(p.renderedText, 'Haste');

/**
 * Creatures that attack on the opponent's turn: positive power, no Defender,
 * not summoning sick, and (for swarms) at least one body left.
 */
export const getAttackers = (
  permanents: ActivePermanent[],
  currentTurn: number,
): AttackingCreature[] =>
  permanents.flatMap((p) => {
    const { power, toughness } = getEffectiveStats(p);
    if (power === undefined || power <= 0) return [];
    if (hasKeyword(p.renderedText, 'Defender')) return [];
    if (isSummoningSick(p, currentTurn)) return [];
    const count = p.counterType === 'swarm' ? p.counters : 1;
    if (count <= 0) return [];
    return [
      {
        instanceId: p.instanceId,
        name: p.name,
        power,
        toughness: toughness ?? 0,
        count,
        keywords: extractKeywords(p.renderedText),
      },
    ];
  });

export const totalAttackPower = (attackers: AttackingCreature[]): number =>
  attackers.reduce((sum, a) => sum + a.power * a.count, 0);

/**
 * Cards the opponent may cast this turn: past their minimum turn, and signature
 * cards (e.g. Tax Collector Mowu) only for the commander they belong to.
 * Relaxes the turn requirement, then everything, rather than returning nothing.
 */
export const getEligibleCards = (
  cards: EventCardDefinition[],
  turn: number,
  commanderId: string | undefined,
): EventCardDefinition[] => {
  const allowedForCommander = cards.filter(
    (c) => !c.signatureCommanderId || c.signatureCommanderId === commanderId,
  );
  const eligible = allowedForCommander.filter((c) => (c.minTurn ?? 1) <= turn);
  if (eligible.length > 0) return eligible;
  return allowedForCommander.length > 0 ? allowedForCommander : cards;
};

/** Generic weighted pick. `random` returns [0, 1). Uniform if all weights are zero. */
export const pickWeighted = <T>(items: T[], weightOf: (item: T) => number, random: () => number): T => {
  const ws = items.map((i) => Math.max(0, weightOf(i)));
  const total = ws.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return items[Math.floor(random() * items.length)];
  let roll = random() * total;
  for (let i = 0; i < ws.length; i++) {
    roll -= ws[i];
    if (roll < 0) return items[i];
  }
  return items[items.length - 1];
};

/** Weighted random card pick by category weight (used for manual "trigger event"). */
export const pickWeightedCard = (
  eligible: EventCardDefinition[],
  weights: Partial<Record<EventCategory, number>>,
  random: () => number,
): EventCardDefinition => pickWeighted(eligible, (c) => weights[c.category] ?? 1, random);

export const createSnapshot = (
  turn: number,
  opponentHealth: number,
  totalDamage: number,
  now: number = Date.now(),
): TurnSnapshot => ({ turn, damageThisTurn: 0, opponentHealth, totalDamage, timestamp: now });

export type HealthChangeSource = 'player' | 'card';

/**
 * Apply a change to the opponent's life total and keep damage stats in sync.
 *
 * - Damage (negative delta) counts toward damage dealt immediately.
 * - A player heal (the +/W/Up "rollback") undoes damage dealt this turn, but
 *   never more than was dealt this turn.
 * - Card effects (opponent life gain, or undoing it when the card is countered)
 *   change life only; they never touch the player's damage stats.
 */
export const applyHealthChange = (
  game: {
    opponentHealth: number;
    totalDamageDealt: number;
    turn: number;
    turnSnapshots: TurnSnapshot[];
  },
  delta: number,
  source: HealthChangeSource,
): {
  opponentHealth: number;
  totalDamageDealt: number;
  turnSnapshots: TurnSnapshot[];
  appliedDelta: number;
} => {
  const opponentHealth = Math.max(0, game.opponentHealth + delta);
  const appliedDelta = opponentHealth - game.opponentHealth;

  const snapshots = [...game.turnSnapshots];
  let idx = snapshots.length - 1;
  if (idx < 0 || snapshots[idx].turn !== game.turn) {
    snapshots.push(createSnapshot(game.turn, game.opponentHealth, game.totalDamageDealt));
    idx = snapshots.length - 1;
  }
  const current = snapshots[idx];

  let damageChange = 0;
  if (appliedDelta < 0 && source === 'player') {
    damageChange = -appliedDelta;
  } else if (appliedDelta > 0 && source === 'player') {
    damageChange = -Math.min(appliedDelta, current.damageThisTurn);
  }

  const totalDamageDealt = game.totalDamageDealt + damageChange;
  snapshots[idx] = {
    ...current,
    damageThisTurn: current.damageThisTurn + damageChange,
    totalDamage: totalDamageDealt,
  };

  return { opponentHealth, totalDamageDealt, turnSnapshots: snapshots, appliedDelta };
};

/**
 * Undo a turn advance: drop the current turn's snapshot and fold any damage
 * dealt in it back into the previous turn so totals stay consistent.
 */
export const rewindSnapshots = (snapshots: TurnSnapshot[], currentTurn: number): TurnSnapshot[] => {
  if (snapshots.length < 2) return snapshots;
  const last = snapshots[snapshots.length - 1];
  if (last.turn !== currentTurn) return snapshots;
  const rest = snapshots.slice(0, -1);
  const prev = rest[rest.length - 1];
  rest[rest.length - 1] = {
    ...prev,
    damageThisTurn: prev.damageThisTurn + last.damageThisTurn,
    totalDamage: last.totalDamage,
  };
  return rest;
};

export const buildMatchRecord = (
  game: {
    currentDeckName: string;
    turn: number;
    startingOpponentHealth: number;
    opponentHealth: number;
    totalDamageDealt: number;
    bracket: CommanderBracket;
    winReason: WinReason | null;
    eventsTriggered: number;
  },
  won: boolean,
): Omit<MatchRecord, 'id' | 'timestamp'> => ({
  deckName: game.currentDeckName || 'Unnamed Deck',
  turns: game.turn,
  startingHealth: game.startingOpponentHealth,
  finalHealth: game.opponentHealth,
  damageDealt: game.totalDamageDealt,
  bracket: game.bracket,
  winReason: won ? (game.winReason ?? 'life') : undefined,
  eventCount: game.eventsTriggered,
  won,
});
