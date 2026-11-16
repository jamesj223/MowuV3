import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

import { useGameStore } from './useGameStore';
import { parseMatch } from './useDeckStore';

const store = () => useGameStore.getState();

describe('useGameStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    store().startNewGame({ startingOpponentHealth: 40, startingPlayerLife: 40, bracket: 'off' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts the killing blow immediately, before the delta badge fades', () => {
    store().applyDamageToOpponent(15);
    store().applyDamageToOpponent(25);
    expect(store().isGameOver).toBe(true);
    expect(store().winReason).toBe('life');
    expect(store().totalDamageDealt).toBe(40);
    expect(store().isDeltaVisible).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(store().isDeltaVisible).toBe(false);
    expect(store().totalDamageDealt).toBe(40);
  });

  it('credits damage to the turn it was dealt, even if the turn ends right after', () => {
    store().applyDamageToOpponent(6);
    store().nextTurn(); // 'off' bracket with no attackers skips straight to turn 2
    expect(store().turn).toBe(2);
    const [t1, t2] = store().turnSnapshots;
    expect(t1).toMatchObject({ turn: 1, damageThisTurn: 6, totalDamage: 6 });
    expect(t2).toMatchObject({ turn: 2, damageThisTurn: 0, totalDamage: 6, opponentHealth: 34 });
  });

  it('prevTurn keeps snapshots and totals consistent', () => {
    store().applyDamageToOpponent(5);
    store().nextTurn();
    store().applyDamageToOpponent(3);
    store().prevTurn();
    expect(store().turn).toBe(1);
    expect(store().turnSnapshots).toHaveLength(1);
    expect(store().turnSnapshots[0]).toMatchObject({ damageThisTurn: 8, totalDamage: 8 });
    store().nextTurn();
    expect(store().turnSnapshots.map((s) => s.turn)).toEqual([1, 2]);
  });

  it('opponent life gain from an event does not erase damage dealt', () => {
    store().applyDamageToOpponent(10);
    store().triggerEvent('suspicious-meat-pie');
    expect(store().opponentHealth).toBe(36);
    expect(store().totalDamageDealt).toBe(10);
    expect(store().eventsTriggered).toBe(1);
  });

  it('rolling back the winning hit un-wins the game', () => {
    store().applyDamageToOpponent(40);
    expect(store().isGameOver).toBe(true);
    store().applyOpponentHealthChange(1);
    expect(store().isGameOver).toBe(false);
    expect(store().totalDamageDealt).toBe(39);
  });

  it('places swarm and +1/+1 counters from card definitions', () => {
    store().triggerEvent('toxic-mosquito-swarm');
    store().triggerEvent('tax-collector-mowu');
    const [mowu, swarm] = store().activePermanents;
    expect(swarm).toMatchObject({ counterType: 'swarm', counters: 1 });
    expect(mowu).toMatchObject({ counterType: 'plus-one', counters: 0 });
  });

  it('resetGame starts from the configured starting totals', () => {
    store().applyDamageToOpponent(10);
    store().nextTurn();
    store().resetGame();
    expect(store()).toMatchObject({ turn: 1, opponentHealth: 40, totalDamageDealt: 0, eventsTriggered: 0 });
  });
});

describe('parseMatch', () => {
  const valid = {
    id: 'm1',
    deckName: 'Deck',
    turns: 7,
    startingHealth: 120,
    finalHealth: 0,
    damageDealt: 125,
    bracket: 'b2',
    timestamp: '2026-01-01T00:00:00.000Z',
    eventCount: 2,
    won: true,
    winReason: 'life',
  };

  it('accepts a valid record', () => {
    expect(parseMatch(valid)).toEqual(valid);
  });

  it('rejects malformed records', () => {
    expect(parseMatch({ ...valid, turns: '7' })).toBeNull();
    expect(parseMatch({ ...valid, bracket: 'b9' })).toBeNull();
    expect(parseMatch({ ...valid, timestamp: 'yesterday' })).toBeNull();
    expect(parseMatch(null)).toBeNull();
  });

  it('defaults older records without a won flag to wins', () => {
    const { won: _won, ...legacy } = valid;
    expect(parseMatch(legacy)?.won).toBe(true);
  });
});
