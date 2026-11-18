/**
 * Pure game-logic helpers. Nothing in here touches the store, timers, the DOM
 * or Math.random directly (randomness is injected), so it is all unit-testable.
 */
import type { CommanderBracket, LossReason, MatchRecord, TurnSnapshot, WinReason } from '@/types/game';
import { COMMANDER_BRACKETS } from '@/types/game';
import type { ActivePermanent, ComboPiece, EventCardDefinition, EventCategory, StaticBuff } from '@/types/card';
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
/** Does `buff` (printed on some permanent) apply to permanent `p`? */
const buffApplies = (buff: StaticBuff, p: ActivePermanent): boolean => {
  if (p.power === undefined) return false; // only creatures
  if (buff.target === 'commander') return Boolean(p.isCommander);
  if (buff.target === 'tokens') return Boolean(p.isToken) && (!buff.tokenId || buff.tokenId === p.cardId);
  return true; // 'creatures'
};

/** Static buffs from Mowu's permanents (equipment, anthems) that apply to `p`. */
export const getBuffsFor = (p: ActivePermanent, battlefield: ActivePermanent[]): StaticBuff[] =>
  battlefield.flatMap((source) => (source.buff && buffApplies(source.buff, p) ? [source.buff] : []));

/**
 * Power/toughness of a single permanent after counters and static buffs.
 * +1/+1 counters pump the creature; swarm counters count copies instead.
 * Pass the battlefield to include buffs from equipment/anthems.
 */
export const getEffectiveStats = (
  p: Pick<ActivePermanent, 'power' | 'toughness' | 'counters' | 'counterType'> & Partial<ActivePermanent>,
  battlefield: ActivePermanent[] = [],
): { power?: number; toughness?: number } => {
  const plusOne = p.counterType === 'plus-one' ? p.counters : 0;
  const buffs = p.instanceId ? getBuffsFor(p as ActivePermanent, battlefield) : [];
  const bonusP = buffs.reduce((sum, b) => sum + b.power, 0);
  const bonusT = buffs.reduce((sum, b) => sum + b.toughness, 0);
  return {
    power: p.power === undefined ? undefined : p.power + plusOne + bonusP,
    toughness: p.toughness === undefined ? undefined : p.toughness + plusOne + bonusT,
  };
};

/** Rules text plus keywords granted by buffs, for keyword checks. */
export const getEffectiveKeywordText = (p: ActivePermanent, battlefield: ActivePermanent[] = []): string => {
  const granted = getBuffsFor(p, battlefield).flatMap((b) => b.keywords ?? []);
  return granted.length > 0 ? `${p.renderedText}\n${granted.join(', ')}` : p.renderedText;
};

/** A creature that entered during this opponent turn can't attack unless it has Haste (printed or granted). */
export const isSummoningSick = (
  p: ActivePermanent,
  currentTurn: number,
  battlefield: ActivePermanent[] = [],
): boolean =>
  p.turnPlayed === currentTurn &&
  Boolean(p.enteredOnOpponentTurn) &&
  !hasKeyword(getEffectiveKeywordText(p, battlefield), 'Haste');

/**
 * Creatures that attack on the opponent's turn: positive power, no Defender,
 * not summoning sick, and (for swarms) at least one body left. Buffs from the
 * rest of the battlefield (equipment, anthems) are included.
 */
export const getAttackers = (
  permanents: ActivePermanent[],
  currentTurn: number,
): AttackingCreature[] =>
  permanents.flatMap((p) => {
    const { power, toughness } = getEffectiveStats(p, permanents);
    if (power === undefined || power <= 0) return [];
    const keywordText = getEffectiveKeywordText(p, permanents);
    if (hasKeyword(keywordText, 'Defender')) return [];
    if (isSummoningSick(p, currentTurn, permanents)) return [];
    const count = p.counterType === 'swarm' ? p.counters : 1;
    if (count <= 0) return [];
    return [
      {
        instanceId: p.instanceId,
        name: p.name,
        power,
        toughness: toughness ?? 0,
        count,
        isCommander: Boolean(p.isCommander),
        keywords: extractKeywords(keywordText),
      },
    ];
  });

/**
 * Display order for Mowu's battlefield, most urgent to remove first:
 * 1. combo pieces (Archmage: the game ends if they're all there),
 * 2. creatures by total attack (power × bodies, with buffs), then toughness,
 * 3. everything else (equipment, enchantments, artifacts) in cast order.
 * Stable: ties keep their existing order.
 */
export const sortByThreat = (permanents: ActivePermanent[]): ActivePermanent[] => {
  const rank = (p: ActivePermanent) => {
    if (p.comboPiece) return { group: 0, attack: 0, toughness: 0 };
    const { power, toughness } = getEffectiveStats(p, permanents);
    if (power === undefined) return { group: 2, attack: 0, toughness: 0 };
    const bodies = p.counterType === 'swarm' ? p.counters : 1;
    return { group: 1, attack: Math.max(0, power) * bodies, toughness: (toughness ?? 0) * bodies };
  };
  return permanents
    .map((p, index) => ({ p, index, ...rank(p) }))
    .sort((a, b) => a.group - b.group || b.attack - a.attack || b.toughness - a.toughness || a.index - b.index)
    .map(({ p }) => p);
};

/**
 * After Mowu's combat: his attackers without Vigilance (printed or granted)
 * become tapped, so they can't block on the player's turn.
 */
export const tapAttackers = (permanents: ActivePermanent[], attackerIds: string[]): ActivePermanent[] => {
  const attacking = new Set(attackerIds);
  return permanents.map((p) =>
    attacking.has(p.instanceId) && !hasKeyword(getEffectiveKeywordText(p, permanents), 'Vigilance')
      ? { ...p, tapped: true }
      : p,
  );
};

/** Mowu's untap step, at the start of his turn. */
export const untapAll = (permanents: ActivePermanent[]): ActivePermanent[] =>
  permanents.some((p) => p.tapped) ? permanents.map((p) => (p.tapped ? { ...p, tapped: false } : p)) : permanents;

/**
 * May Mowu's turn screen continue on its own (after a short, pausable countdown)?
 * Only when there's nothing for the player to do: an idle turn, or the end-of-turn
 * summary after a turn with no combat (each cast was already shown one by one).
 * Never during casts (the player may counter), combat, or when a combo is close.
 */
export const canAutoContinue = (
  phase: 'event' | 'combat' | 'idle' | 'complete',
  attackerCount: number,
  comboAlert: boolean,
): boolean => !comboAlert && (phase === 'idle' || (phase === 'complete' && attackerCount === 0));

export const totalAttackPower = (attackers: AttackingCreature[]): number =>
  attackers.reduce((sum, a) => sum + a.power * a.count, 0);

/** Power level 1–5 for card bracket ranges. Custom counts as Core (2). */
export const bracketLevel = (bracket: CommanderBracket): number =>
  ({ b1: 1, b2: 2, b3: 3, b4: 4, b5: 5, custom: 2, off: 2 })[bracket];

/**
 * Cards the opponent may cast this turn: within their bracket range, past their
 * minimum turn, and archetype cards only for the Mowus they belong to.
 * Relaxes the turn requirement, then everything, rather than returning nothing.
 */
export const getEligibleCards = (
  cards: EventCardDefinition[],
  turn: number,
  commanderId: string | undefined,
  bracket?: CommanderBracket,
): EventCardDefinition[] => {
  const level = bracket ? bracketLevel(bracket) : undefined;
  const allowedForCommander = cards.filter(
    (c) =>
      (!c.signatureCommanderId || c.signatureCommanderId === commanderId) &&
      (!c.exclusiveTo || (commanderId !== undefined && c.exclusiveTo.includes(commanderId))) &&
      (level === undefined || ((c.minBracket ?? 1) <= level && level <= (c.maxBracket ?? 5))),
  );
  const eligible = allowedForCommander.filter((c) => (c.minTurn ?? 1) <= turn);
  if (eligible.length > 0) return eligible;
  return allowedForCommander.length > 0 ? allowedForCommander : cards;
};

/** Archmage's combo: which pieces are needed at this bracket, and how many are on the battlefield. */
export const getComboStatus = (permanents: ActivePermanent[], bracket: CommanderBracket) => {
  const required: ComboPiece[] = bracket === 'b5' ? ['A', 'B'] : ['A', 'B', 'C'];
  const present = required.filter((piece) => permanents.some((p) => p.comboPiece === piece));
  const missing = required.filter((piece) => !present.includes(piece));
  return {
    required,
    present,
    missing,
    active: present.length > 0,
    oneAway: missing.length === 1,
    assembled: missing.length === 0,
  };
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
    opponentCommander?: { id: string; name: string } | null;
  },
  won: boolean,
  lossReason?: LossReason,
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
  lossReason: won ? undefined : (lossReason ?? 'conceded'),
  commanderId: game.opponentCommander?.id,
  commanderName: game.opponentCommander?.name,
});
