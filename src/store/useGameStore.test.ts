import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

import { useGameStore } from './useGameStore';
import { parseMatch } from './useDeckStore';
import { getCommanderCard } from '@/data/commanderCards';
import { getManaValue } from '@/logic/opponent';

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

describe('opponent turns (Phase 3 engine)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  /** Play through a whole opponent turn by pressing "continue" until it's the player's turn again. */
  const finishOpponentTurn = () => {
    for (let i = 0; i < 10 && store().turnPhase === 'opponent'; i++) store().advanceOpponentPhase();
  };

  it('Mowu casts at least one card on every opponent turn in B2', () => {
    store().startNewGame({ startingOpponentHealth: 999, bracket: 'b2' });
    for (let t = 1; t <= 10; t++) {
      store().nextTurn();
      expect(store().opponentTurnState?.casts.length, `turn ${t}`).toBeGreaterThan(0);
      finishOpponentTurn();
      expect(store().turn).toBe(t + 1);
    }
  });

  it('casts every planned card in order, then moves on (never "idle" after casting)', () => {
    store().startNewGame({ startingOpponentHealth: 999, bracket: 'b5' });
    let sawMultiple = false;
    for (let t = 1; t <= 8; t++) {
      store().nextTurn();
      const planned = store().opponentTurnState!.plannedCardIds;
      while (store().opponentTurnState?.phase === 'event') store().advanceOpponentPhase();
      const turnState = store().opponentTurnState!;
      expect(turnState.casts.map((c) => c.cardId)).toEqual(planned);
      expect(['combat', 'complete']).toContain(turnState.phase);
      if (planned.length > 1) sawMultiple = true;
      finishOpponentTurn();
    }
    expect(sawMultiple).toBe(true);
  });

  it('countering a life-gain spell undoes the life gain and keeps damage stats', () => {
    store().startNewGame({ startingOpponentHealth: 100, bracket: 'b2' });
    store().applyDamageToOpponent(10);
    useGameStore.setState({
      turnPhase: 'opponent',
      opponentTurnState: {
        phase: 'event', hasEvent: true, attackers: [], idleText: null, eventTriggered: false,
        manaBudget: 1, plannedCardIds: [], casts: [],
      },
    });
    store().triggerEvent('suspicious-meat-pie');
    expect(store().opponentHealth).toBe(96);
    store().counterCurrentCard();
    expect(store().opponentHealth).toBe(90);
    expect(store().totalDamageDealt).toBe(10);
    expect(store().eventHistory).toHaveLength(0);
  });

  it('a countered permanent never enters the battlefield and is marked in the turn log', () => {
    store().startNewGame({ startingOpponentHealth: 999, bracket: 'b2' });
    // Find a turn where Mowu casts a permanent, then counter it
    for (let t = 1; t <= 20; t++) {
      store().nextTurn();
      const card = store().currentDrawnCard;
      if (card && 'counters' in card) {
        const id = card.instanceId;
        store().counterCurrentCard();
        expect(store().activePermanents.some((p) => p.instanceId === id)).toBe(false);
        expect(store().opponentTurnState?.casts.find((c) => c.instanceId === id)?.countered).toBe(true);
        return;
      }
      finishOpponentTurn();
    }
    throw new Error('Mowu never cast a permanent in 20 turns');
  });
});

describe('commander zone', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const finishOpponentTurn = () => {
    for (let i = 0; i < 10 && store().turnPhase === 'opponent'; i++) store().advanceOpponentPhase();
  };
  const commanderOnBattlefield = () => store().activePermanents.find((p) => p.isCommander);

  it('Mowu casts his commander once affordable, and recasts it with tax after it is destroyed', () => {
    store().startNewGame({ startingOpponentHealth: 999, bracket: 'b2' });
    const commander = store().opponentCommander!;
    const card = getCommanderCard(commander.id)!;

    let t = 0;
    while (!commanderOnBattlefield() && t++ < 10) {
      store().nextTurn();
      finishOpponentTurn();
    }
    expect(commanderOnBattlefield()?.cardId).toBe(card.id);
    expect(store().commanderTimesCast).toBe(1);
    expect(store().turn - 1).toBe(Math.max(1, getManaValue(card.manaCost)));

    // Destroy it: back to the command zone; next cast costs {2} more
    store().dismissPermanent(commanderOnBattlefield()!.instanceId);
    const destroyedOnTurn = store().turn;
    t = 0;
    while (!commanderOnBattlefield() && t++ < 10) {
      store().nextTurn();
      finishOpponentTurn();
    }
    expect(store().commanderTimesCast).toBe(2);
    const recastTurn = store().turn - 1;
    expect(recastTurn).toBeGreaterThanOrEqual(Math.max(destroyedOnTurn, getManaValue(card.manaCost) + 2));
  });

  it('countering the commander still counts toward commander tax', () => {
    store().startNewGame({ startingOpponentHealth: 999, bracket: 'b2' });
    for (let t = 0; t < 10; t++) {
      store().nextTurn();
      if (store().currentDrawnCard && 'isCommander' in store().currentDrawnCard! && (store().currentDrawnCard as { isCommander?: boolean }).isCommander) {
        store().counterCurrentCard();
        expect(commanderOnBattlefield()).toBeUndefined();
        expect(store().commanderTimesCast).toBe(1);
        return;
      }
      finishOpponentTurn();
    }
    throw new Error('Commander was never cast');
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

  it('accepts every current bracket, including Bracket 5', () => {
    expect(parseMatch({ ...valid, bracket: 'b5' })?.bracket).toBe('b5');
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
