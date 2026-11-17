/**
 * Mowu's turn planner (Phase 3). Pure: no store, no timers; randomness is injected.
 *
 * Every action is casting a real card (ADR-019): the planner only ever returns
 * cards to cast. Growth over time comes from cards and their printed text.
 */
import type { EventCardDefinition, EventCategory } from '@/types/card';
import type { CommanderBracket } from '@/types/game';
import {
  ACTS_EVERY_TURN,
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
}

export interface TurnPlan {
  budget: number;
  plays: EventCardDefinition[];
}

const isLegendary = (c: EventCardDefinition) => /\bLegendary\b/.test(c.typeLine);

/**
 * Decide which cards Mowu casts this turn.
 *
 * - Brackets that act every turn (B2–B5) always cast at least one card: if
 *   nothing fits the budget, the cheapest eligible card is cast anyway.
 * - Other brackets (B1, Custom) only act on their event cadence.
 * - One main play (biased toward spending the mana), then up to EXTRA_PLAYS
 *   cheaper cards with the mana left over.
 */
export const planOpponentTurn = (input: PlanInput, random: () => number): TurnPlan => {
  const budget = getManaBudget(input.turn, input.bracket);
  const actsEveryTurn = ACTS_EVERY_TURN[input.bracket];
  const actsThisTurn =
    actsEveryTurn || isEventTurn(input.turn, getEventFrequency(input.bracket, input.customFrequency));
  if (!actsThisTurn) return { budget, plays: [] };

  const onBattlefield = new Set(input.battlefieldCardIds);
  const eligible = getEligibleCards(input.cards, input.turn, input.commanderId).filter(
    (c) => !(isLegendary(c) && onBattlefield.has(c.id)),
  );
  if (eligible.length === 0) return { budget, plays: [] };

  const recent = new Set(
    input.recentCasts.filter((r) => input.turn - r.turn <= RECENT_TURNS).map((r) => r.cardId),
  );
  const baseWeight = (c: EventCardDefinition) =>
    (input.cardWeights[c.category] ?? 1) * (recent.has(c.id) ? RECENT_CARD_WEIGHT : 1);

  const mv = (c: EventCardDefinition) => getManaValue(c.manaCost);
  const affordable = eligible.filter((c) => mv(c) <= budget);

  let main: EventCardDefinition;
  if (affordable.length > 0) {
    main = pickWeighted(affordable, (c) => baseWeight(c) * (1 + BIG_PLAY_BIAS * mv(c)), random);
  } else if (actsEveryTurn) {
    // Every-turn guarantee: cast the cheapest card even if it's over budget
    const cheapest = Math.min(...eligible.map(mv));
    main = pickWeighted(eligible.filter((c) => mv(c) === cheapest), baseWeight, random);
  } else {
    return { budget, plays: [] };
  }

  const plays = [main];
  let remaining = budget - mv(main);
  const mainOnly = new Set<string>(MAIN_PLAY_ONLY_CATEGORIES);

  for (let i = 0; i < EXTRA_PLAYS[input.bracket]; i++) {
    const chosen = new Set(plays.map((p) => p.id));
    const candidates = eligible.filter(
      (c) =>
        !chosen.has(c.id) &&
        !mainOnly.has(c.category) &&
        mv(c) <= remaining &&
        mv(c) <= Math.max(1, mv(main) - 1), // "cheaper" (1-drops always count)
    );
    if (candidates.length === 0) break;
    const extra = pickWeighted(candidates, baseWeight, random);
    plays.push(extra);
    remaining -= mv(extra);
  }

  return { budget, plays };
};
