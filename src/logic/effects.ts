/**
 * Automatic card effects (Phase 3 Batch 3). Pure: callers pass state in and
 * get new state, a turn-log description, and an undo record back.
 *
 * Every effect has a source the player can answer (ADR-019): a card being cast
 * (undone if countered) or printed upkeep text on a permanent (stops if the
 * permanent is removed).
 */
import type { ActivePermanent, CardEffect, EffectUndo, EventCardDefinition } from '@/types/card';

export interface EffectState {
  permanents: ActivePermanent[];
  playerPoison: number;
}

export interface EffectContext {
  /** The permanent the effect comes from (upkeep triggers, ETB), if any. */
  sourceInstanceId?: string;
  turn: number;
  enteredOnOpponentTurn: boolean;
  /** Token definitions by id. */
  tokens: Record<string, EventCardDefinition>;
  /** Fresh instance id generator. */
  newId: () => string;
}

export interface EffectResult extends EffectState {
  opponentLife: number;
  /** Plain-English lines for the turn log. */
  log: string[];
  undo: EffectUndo;
}

export const emptyUndo = (): EffectUndo => ({
  removeInstanceIds: [],
  counterChanges: [],
  playerPoison: 0,
  opponentLife: 0,
});

const plural = (n: number, word: string) => (n === 1 ? `a ${word}` : `${n} ${word}s`);

const counterWord = (p: ActivePermanent) => {
  switch (p.counterType) {
    case 'plus-one': return '+1/+1 counter';
    case 'tax': return 'tax counter';
    case 'study': return 'study counter';
    default: return 'counter';
  }
};

const addCounters = (
  permanents: ActivePermanent[],
  instanceId: string,
  amount: number,
): ActivePermanent[] =>
  permanents.map((p) => (p.instanceId === instanceId ? { ...p, counters: Math.max(0, p.counters + amount) } : p));

/** Build a token permanent (a stack of `count` bodies). */
export const createTokenPermanent = (
  token: EventCardDefinition,
  count: number,
  ctx: Pick<EffectContext, 'turn' | 'enteredOnOpponentTurn' | 'newId'>,
  bracket: Parameters<EventCardDefinition['computeStats']>[1] = 'b2',
): ActivePermanent => {
  const stats = token.computeStats(ctx.turn, bracket);
  return {
    instanceId: ctx.newId(),
    cardId: token.id,
    name: token.name,
    manaCost: token.manaCost,
    typeLine: token.typeLine,
    artFile: token.artFile,
    renderedText: stats.renderedText,
    flavorText: token.flavorText,
    power: stats.power ?? token.basePower,
    toughness: stats.toughness ?? token.baseToughness,
    counters: count,
    counterType: 'swarm',
    turnPlayed: ctx.turn,
    enteredOnOpponentTurn: ctx.enteredOnOpponentTurn,
    isToken: true,
    upkeep: stats.upkeep,
    buff: stats.buff,
  };
};

/**
 * Apply effects in order. Tokens join an existing stack of the same token only
 * if that stack entered at the same time (so summoning sickness stays right);
 * otherwise a new stack is created. Stacks are merged later by
 * `mergeTokenStacks` once they can all attack.
 */
export const applyEffects = (effects: CardEffect[], state: EffectState, ctx: EffectContext): EffectResult => {
  let permanents = state.permanents;
  let playerPoison = state.playerPoison;
  let opponentLife = 0;
  const log: string[] = [];
  const undo = emptyUndo();

  const source = () => permanents.find((p) => p.instanceId === ctx.sourceInstanceId);

  for (const effect of effects) {
    switch (effect.type) {
      case 'counters': {
        const targets =
          effect.target === 'commander'
            ? permanents.filter((p) => p.isCommander)
            : effect.target === 'self'
              ? permanents.filter((p) => p.instanceId === ctx.sourceInstanceId)
              : permanents.filter((p) => p.counterType === 'tax');
        for (const t of targets) {
          permanents = addCounters(permanents, t.instanceId, effect.amount);
          undo.counterChanges.push({ instanceId: t.instanceId, amount: effect.amount });
          log.push(`${t.name} gets ${plural(effect.amount, counterWord(t))}.`);
        }
        break;
      }
      case 'create-tokens': {
        const token = ctx.tokens[effect.tokenId];
        if (!token || effect.count <= 0) break;
        const stack = permanents.find(
          (p) =>
            p.isToken &&
            p.cardId === token.id &&
            p.turnPlayed === ctx.turn &&
            Boolean(p.enteredOnOpponentTurn) === ctx.enteredOnOpponentTurn,
        );
        if (stack) {
          permanents = addCounters(permanents, stack.instanceId, effect.count);
          undo.counterChanges.push({ instanceId: stack.instanceId, amount: effect.count });
        } else {
          const created = createTokenPermanent(token, effect.count, ctx);
          permanents = [created, ...permanents];
          undo.removeInstanceIds.push(created.instanceId);
        }
        log.push(`Mowu creates ${plural(effect.count, `${token.name} token`)}.`);
        break;
      }
      case 'player-poison': {
        if (effect.onlyIfPoisoned && playerPoison <= 0) break;
        const before = playerPoison;
        playerPoison = Math.min(10, playerPoison + effect.amount);
        const gained = playerPoison - before;
        if (gained > 0) {
          undo.playerPoison += gained;
          log.push(`You get ${plural(gained, 'poison counter')} (now ${playerPoison}).`);
        }
        break;
      }
      case 'opponent-life': {
        opponentLife += effect.amount;
        undo.opponentLife += effect.amount;
        log.push(`Mowu gains ${effect.amount} life.`);
        break;
      }
      case 'threshold': {
        const src = source();
        if (!src || src.counters < effect.threshold) break;
        permanents = addCounters(permanents, src.instanceId, -effect.threshold);
        undo.counterChanges.push({ instanceId: src.instanceId, amount: -effect.threshold });
        log.push(effect.text);
        break;
      }
    }
  }

  return { permanents, playerPoison, opponentLife, log, undo };
};

/** Reverse an undo record (opponent life is handled by the store, which owns the life total). */
export const undoEffects = (undo: EffectUndo, state: EffectState): EffectState => {
  const removed = new Set(undo.removeInstanceIds);
  let permanents = state.permanents.filter((p) => !removed.has(p.instanceId));
  for (const change of undo.counterChanges) {
    if (!removed.has(change.instanceId)) permanents = addCounters(permanents, change.instanceId, -change.amount);
  }
  return { permanents, playerPoison: Math.max(0, state.playerPoison - undo.playerPoison) };
};

/**
 * Merge stacks of the same token that are no longer summoning sick (start of
 * Mowu's turn), so the battlefield stays tidy. The oldest stack is kept.
 */
export const mergeTokenStacks = (permanents: ActivePermanent[]): ActivePermanent[] => {
  const keep = new Map<string, ActivePermanent>();
  const result: ActivePermanent[] = [];
  // Oldest first, so the surviving stack is the earliest one
  for (const p of [...permanents].reverse()) {
    if (!p.isToken) {
      result.push(p);
      continue;
    }
    const existing = keep.get(p.cardId);
    if (existing) {
      existing.counters += p.counters;
    } else {
      const copy = { ...p };
      keep.set(p.cardId, copy);
      result.push(copy);
    }
  }
  return result.reverse();
};
