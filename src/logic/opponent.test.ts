import { describe, expect, it } from 'vitest';
import { COMMANDER_TAX, getCommanderCost, getManaBudget, getManaValue, planOpponentTurn, type PlanInput } from './opponent';
import { EVENT_CARDS } from '@/data/cards';
import { MOWU_COMMANDERS } from '@/data/commanders';
import { EXTRA_PLAYS, MANA_BUDGET_CAP } from '@/data/tuning';
import type { EventCardDefinition } from '@/types/card';
import type { CommanderBracket } from '@/types/game';

/** Small deterministic PRNG (mulberry32) so tests are repeatable. */
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const input = (overrides: Partial<PlanInput> = {}): PlanInput => ({
  turn: 3,
  bracket: 'b2',
  customFrequency: 4,
  commanderId: undefined,
  cardWeights: {},
  battlefieldCardIds: [],
  recentCasts: [],
  cards: EVENT_CARDS,
  ...overrides,
});

const card = (id: string, manaCost: string, overrides: Partial<EventCardDefinition> = {}): EventCardDefinition => ({
  id,
  name: id,
  manaCost,
  typeLine: 'Sorcery',
  artFile: 'x.png',
  category: 'disruption',
  isPermanent: false,
  templateText: '',
  computeStats: () => ({ renderedText: id }),
  ...overrides,
});

const mv = getManaValue;

describe('getManaValue', () => {
  it('follows MTG mana value rules', () => {
    expect(mv('{2}{W}{W}')).toBe(4);
    expect(mv('{X}{R}')).toBe(1);
    expect(mv('{1}')).toBe(1);
    expect(mv('{2/W}{G}')).toBe(3);
    expect(mv('{U/P}')).toBe(1);
    expect(mv('')).toBe(0);
  });

  it('gives every existing card a mana value', () => {
    for (const c of EVENT_CARDS) expect(mv(c.manaCost), c.id).toBeGreaterThan(0);
  });
});

describe('getManaBudget', () => {
  it('is the turn number plus bracket ramp, capped', () => {
    expect(getManaBudget(3, 'b2')).toBe(3);
    expect(getManaBudget(3, 'b3')).toBe(4);
    expect(getManaBudget(1, 'b5')).toBe(3);
    expect(getManaBudget(50, 'b5')).toBe(MANA_BUDGET_CAP);
  });

  it('never decreases as brackets go up', () => {
    const order: CommanderBracket[] = ['b1', 'b2', 'b3', 'b4', 'b5'];
    for (let turn = 1; turn <= 12; turn++) {
      const budgets = order.map((b) => getManaBudget(turn, b));
      expect([...budgets].sort((a, b) => a - b)).toEqual(budgets);
    }
  });
});

describe('planOpponentTurn', () => {
  const everyTurnBrackets: CommanderBracket[] = ['b2', 'b3', 'b4', 'b5'];

  it('casts at least one card every turn in B2–B5 (ADR-018), for every commander', () => {
    for (const bracket of everyTurnBrackets) {
      for (const commander of MOWU_COMMANDERS.filter((c) => c.brackets.includes(bracket))) {
        for (let turn = 1; turn <= 15; turn++) {
          for (let seed = 1; seed <= 10; seed++) {
            const plan = planOpponentTurn(
              input({ turn, bracket, commanderId: commander.id, cardWeights: commander.cardWeights }),
              seeded(seed * 1000 + turn),
            );
            expect(plan.plays.length, `${bracket} ${commander.id} t${turn}`).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('only acts on cadence turns in B1 and Custom', () => {
    for (let turn = 1; turn <= 12; turn++) {
      const b1 = planOpponentTurn(input({ turn, bracket: 'b1' }), seeded(turn));
      expect(b1.plays.length > 0, `b1 t${turn}`).toBe(turn % 6 === 0);
      const custom = planOpponentTurn(input({ turn, bracket: 'custom', customFrequency: 3 }), seeded(turn));
      expect(custom.plays.length > 0, `custom t${turn}`).toBe(turn % 3 === 0);
    }
    expect(planOpponentTurn(input({ turn: 6, bracket: 'off' }), seeded(1)).plays).toEqual([]);
  });

  it('stays within budget, respects the extra-play limit, and never repeats a card in one turn', () => {
    for (const bracket of everyTurnBrackets) {
      for (let turn = 1; turn <= 12; turn++) {
        for (let seed = 1; seed <= 20; seed++) {
          const plan = planOpponentTurn(input({ turn, bracket }), seeded(seed));
          const spent = plan.plays.reduce((sum, c) => sum + mv(c.manaCost), 0);
          if (plan.plays.length > 1 || mv(plan.plays[0].manaCost) <= plan.budget) {
            expect(spent).toBeLessThanOrEqual(plan.budget);
          }
          expect(plan.plays.length).toBeLessThanOrEqual(1 + EXTRA_PLAYS[bracket]);
          expect(new Set(plan.plays.map((c) => c.id)).size).toBe(plan.plays.length);
        }
      }
    }
  });

  it('makes extras cheaper than the main play and never a board wipe', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const plan = planOpponentTurn(input({ turn: 8, bracket: 'b5' }), seeded(seed));
      const [main, ...extras] = plan.plays;
      for (const extra of extras) {
        expect(mv(extra.manaCost)).toBeLessThanOrEqual(Math.max(1, mv(main.manaCost) - 1));
        expect(extra.category).not.toBe('board_wipe');
      }
    }
  });

  it('B2 makes exactly one play; higher brackets sometimes make more', () => {
    const counts = (bracket: CommanderBracket) =>
      Array.from({ length: 100 }, (_, i) => planOpponentTurn(input({ turn: 7, bracket }), seeded(i)).plays.length);
    expect(new Set(counts('b2'))).toEqual(new Set([1]));
    expect(Math.max(...counts('b5'))).toBeGreaterThan(1);
  });

  it('casts the cheapest card when nothing fits the budget (every-turn guarantee)', () => {
    const cards = [card('big', '{5}'), card('medium', '{3}')];
    const plan = planOpponentTurn(input({ turn: 1, bracket: 'b2', cards }), seeded(1));
    expect(plan.plays.map((c) => c.id)).toEqual(['medium']);
  });

  it("doesn't cast a legendary card that's already on the battlefield", () => {
    const legend = card('legend', '{1}', { typeLine: 'Legendary Creature', isPermanent: true });
    const filler = card('filler', '{1}');
    for (let seed = 1; seed <= 50; seed++) {
      const plan = planOpponentTurn(
        input({ bracket: 'b2', cards: [legend, filler], battlefieldCardIds: ['legend'] }),
        seeded(seed),
      );
      expect(plan.plays.map((c) => c.id)).toEqual(['filler']);
    }
  });

  it('makes recently cast cards less likely', () => {
    const a = card('a', '{1}');
    const b = card('b', '{1}');
    const picks = Array.from({ length: 400 }, (_, i) =>
      planOpponentTurn(input({ bracket: 'b2', cards: [a, b], recentCasts: [{ cardId: 'a', turn: 2 }] }), seeded(i))
        .plays[0].id,
    );
    const aShare = picks.filter((id) => id === 'a').length / picks.length;
    expect(aShare).toBeLessThan(0.35);
  });

  describe('commander', () => {
    const cmd = card('cmd', '{2}{G}', { typeLine: 'Legendary Creature', isPermanent: true });
    const filler = card('filler', '{1}');

    it('costs its mana value plus {2} per previous cast', () => {
      expect(getCommanderCost(cmd, 0)).toBe(3);
      expect(getCommanderCost(cmd, 2)).toBe(3 + 2 * COMMANDER_TAX);
    });

    it('is cast as the main play when it is in the command zone and affordable', () => {
      for (let seed = 1; seed <= 30; seed++) {
        const plan = planOpponentTurn(
          input({ turn: 3, bracket: 'b2', cards: [filler], commander: { card: cmd, onBattlefield: false, timesCast: 0 } }),
          seeded(seed),
        );
        expect(plan.plays.map((c) => c.id)).toEqual(['cmd']);
      }
    });

    it('is not cast while on the battlefield', () => {
      const plan = planOpponentTurn(
        input({ turn: 5, bracket: 'b2', cards: [filler], commander: { card: cmd, onBattlefield: true, timesCast: 1 } }),
        seeded(1),
      );
      expect(plan.plays.map((c) => c.id)).toEqual(['filler']);
    });

    it('waits until Mowu can pay the commander tax (and never uses it as the every-turn fallback)', () => {
      const withTax = { card: cmd, onBattlefield: false, timesCast: 1 }; // costs 5
      expect(planOpponentTurn(input({ turn: 4, bracket: 'b2', cards: [filler], commander: withTax }), seeded(1)).plays.map((c) => c.id)).toEqual(['filler']);
      expect(planOpponentTurn(input({ turn: 5, bracket: 'b2', cards: [filler], commander: withTax }), seeded(1)).plays.map((c) => c.id)).toEqual(['cmd']);
      const pricey = card('pricey', '{9}');
      const plan = planOpponentTurn(input({ turn: 1, bracket: 'b2', cards: [pricey], commander: withTax }), seeded(1));
      expect(plan.plays.map((c) => c.id)).toEqual(['pricey']);
    });

    it('leaves the rest of the mana for cheaper extras at higher brackets', () => {
      const plan = planOpponentTurn(
        input({ turn: 4, bracket: 'b5', cards: [filler], commander: { card: cmd, onBattlefield: false, timesCast: 0 } }),
        seeded(1),
      );
      expect(plan.plays.map((c) => c.id)).toEqual(['cmd', 'filler']);
    });
  });

  describe('requirements and archetype preference', () => {
    it("skips cards whose requirements aren't met", () => {
      const pump = card('pump', '{1}', { requires: ['commander-on-battlefield'] });
      const filler = card('filler', '{1}');
      for (let seed = 1; seed <= 30; seed++) {
        const plan = planOpponentTurn(input({ bracket: 'b2', cards: [pump, filler] }), seeded(seed));
        expect(plan.plays.map((c) => c.id)).toEqual(['filler']);
      }
      const withBoard = planOpponentTurn(
        input({ bracket: 'b2', cards: [pump], board: { 'commander-on-battlefield': true } }),
        seeded(1),
      );
      expect(withBoard.plays.map((c) => c.id)).toEqual(['pump']);
    });

    it("doesn't cast a second copy of an equipment/enchantment he controls, but will of a creature", () => {
      const collar = card('collar', '{1}', { typeLine: 'Artifact — Equipment', isPermanent: true });
      const rat = card('rat', '{1}', { typeLine: 'Creature — Rat', isPermanent: true });
      for (let seed = 1; seed <= 30; seed++) {
        const plan = planOpponentTurn(
          input({ bracket: 'b2', cards: [collar, rat], battlefieldCardIds: ['collar', 'rat'] }),
          seeded(seed),
        );
        expect(plan.plays.map((c) => c.id)).toEqual(['rat']);
      }
    });

    it("favours the commander's own archetype cards", () => {
      const own = card('own', '{1}', { exclusiveTo: ['mecha'] });
      const generic = card('generic', '{1}');
      const picks = Array.from({ length: 400 }, (_, i) =>
        planOpponentTurn(input({ bracket: 'b2', commanderId: 'mecha', cards: [own, generic] }), seeded(i)).plays[0].id,
      );
      expect(picks.filter((id) => id === 'own').length / picks.length).toBeGreaterThan(0.65);
    });
  });
});
