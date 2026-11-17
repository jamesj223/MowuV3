/**
 * Mowu's turn planner (Phase 3). Pure: no store, no timers; randomness is injected.
 *
 * Every action is casting a real card (ADR-019): the planner only ever returns
 * cards to cast. Growth over time comes from cards and their printed text.
 */
import type { CardRequirement, EventCardDefinition, EventCategory } from '@/types/card';
import type { CommanderBracket } from '@/types/game';
import {
  ACTS_EVERY_TURN,
  ARCHETYPE_CARD_WEIGHT,
  BIG_PLAY_BIAS,
  EXTRA_PLAYS,
  MAIN_PLAY_ONLY_CATEGORIES,
  MANA_BUDGET_CAP,
  RECENT_CARD_WEIGHT,
  RECENT_TURNS,
  rampFor,
} from '@/data/tuning';
import { getEligibleCards, getEventFrequency, isEventTurn, pickWeighted } from './game';

/**
 * Mana value of a mana cost string, per MTG rules: {3} counts 3, {X} counts 0,
 * a hybrid like {2/W} counts its largest part (2), every other symbol counts 1.
 */
export const getManaValue = (manaCost: string): number => {
  let total = 0;
  for (const [, symbol] of manaCost.matchAll(/\{([^}]+)\}/g)) {
    if (symbol.toUpperCase() === 'X') continue;
    const numbers = symbol.split('/').filter((part) => /^\d+$/.test(part)).map(Number);
    total += numbers.length > 0 ? Math.max(1, ...numbers) : 1;
  }
  return total;
};

/** MTG commander tax: {2} more for each previous cast from the command zone. */
export const COMMANDER_TAX = 2;

/** What Mowu's commander costs to cast right now. */
export const getCommanderCost = (commanderCard: EventCardDefinition, timesCast: number): number =>
  getManaValue(commanderCard.manaCost) + COMMANDER_TAX * timesCast;

/** Mowu's mana for the turn: turn number plus bracket ramp, capped. */
export const getManaBudget = (turn: number, bracket: CommanderBracket): number =>
  Math.min(MANA_BUDGET_CAP, Math.max(0, turn + rampFor(bracket, turn)));

export interface PlanInput {
  turn: number;
  bracket: CommanderBracket;
  customFrequency: number;
  commanderId?: string;
  cardWeights: Partial<Record<EventCategory, number>>;
  /** Card ids currently on Mowu's battlefield (legendary cards aren't cast twice). */
  battlefieldCardIds: string[];
  /** Cards Mowu cast recently, with the turn they were cast. */
  recentCasts: { cardId: string; turn: number }[];
  cards: EventCardDefinition[];
  /** Facts about the board, for card requirements (e.g. no pump spell without a commander). */
  board?: Partial<Record<CardRequirement, boolean>>;
  /** Mowu's commander, if he has one. Cast from the command zone when affordable. */
  commander?: {
    card: EventCardDefinition;
    onBattlefield: boolean;
    timesCast: number;
  };
}

export interface TurnPlan {
  budget: number;
  plays: EventCardDefinition[];
}

const isLegendary = (c: EventCardDefinition) => /\bLegendary\b/.test(c.typeLine);

/**
 * Mowu doesn't cast a second copy of a legendary card, or of a non-creature
 * permanent (equipment, enchantment, artifact) he already controls: four Laser
 * Collars is silly. Duplicate creatures are fine.
 */
const isRedundantCopy = (c: EventCardDefinition, onBattlefield: Set<string>) =>
  onBattlefield.has(c.id) && (isLegendary(c) || (c.isPermanent && !/\bCreature\b/.test(c.typeLine)));

/**
 * Decide which cards Mowu casts this turn.
 *
 * - Brackets that act every turn (B2–B5) always cast at least one card: if
 *   nothing fits the budget, the cheapest eligible card is cast anyway.
 * - Other brackets (B1, Custom) only act on their event cadence.
 * - If Mowu's commander is in the command zone and he can afford it (including
 *   commander tax), casting it is the turn's main play.
 * - Otherwise one main play (biased toward spending the mana).
 * - Then up to EXTRA_PLAYS cheaper cards with the mana left over.
 */
export const planOpponentTurn = (input: PlanInput, random: () => number): TurnPlan => {
  const budget = getManaBudget(input.turn, input.bracket);
  const actsEveryTurn = ACTS_EVERY_TURN[input.bracket];
  const actsThisTurn =
    actsEveryTurn || isEventTurn(input.turn, getEventFrequency(input.bracket, input.customFrequency));
  if (!actsThisTurn) return { budget, plays: [] };

  const onBattlefield = new Set(input.battlefieldCardIds);
  const board = {
    ...input.board,
    'commander-on-battlefield': input.board?.['commander-on-battlefield'] ?? Boolean(input.commander?.onBattlefield),
  };
  const eligible = getEligibleCards(input.cards, input.turn, input.commanderId, input.bracket).filter(
    (c) =>
      !isRedundantCopy(c, onBattlefield) &&
      (c.requires ?? []).every((req) => board[req]),
  );
  if (eligible.length === 0) return { budget, plays: [] };

  const recent = new Set(
    input.recentCasts.filter((r) => input.turn - r.turn <= RECENT_TURNS).map((r) => r.cardId),
  );
  const baseWeight = (c: EventCardDefinition) =>
    (input.cardWeights[c.category] ?? 1) *
    (recent.has(c.id) ? RECENT_CARD_WEIGHT : 1) *
    (c.exclusiveTo?.includes(input.commanderId ?? '') ? ARCHETYPE_CARD_WEIGHT : 1);

  const mv = (c: EventCardDefinition) => getManaValue(c.manaCost);
  const affordable = eligible.filter((c) => mv(c) <= budget);

  const commander = input.commander;
  const commanderCost = commander ? getCommanderCost(commander.card, commander.timesCast) : Infinity;

  let main: EventCardDefinition;
  let mainCost: number;
  if (commander && !commander.onBattlefield && commanderCost <= budget) {
    main = commander.card;
    mainCost = commanderCost;
  } else if (affordable.length > 0) {
    main = pickWeighted(affordable, (c) => baseWeight(c) * (1 + BIG_PLAY_BIAS * mv(c)), random);
    mainCost = mv(main);
  } else if (actsEveryTurn) {
    // Every-turn guarantee: cast the cheapest card even if it's over budget
    // (never the commander: his tax is a real cost)
    const cheapest = Math.min(...eligible.map(mv));
    main = pickWeighted(eligible.filter((c) => mv(c) === cheapest), baseWeight, random);
    mainCost = mv(main);
  } else {
    return { budget, plays: [] };
  }

  const plays = [main];
  let remaining = budget - mainCost;
  const mainOnly = new Set<string>(MAIN_PLAY_ONLY_CATEGORIES);

  for (let i = 0; i < EXTRA_PLAYS[input.bracket]; i++) {
    const chosen = new Set(plays.map((p) => p.id));
    const candidates = eligible.filter(
      (c) =>
        !chosen.has(c.id) &&
        !mainOnly.has(c.category) &&
        mv(c) <= remaining &&
        mv(c) <= Math.max(1, mainCost - 1), // "cheaper" (1-drops always count)
    );
    if (candidates.length === 0) break;
    const extra = pickWeighted(candidates, baseWeight, random);
    plays.push(extra);
    remaining -= mv(extra);
  }

  return { budget, plays };
};
