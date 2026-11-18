import { describe, expect, it } from 'vitest';
import {
  applyHealthChange,
  buildMatchRecord,
  checkVictory,
  createSnapshot,
  extractKeywords,
  getAttackers,
  getBuffsFor,
  getComboStatus,
  getEffectiveStats,
  sortByThreat,
  canAutoContinue,
  tapAttackers,
  untapAll,
  getEligibleCards,
  getEventFrequency,
  hasKeyword,
  isEventTurn,
  pickWeightedCard,
  rewindSnapshots,
  totalAttackPower,
} from './game';
import { EVENT_CARDS } from '@/data/cards';
import { COMMANDER_CARDS, getCommanderCard } from '@/data/commanderCards';
import { MOWU_COMMANDERS, getEligibleCommanders, pickRandomCommander } from '@/data/commanders';
import { COMBO_LOSS_TEXTS, pickStable } from '@/data/flavour';
import { ARCHETYPE_CARDS, TOKEN_CARDS, TOKENS_BY_ID } from '@/data/archetypeCards';
import { getManaValue } from './opponent';
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

describe('static buffs (equipment, anthems)', () => {
  const commander = perm({ instanceId: 'cmd', isCommander: true, power: 3, toughness: 3, counterType: 'plus-one', counters: 1 });
  const boots = perm({
    instanceId: 'boots', power: undefined, toughness: undefined, renderedText: 'Equipment',
    buff: { target: 'commander', power: 2, toughness: 0, keywords: ['Haste', 'Trample'] },
  });
  const pups = perm({ instanceId: 'pups', cardId: 'token-pup-soldier', isToken: true, power: 1, toughness: 1, counterType: 'swarm', counters: 3, turnPlayed: 4, enteredOnOpponentTurn: true });
  const horn = perm({
    instanceId: 'horn', power: undefined, toughness: undefined,
    buff: { target: 'tokens', tokenId: 'token-pup-soldier', power: 1, toughness: 0, keywords: ['Haste'] },
  });

  it('applies to the right creatures only', () => {
    const field = [commander, boots, pups, horn];
    expect(getBuffsFor(commander, field)).toHaveLength(1);
    expect(getBuffsFor(pups, field)).toHaveLength(1);
    expect(getBuffsFor(boots, field)).toHaveLength(0); // not a creature
  });

  it('adds to effective stats on top of +1/+1 counters', () => {
    expect(getEffectiveStats(commander, [commander, boots])).toEqual({ power: 6, toughness: 4 });
    expect(getEffectiveStats(commander)).toEqual({ power: 4, toughness: 4 });
  });

  it('granted keywords show in combat and granted Haste lifts summoning sickness', () => {
    expect(getAttackers([pups], 4)).toHaveLength(0); // sick
    const attackers = getAttackers([pups, horn], 4);
    expect(attackers).toHaveLength(1);
    expect(attackers[0]).toMatchObject({ power: 2, count: 3, keywords: 'Haste' });
    expect(getAttackers([{ ...commander, turnPlayed: 1 }, boots], 4)[0].keywords).toBe('Haste, Trample');
  });
});

describe('combo loss flavour', () => {
  it('picks the same text for the same game, and every text names the turn', () => {
    expect(pickStable(COMBO_LOSS_TEXTS, 1234567)).toBe(pickStable(COMBO_LOSS_TEXTS, 1234567));
    expect(new Set(Array.from({ length: 50 }, (_, i) => pickStable(COMBO_LOSS_TEXTS, i))).size).toBe(COMBO_LOSS_TEXTS.length);
    for (const t of COMBO_LOSS_TEXTS) expect(t.subtitle).toContain('{turn}');
  });
});

describe('canAutoContinue', () => {
  it('only when there is nothing for the player to do', () => {
    expect(canAutoContinue('idle', 0, false)).toBe(true);
    expect(canAutoContinue('complete', 0, false)).toBe(true); // casts already seen, no combat
    expect(canAutoContinue('complete', 2, false)).toBe(false); // after combat: player is applying damage
    expect(canAutoContinue('event', 0, false)).toBe(false); // player may counter
    expect(canAutoContinue('combat', 2, false)).toBe(false);
    expect(canAutoContinue('complete', 0, true)).toBe(false); // combo one away / assembled
  });
});

describe('tapping', () => {
  it("taps attackers without Vigilance (printed or granted), and Mowu's untap step untaps them", () => {
    const pup = perm({ instanceId: 'pup' });
    const knight = perm({ instanceId: 'knight', renderedText: 'Vigilance.' });
    const cmd = perm({ instanceId: 'cmd', isCommander: true });
    const plating = perm({ instanceId: 'plating', power: undefined, toughness: undefined, buff: { target: 'commander', power: 1, toughness: 3, keywords: ['Vigilance'] } });
    const bystander = perm({ instanceId: 'home' });
    const after = tapAttackers([pup, knight, cmd, plating, bystander], ['pup', 'knight', 'cmd']);
    expect(after.filter((p) => p.tapped).map((p) => p.instanceId)).toEqual(['pup']);
    expect(untapAll(after).some((p) => p.tapped)).toBe(false);
  });
});

describe('sortByThreat', () => {
  it('puts combo pieces first, then creatures by total attack, then other permanents in cast order', () => {
    const bear = perm({ instanceId: 'bear', power: 2, toughness: 2 });
    const wall = perm({ instanceId: 'wall', power: 0, toughness: 10 });
    const swarm = perm({ instanceId: 'swarm', power: 1, toughness: 1, counterType: 'swarm', counters: 3 });
    const commander = perm({ instanceId: 'cmd', isCommander: true, power: 3, toughness: 3 });
    const collar = perm({ instanceId: 'collar', power: undefined, toughness: undefined, buff: { target: 'commander', power: 3, toughness: 0 } });
    const tax = perm({ instanceId: 'tax', power: undefined, toughness: undefined });
    const piece = perm({ instanceId: 'piece', power: undefined, toughness: undefined, comboPiece: 'A' });
    const order = sortByThreat([tax, bear, collar, wall, swarm, piece, commander]).map((p) => p.instanceId);
    // Commander is 6 power with the collar; swarm is 3×1; bear 2; wall 0 (but tough)
    expect(order).toEqual(['piece', 'cmd', 'swarm', 'bear', 'wall', 'tax', 'collar']);
  });
});

describe('combo status', () => {
  const piece = (p: 'A' | 'B' | 'C') => perm({ instanceId: p, comboPiece: p, power: undefined, toughness: undefined });

  it('needs three pieces in B4 and two in B5', () => {
    expect(getComboStatus([piece('A'), piece('B')], 'b4')).toMatchObject({ oneAway: true, assembled: false, missing: ['C'] });
    expect(getComboStatus([piece('A'), piece('B')], 'b5')).toMatchObject({ assembled: true });
    expect(getComboStatus([piece('A')], 'b5')).toMatchObject({ oneAway: true });
    expect(getComboStatus([], 'b4')).toMatchObject({ active: false, assembled: false });
  });
});

describe('getEligibleCards', () => {
  const tax = { ...EVENT_CARDS[0], id: 'tax-signature', minTurn: 3, signatureCommanderId: 'tax-collector' };
  const pool = [...EVENT_CARDS, tax];

  it('only lets a signature card appear for its own commander', () => {
    expect(getEligibleCards(pool, 10, 'mecha')).not.toContain(tax);
    expect(getEligibleCards(pool, 10, undefined)).not.toContain(tax);
    expect(getEligibleCards(pool, 10, 'tax-collector')).toContain(tax);
  });

  it('keeps commander cards out of the random pool', () => {
    for (const c of COMMANDER_CARDS) expect(EVENT_CARDS.map((e) => e.id)).not.toContain(c.id);
  });

  it('limits archetype cards to their Mowu and to their bracket range', () => {
    const ids = (commanderId: string, bracket: 'b2' | 'b3' | 'b5') =>
      getEligibleCards(EVENT_CARDS, 10, commanderId, bracket).map((c) => c.id);
    expect(ids('mecha', 'b2')).toContain('mecha-rocket-boots');
    expect(ids('warlord', 'b2')).not.toContain('mecha-rocket-boots');
    expect(ids('mecha', 'b2')).not.toContain('mecha-jet-pack'); // B3+
    expect(ids('mecha', 'b3')).toContain('mecha-jet-pack');
    expect(ids('tax-collector', 'b3')).not.toContain('tax-rule-of-paw'); // B5 only
    expect(ids('tax-collector', 'b5')).toContain('tax-rule-of-paw');
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

  it('undoing a card heal (countered life gain) is not counted as player damage', () => {
    const r = applyHealthChange(base(), -6, 'card');
    expect(r.opponentHealth).toBe(94);
    expect(r.totalDamageDealt).toBe(20);
    expect(r.turnSnapshots[1].damageThisTurn).toBe(0);
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

  it('records which Mowu was faced (none for a generic opponent)', () => {
    expect(buildMatchRecord({ ...game, opponentCommander: { id: 'warlord', name: 'Warlord Mowu' } }, true)).toMatchObject({
      commanderId: 'warlord',
      commanderName: 'Warlord Mowu',
    });
    expect(buildMatchRecord({ ...game, opponentCommander: null }, true).commanderId).toBeUndefined();
  });

  it('records losses without a win reason', () => {
    expect(buildMatchRecord(game, false)).toMatchObject({ won: false, winReason: undefined });
  });
});

describe('switching Mowus off', () => {
  it('never picks a disabled commander', () => {
    for (let i = 0; i < 50; i++) {
      const picked = pickRandomCommander('b3', ['alchemist', 'mecha'], () => i / 50);
      expect(['alchemist', 'mecha']).not.toContain(picked?.id);
    }
  });

  it('falls back to a generic opponent (null) when every Mowu for the bracket is off', () => {
    const b1 = MOWU_COMMANDERS.filter((c) => c.brackets.includes('b1')).map((c) => c.id);
    expect(getEligibleCommanders('b1', b1)).toEqual([]);
    expect(pickRandomCommander('b1', b1)).toBeNull();
    // Other brackets are unaffected
    expect(pickRandomCommander('b2', b1)).not.toBeNull();
  });
});

describe('commander cards', () => {
  it('every Mowu commander has exactly one commander card', () => {
    for (const commander of MOWU_COMMANDERS) {
      const cards = COMMANDER_CARDS.filter((c) => c.signatureCommanderId === commander.id);
      expect(cards, commander.id).toHaveLength(1);
      expect(getCommanderCard(commander.id)).toBe(cards[0]);
    }
  });

  it('are legendary creature permanents with stats and flavour', () => {
    for (const card of COMMANDER_CARDS) {
      expect(card.typeLine, card.id).toMatch(/^Legendary (Artifact )?Creature/);
      expect(card.isPermanent).toBe(true);
      const stats = card.computeStats(5, 'b3');
      expect(stats.power, card.id).toBeGreaterThanOrEqual(0);
      expect(stats.toughness, card.id).toBeGreaterThan(0);
      expect(card.flavorText, card.id).toBeTruthy();
    }
  });

  it('B1 gimmick commanders are vanilla apart from keywords', () => {
    expect(getCommanderCard('left-facing')!.computeStats(5, 'b1').renderedText).toBe('');
    expect(getCommanderCard('chair-sitting')!.computeStats(5, 'b1').renderedText).toBe('Defender.');
  });

  it('engine commanders stay home (Defender), and no commander is a forced blocker', () => {
    for (const id of ['scholar', 'archmage', 'chair-sitting']) {
      expect(getCommanderCard(id)!.computeStats(5, 'b4').renderedText, id).toMatch(/^Defender\b/);
    }
    for (const card of COMMANDER_CARDS) {
      expect(card.computeStats(5, 'b4').renderedText, card.id).not.toMatch(/Blocks if able/);
    }
  });

  it('swarm tokens never block; forced blockers say so plainly', () => {
    for (const t of TOKEN_CARDS) expect(t.computeStats(5, 'b3').renderedText).toMatch(/can't block/);
    for (const c of [...EVENT_CARDS]) {
      expect(c.computeStats(5, 'b3').renderedText, c.id).not.toMatch(/biggest attacker/);
    }
  });

  it('have no activated abilities (ADR-019)', () => {
    for (const card of COMMANDER_CARDS) {
      // Activated abilities are written "cost: effect", e.g. "{T}: ..." or "{2}{U}: ..."
      expect(card.computeStats(5, 'b3').renderedText, card.id).not.toMatch(/\}:/);
    }
  });
});

describe('archetype playbooks', () => {
  it('every Mowu has a cheap (≤2 mana, from turn 2) card of his own in every bracket he plays', () => {
    for (const commander of MOWU_COMMANDERS) {
      for (const bracket of commander.brackets) {
        const own = getEligibleCards(EVENT_CARDS, 2, commander.id, bracket).filter(
          (c) => c.exclusiveTo?.includes(commander.id) && getManaValue(c.manaCost) <= 2 && !c.requires?.length,
        );
        expect(own.length, `${commander.id} ${bracket}`).toBeGreaterThan(0);
      }
    }
  });

  it('only reference tokens that exist and Mowus that exist', () => {
    const commanderIds = new Set(MOWU_COMMANDERS.map((c) => c.id));
    for (const card of [...ARCHETYPE_CARDS, ...COMMANDER_CARDS]) {
      for (const id of card.exclusiveTo ?? []) expect(commanderIds.has(id), card.id).toBe(true);
      const stats = card.computeStats(5, 'b4');
      for (const effect of [...(stats.effects ?? []), ...(stats.upkeep ?? [])]) {
        if (effect.type === 'create-tokens') expect(TOKENS_BY_ID[effect.tokenId], card.id).toBeDefined();
      }
    }
  });

  it('no card has an activated ability (ADR-019)', () => {
    for (const card of [...EVENT_CARDS, ...COMMANDER_CARDS, ...TOKEN_CARDS]) {
      expect(card.computeStats(5, 'b4').renderedText, card.id).not.toMatch(/\}:/);
    }
  });

  it('combo pieces are legendary, one per letter, and C only exists up to B4', () => {
    const pieces = ARCHETYPE_CARDS.filter((c) => c.comboPiece);
    expect(pieces.map((c) => c.comboPiece).sort()).toEqual(['A', 'B', 'C']);
    for (const p of pieces) expect(p.typeLine).toMatch(/^Legendary/);
    expect(pieces.find((c) => c.comboPiece === 'C')?.maxBracket).toBe(4);
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
          // Vanilla creatures have no rules text; everything else must say what it does
          if (stats.power === undefined) expect(stats.renderedText.length, card.id).toBeGreaterThan(0);
        }
      }
    }
  });
});
