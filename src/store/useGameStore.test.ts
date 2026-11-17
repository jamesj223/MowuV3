import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

import { useGameStore } from './useGameStore';
import { parseMatch } from './useDeckStore';
import { getCommanderCard } from '@/data/commanderCards';
import { MOWU_COMMANDERS } from '@/data/commanders';
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
    // Pin a commander without a combo, so the game can't end mid-test
    useGameStore.setState({ opponentCommander: MOWU_COMMANDERS.find((c) => c.id === 'tax-collector')! });
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
        manaBudget: 1, plannedCardIds: ['suspicious-meat-pie'], casts: [],
      },
    });
    store().advanceOpponentPhase(); // casts the planned Meat Pie
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

describe('archetype playbooks in play', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const finishOpponentTurn = () => {
    for (let i = 0; i < 10 && store().turnPhase === 'opponent'; i++) store().advanceOpponentPhase();
  };
  const playAs = (commanderId: string, bracket: 'b2' | 'b3' | 'b4' | 'b5') => {
    store().startNewGame({ startingOpponentHealth: 999, bracket });
    useGameStore.setState({ opponentCommander: MOWU_COMMANDERS.find((c) => c.id === commanderId)! });
  };
  /** Put a card straight onto Mowu's battlefield (as if cast on an earlier turn). */
  const putOntoBattlefield = (cardId: string) => {
    store().triggerEvent(cardId);
    store().closeDrawnCard();
  };

  it("Mecha-Mowu's upkeep trigger grows him every turn", () => {
    playAs('mecha', 'b2');
    putOntoBattlefield('commander-mecha');
    const mecha = () => store().activePermanents.find((p) => p.isCommander)!;
    expect(mecha().counters).toBe(0);
    // (Mowu may also cast Oil Change on these turns, so counters are "at least")
    store().nextTurn();
    expect(store().opponentTurnState?.upkeepLog).toEqual(['Mecha-Mowu gets a +1/+1 counter.']);
    expect(mecha().counters).toBeGreaterThanOrEqual(1);
    finishOpponentTurn();
    const before = mecha().counters;
    store().nextTurn();
    expect(store().opponentTurnState?.upkeepLog).toEqual(['Mecha-Mowu gets a +1/+1 counter.']);
    expect(mecha().counters).toBeGreaterThanOrEqual(before + 1);
  });

  it("Warlord's upkeep makes Pup Soldiers, which merge into one stack once they can attack", () => {
    playAs('warlord', 'b2');
    putOntoBattlefield('commander-warlord');
    const pups = () => store().activePermanents.filter((p) => p.cardId === 'token-pup-soldier');
    store().nextTurn();
    finishOpponentTurn();
    store().nextTurn();
    finishOpponentTurn();
    // Two upkeeps (plus any token spells): all pups in a single stack after the merge at upkeep
    expect(pups().length).toBeLessThanOrEqual(2);
    expect(pups().reduce((n, p) => n + p.counters, 0)).toBeGreaterThanOrEqual(2);
  });

  it('countering a token spell removes the tokens it made', () => {
    playAs('warlord', 'b3');
    useGameStore.setState({
      turnPhase: 'opponent',
      opponentTurnState: {
        phase: 'event', hasEvent: true, attackers: [], idleText: null, eventTriggered: false,
        manaBudget: 2, plannedCardIds: ['warlord-muster'], casts: [],
      },
    });
    store().advanceOpponentPhase();
    expect(store().activePermanents.find((p) => p.cardId === 'token-pup-soldier')?.counters).toBe(3);
    expect(store().opponentTurnState?.casts[0].effectLog).toEqual(['Mowu creates 3 Pup Soldier tokens.']);
    store().counterCurrentCard();
    expect(store().activePermanents.some((p) => p.cardId === 'token-pup-soldier')).toBe(false);
  });

  it('poison from Mowu turns on the player poison tracker and can be countered away', () => {
    playAs('alchemist', 'b3');
    useGameStore.setState({ poisonCounters: 2, trackPlayerPoison: false });
    putOntoBattlefield('alchemist-bubbling-cauldron');
    store().nextTurn();
    expect(store().opponentTurnState?.upkeepLog).toEqual([
      'Bubbling Cauldron: You get a poison counter (now 3).',
    ]);
    expect(store().poisonCounters).toBeGreaterThanOrEqual(3); // Vial of Venom may add more
    expect(store().trackPlayerPoison).toBe(true);
  });

  it("Scholar's lesson fires every third upkeep", () => {
    playAs('scholar', 'b2');
    putOntoBattlefield('commander-scholar');
    const lessons: string[] = [];
    for (let t = 0; t < 3; t++) {
      store().nextTurn();
      lessons.push(...(store().opponentTurnState?.upkeepLog ?? []).filter((l) => l.includes('Lesson')));
      finishOpponentTurn();
    }
    // At least one lesson in three upkeeps (Study Group can speed it up), never with 3+ counters left over
    expect(lessons.length).toBeGreaterThanOrEqual(1);
    expect(store().activePermanents.find((p) => p.isCommander)?.counters).toBeLessThan(3 + 2);
  });

  it("Archmage's combo: assembled pieces make you lose at the start of his next turn", () => {
    playAs('archmage', 'b5');
    putOntoBattlefield('archmage-combo-a');
    putOntoBattlefield('archmage-combo-b');
    expect(store().isGameOver).toBe(false);
    store().nextTurn();
    expect(store()).toMatchObject({ isGameOver: true, lossReason: 'combo', winReason: null });
    // Healing the opponent afterwards can't un-lose the game
    store().applyOpponentHealthChange(5);
    expect(store().isGameOver).toBe(true);
  });

  it('destroying a piece before his turn stops the combo', () => {
    playAs('archmage', 'b5');
    putOntoBattlefield('archmage-combo-a');
    putOntoBattlefield('archmage-combo-b');
    const pieceB = store().activePermanents.find((p) => p.comboPiece === 'B')!;
    store().dismissPermanent(pieceB.instanceId);
    store().nextTurn();
    expect(store().isGameOver).toBe(false);
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
