import { describe, expect, it } from 'vitest';
import {
  applyHealthChange,
  buildMatchRecord,
  checkVictory,
  createSnapshot,
  extractKeywords,
  getAttackers,
  getEffectiveStats,
  getEligibleCards,
  getPaceVerdict,
  getEventFrequency,
  hasKeyword,
  isEventTurn,
  pickWeightedCard,
  rewindSnapshots,
  totalAttackPower,
} from './game';
import { EVENT_CARDS } from '@/data/cards';
import type { ActivePermanent } from '@/types/card';
import { COMMANDER_BRACKETS, type CommanderBracket } from '@/types/game';

const perm = (overrides: Partial<ActivePermanent> = {}): ActivePermanent => ({
  instanceId: 'p1',
  cardId: 'test',
  name: 'Test Creature',
  manaCost: '{1}',
  typeLine: 'Creature',
  artFile: 'x.png',
  renderedText: '',
  power: 2,
  toughness: 2,
  counters: 0,
  turnPlayed: 1,
  ...overrides,
});

describe('keywords', () => {
  it('matches whole words only, case-insensitively', () => {
    expect(hasKeyword('Haste, Flying', 'haste')).toBe(true);
    expect(hasKeyword('Breach the walls', 'Reach')).toBe(false);
    expect(hasKeyword('First  Strike', 'First Strike')).toBe(true);
  });

  it('extracts the listed keywords in canonical order', () => {
    expect(extractKeywords('Haste, Trample, Vigilance.\nAttacks each combat.')).toBe('Haste, Trample, Vigilance');
  });
});

describe('checkVictory', () => {
  it('wins on life', () => {
    expect(checkVictory(0, [0, 0, 0], [0, 0, 0], false, false)).toEqual({ isWon: true, reason: 'life' });
  });

  it('only wins on poison when tracked and all three opponents are lethal', () => {
    expect(checkVictory(50, [10, 10, 10], [0, 0, 0], false, false).isWon).toBe(false);
    expect(checkVictory(50, [10, 10, 9], [0, 0, 0], true, false).isWon).toBe(false);
    expect(checkVictory(50, [10, 10, 10], [0, 0, 0], true, false)).toEqual({ isWon: true, reason: 'poison' });
  });

  it('wins on commander damage when tracked', () => {
    expect(checkVictory(50, [0, 0, 0], [21, 21, 21], false, true)).toEqual({
      isWon: true,
      reason: 'commander_damage',
    });
  });
});

describe('event cadence', () => {
  it('uses the bracket frequency, or the custom one', () => {
    expect(getEventFrequency('b2', 9)).toBe(4);
    expect(getEventFrequency('custom', 9)).toBe(9);
    expect(getEventFrequency('off', 9)).toBe(0);
  });

  it('fires on multiples of the frequency and never when off', () => {
    expect(isEventTurn(4, 4)).toBe(true);
    expect(isEventTurn(5, 4)).toBe(false);
    expect(isEventTurn(4, 0)).toBe(false);
  });
});

describe('getEffectiveStats', () => {
  it('adds +1/+1 counters', () => {
    expect(getEffectiveStats(perm({ counters: 2, counterType: 'plus-one' }))).toEqual({ power: 4, toughness: 4 });
  });

  it('leaves swarm and counter-less permanents alone', () => {
    expect(getEffectiveStats(perm({ counters: 3, counterType: 'swarm' }))).toEqual({ power: 2, toughness: 2 });
    expect(getEffectiveStats(perm({ counters: 3 }))).toEqual({ power: 2, toughness: 2 });
  });
});

describe('getAttackers', () => {
  it('excludes defenders and zero-power creatures', () => {
    const attackers = getAttackers(
      [
        perm({ instanceId: 'a' }),
        perm({ instanceId: 'b', renderedText: 'Defender, Reach.' }),
        perm({ instanceId: 'c', power: 0 }),
        perm({ instanceId: 'd', power: undefined, toughness: undefined }),
      ],
      5,
    );
    expect(attackers.map((a) => a.instanceId)).toEqual(['a']);
  });

  it('applies summoning sickness to non-haste creatures cast this opponent turn', () => {
    const sick = perm({ instanceId: 'sick', turnPlayed: 3, enteredOnOpponentTurn: true });
    const hasty = perm({ instanceId: 'hasty', turnPlayed: 3, enteredOnOpponentTurn: true, renderedText: 'Haste' });
    const castOnPlayerTurn = perm({ instanceId: 'early', turnPlayed: 3, enteredOnOpponentTurn: false });
    expect(getAttackers([sick, hasty, castOnPlayerTurn], 3).map((a) => a.instanceId)).toEqual(['hasty', 'early']);
    // Next turn it can attack
    expect(getAttackers([sick], 4)).toHaveLength(1);
  });

  it('pumps power with +1/+1 counters and multiplies swarms', () => {
    const attackers = getAttackers(
      [
        perm({ instanceId: 'mowu', power: 3, toughness: 3, counters: 2, counterType: 'plus-one' }),
        perm({ instanceId: 'bugs', power: 1, toughness: 1, counters: 3, counterType: 'swarm' }),
        perm({ instanceId: 'empty', power: 1, toughness: 1, counters: 0, counterType: 'swarm' }),
      ],
      5,
    );
    expect(attackers.map((a) => [a.instanceId, a.power, a.count])).toEqual([
      ['mowu', 5, 1],
      ['bugs', 1, 3],
    ]);
    expect(totalAttackPower(attackers)).toBe(8);
  });
});

describe('pickWeightedCard', () => {
  const cards = EVENT_CARDS.slice(0, 3);

  it('respects weights', () => {
    const weights = { [cards[0].category]: 0, [cards[1].category]: 0, [cards[2].category]: 1 };
    // Guard against category collisions in the sample
    if (new Set(cards.map((c) => c.category)).size === 3) {
      expect(pickWeightedCard(cards, weights, () => 0).id).toBe(cards[2].id);
      expect(pickWeightedCard(cards, weights, () => 0.999).id).toBe(cards[2].id);
    }
  });

  it('falls back to uniform when all weights are zero', () => {
    const weights = Object.fromEntries(cards.map((c) => [c.category, 0]));
    expect(pickWeightedCard(cards, weights, () => 0).id).toBe(cards[0].id);
  });
});

describe('getPaceVerdict', () => {
  it('treats winning on or before the official minimum turn as too fast', () => {
    // Bracket 3: "at least six turns", so turn 7 is the first satisfying end
    expect(getPaceVerdict(6, 'b3')).toBe('faster');
    expect(getPaceVerdict(7, 'b3')).toBe('within');
    expect(getPaceVerdict(9, 'b1')).toBe('faster');
    expect(getPaceVerdict(10, 'b1')).toBe('within');
  });

  it('has no verdict for cEDH, custom or solitaire', () => {
    expect(getPaceVerdict(2, 'b5')).toBe('none');
    expect(getPaceVerdict(2, 'custom')).toBe('none');
    expect(getPaceVerdict(2, 'off')).toBe('none');
  });
});

describe('official bracket data', () => {
  it('matches the Oct 2025 turn expectations', () => {
    expect(Object.fromEntries(Object.values(COMMANDER_BRACKETS).map((b) => [b.id, b.minTurns]))).toEqual({
      b1: 9, b2: 8, b3: 6, b4: 4, b5: null, custom: null, off: null,
    });
  });

  it('no longer ties Core (or any bracket) to precons', () => {
    for (const b of Object.values(COMMANDER_BRACKETS)) {
      expect(`${b.name} ${b.description}`.toLowerCase()).not.toContain('precon');
    }
  });
});

describe('getEligibleCards', () => {
  const tax = EVENT_CARDS.find((c) => c.id === 'tax-collector-mowu')!;

  it('only lets a signature card appear for its own commander', () => {
    expect(tax.signatureCommanderId).toBe('tax-collector');
    expect(getEligibleCards(EVENT_CARDS, 10, 'mecha')).not.toContain(tax);
    expect(getEligibleCards(EVENT_CARDS, 10, undefined)).not.toContain(tax);
    expect(getEligibleCards(EVENT_CARDS, 10, 'tax-collector')).toContain(tax);
  });

  it('respects minimum turns', () => {
    expect(getEligibleCards(EVENT_CARDS, 1, undefined).every((c) => (c.minTurn ?? 1) <= 1)).toBe(true);
  });

  it('falls back instead of returning nothing', () => {
    expect(getEligibleCards([tax], 1, 'mecha')).toEqual([tax]);
    expect(getEligibleCards([tax], 1, 'tax-collector')).toEqual([tax]);
  });
});

describe('applyHealthChange', () => {
  const base = () => ({
    opponentHealth: 100,
    totalDamageDealt: 20,
    turn: 3,
    turnSnapshots: [createSnapshot(2, 120, 0, 0), { ...createSnapshot(3, 100, 20, 0), damageThisTurn: 0 }],
  });

  it('records damage immediately on the current turn', () => {
    const r = applyHealthChange(base(), -7, 'player');
    expect(r.opponentHealth).toBe(93);
    expect(r.totalDamageDealt).toBe(27);
    expect(r.turnSnapshots[1]).toMatchObject({ turn: 3, damageThisTurn: 7, totalDamage: 27 });
    expect(r.appliedDelta).toBe(-7);
  });

  it('a player rollback undoes at most this turn’s damage', () => {
    const afterHit = { ...base(), ...applyHealthChange(base(), -5, 'player') };
    const r = applyHealthChange(afterHit, 8, 'player');
    expect(r.opponentHealth).toBe(103);
    expect(r.totalDamageDealt).toBe(20);
    expect(r.turnSnapshots[1].damageThisTurn).toBe(0);
  });

  it('opponent card life gain never erases damage stats', () => {
    const afterHit = { ...base(), ...applyHealthChange(base(), -5, 'player') };
    const r = applyHealthChange(afterHit, 6, 'card');
    expect(r.opponentHealth).toBe(101);
    expect(r.totalDamageDealt).toBe(25);
    expect(r.turnSnapshots[1].damageThisTurn).toBe(5);
  });

  it('clamps at zero and counts only the damage actually dealt', () => {
    const r = applyHealthChange({ ...base(), opponentHealth: 3 }, -10, 'player');
    expect(r.opponentHealth).toBe(0);
    expect(r.appliedDelta).toBe(-3);
    expect(r.totalDamageDealt).toBe(23);
  });
});

describe('rewindSnapshots', () => {
  it('drops the current turn and folds its damage into the previous one', () => {
    const snaps = [
      { ...createSnapshot(1, 120, 0, 0), damageThisTurn: 10, totalDamage: 10 },
      { ...createSnapshot(2, 110, 10, 0), damageThisTurn: 4, totalDamage: 14 },
    ];
    expect(rewindSnapshots(snaps, 2)).toEqual([{ ...snaps[0], damageThisTurn: 14, totalDamage: 14 }]);
  });

  it('never removes the first snapshot', () => {
    const snaps = [createSnapshot(1, 120, 0, 0)];
    expect(rewindSnapshots(snaps, 1)).toBe(snaps);
  });
});

describe('buildMatchRecord', () => {
  const game = {
    currentDeckName: '',
    turn: 7,
    startingOpponentHealth: 120,
    opponentHealth: 0,
    totalDamageDealt: 130,
    bracket: 'b3' as const,
    winReason: 'life' as const,
    eventsTriggered: 3,
  };

  it('records wins with a reason', () => {
    expect(buildMatchRecord(game, true)).toMatchObject({ deckName: 'Unnamed Deck', won: true, winReason: 'life', eventCount: 3 });
  });

  it('records losses without a win reason', () => {
    expect(buildMatchRecord(game, false)).toMatchObject({ won: false, winReason: undefined });
  });
});

describe('card data', () => {
  it('has unique ids', () => {
    const ids = EVENT_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only marks permanents as creatures when they stay on the battlefield', () => {
    for (const card of EVENT_CARDS) {
      if (/^(Legendary )?Creature\b/.test(card.typeLine)) expect(card.isPermanent, card.id).toBe(true);
    }
  });

  it('computes stats for every bracket and turn without throwing', () => {
    for (const card of EVENT_CARDS) {
      for (const bracket of Object.keys(COMMANDER_BRACKETS) as CommanderBracket[]) {
        for (const turn of [1, 5, 12]) {
          const stats = card.computeStats(turn, bracket);
          expect(stats.renderedText.length, card.id).toBeGreaterThan(0);
        }
      }
    }
  });
});
