import { describe, expect, it } from 'vitest';
import { applyEffects, mergeTokenStacks, undoEffects, type EffectContext } from './effects';
import { TOKENS_BY_ID } from '@/data/archetypeCards';
import type { ActivePermanent } from '@/types/card';

const perm = (overrides: Partial<ActivePermanent> = {}): ActivePermanent => ({
  instanceId: 'p1',
  cardId: 'card',
  name: 'Thing',
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

let n = 0;
const ctx = (overrides: Partial<EffectContext> = {}): EffectContext => ({
  turn: 3,
  enteredOnOpponentTurn: true,
  tokens: TOKENS_BY_ID,
  newId: () => `new-${n++}`,
  ...overrides,
});

describe('applyEffects', () => {
  it("puts counters on Mowu's commander (and does nothing without one)", () => {
    const cmd = perm({ instanceId: 'cmd', name: 'Mecha-Mowu', isCommander: true, counterType: 'plus-one' });
    const r = applyEffects([{ type: 'counters', target: 'commander', amount: 2 }], { permanents: [cmd], playerPoison: 0, playerLife: 40 }, ctx());
    expect(r.permanents[0].counters).toBe(2);
    expect(r.log).toEqual(['Mecha-Mowu gets 2 +1/+1 counters.']);
    const none = applyEffects([{ type: 'counters', target: 'commander', amount: 2 }], { permanents: [perm()], playerPoison: 0, playerLife: 40 }, ctx());
    expect(none.permanents[0].counters).toBe(0);
    expect(none.log).toEqual([]);
  });

  it('adds tax counters to every tax permanent', () => {
    const a = perm({ instanceId: 'a', counterType: 'tax', counters: 1, power: undefined });
    const b = perm({ instanceId: 'b', counterType: 'tax', counters: 2, power: undefined });
    const c = perm({ instanceId: 'c' });
    const r = applyEffects([{ type: 'counters', target: 'tax-permanents', amount: 1 }], { permanents: [a, b, c], playerPoison: 0, playerLife: 40 }, ctx());
    expect(r.permanents.map((p) => p.counters)).toEqual([2, 3, 0]);
  });

  it('creates a token stack, and later tokens the same turn join it', () => {
    const create = { type: 'create-tokens', tokenId: 'token-pup-soldier', count: 2 } as const;
    const first = applyEffects([create], { permanents: [], playerPoison: 0, playerLife: 40 }, ctx());
    expect(first.permanents).toHaveLength(1);
    expect(first.permanents[0]).toMatchObject({ isToken: true, counterType: 'swarm', counters: 2, turnPlayed: 3 });
    const second = applyEffects([create], { permanents: first.permanents, playerPoison: 0, playerLife: 40 }, ctx());
    expect(second.permanents).toHaveLength(1);
    expect(second.permanents[0].counters).toBe(4);
    // A stack from an earlier turn isn't joined (summoning sickness differs)
    const nextTurn = applyEffects([create], { permanents: first.permanents, playerPoison: 0, playerLife: 40 }, ctx({ turn: 4 }));
    expect(nextTurn.permanents).toHaveLength(2);
  });

  it('only "proliferates" poison if the player already has some', () => {
    const effect = { type: 'player-poison', amount: 1, onlyIfPoisoned: true } as const;
    expect(applyEffects([effect], { permanents: [], playerPoison: 0, playerLife: 40 }, ctx()).playerPoison).toBe(0);
    expect(applyEffects([effect], { permanents: [], playerPoison: 3, playerLife: 40 }, ctx()).playerPoison).toBe(4);
    expect(applyEffects([{ type: 'player-poison', amount: 5 }], { permanents: [], playerPoison: 8, playerLife: 40 }, ctx()).playerPoison).toBe(10);
  });

  it('fires a threshold effect only once the source has enough counters', () => {
    const scholar = perm({ instanceId: 's', counterType: 'study', counters: 2 });
    const upkeep = [
      { type: 'counters', target: 'self', amount: 1 },
      { type: 'threshold', threshold: 3, text: 'Lesson!' },
    ] as const;
    const r = applyEffects([...upkeep], { permanents: [scholar], playerPoison: 0, playerLife: 40 }, ctx({ sourceInstanceId: 's' }));
    expect(r.permanents[0].counters).toBe(0);
    expect(r.log).toContain('Lesson!');
    const early = applyEffects([...upkeep], { permanents: [{ ...scholar, counters: 0 }], playerPoison: 0, playerLife: 40 }, ctx({ sourceInstanceId: 's' }));
    expect(early.permanents[0].counters).toBe(1);
    expect(early.log).not.toContain('Lesson!');
  });

  it("changes the player's life", () => {
    const r = applyEffects([{ type: 'player-life', amount: -3 }], { permanents: [], playerPoison: 0, playerLife: 40 }, ctx());
    expect(r.playerLife).toBe(37);
    expect(r.log).toEqual(['You lose 3 life (now 37).']);
  });

  it('records opponent life gain for the store to apply', () => {
    const r = applyEffects([{ type: 'opponent-life', amount: 6 }], { permanents: [], playerPoison: 0, playerLife: 40 }, ctx());
    expect(r.opponentLife).toBe(6);
    expect(r.undo.opponentLife).toBe(6);
  });
});

describe('undoEffects', () => {
  it('reverses tokens, counters and poison exactly', () => {
    const cmd = perm({ instanceId: 'cmd', isCommander: true, counterType: 'plus-one', counters: 1 });
    const start = { permanents: [cmd], playerPoison: 2, playerLife: 40 };
    const r = applyEffects(
      [
        { type: 'counters', target: 'commander', amount: 2 },
        { type: 'create-tokens', tokenId: 'token-toxic-spore', count: 3 },
        { type: 'player-poison', amount: 1, onlyIfPoisoned: true },
        { type: 'player-life', amount: -3 },
      ],
      start,
      ctx(),
    );
    expect(undoEffects(r.undo, r)).toEqual(start);
  });
});

describe('mergeTokenStacks', () => {
  it('merges stacks of the same token into the oldest one, leaving other cards alone', () => {
    const old = perm({ instanceId: 'old', cardId: 'token-pup-soldier', isToken: true, counterType: 'swarm', counters: 2 });
    const fresh = perm({ instanceId: 'fresh', cardId: 'token-pup-soldier', isToken: true, counterType: 'swarm', counters: 3 });
    const other = perm({ instanceId: 'other' });
    // Newest first, as on the battlefield
    const merged = mergeTokenStacks([fresh, other, old]);
    expect(merged.map((p) => [p.instanceId, p.counters])).toEqual([
      ['other', 0],
      ['old', 5],
    ]);
  });
});
