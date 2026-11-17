import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import confetti from 'canvas-confetti';
import type { CommanderBracket, GameSettings, TurnSnapshot, WinReason } from '@/types/game';
import type { ActivePermanent, ResolvedEvent } from '@/types/card';
import type { MowuCommander, OpponentTurnState } from '@/types/opponent';
import { EVENT_CARDS } from '@/data/cards';
import { findCardDefinition, getCommanderCard } from '@/data/commanderCards';
import { pickRandomCommander, pickIdleText } from '@/data/commanders';
import {
  COMMANDER_DAMAGE_LETHAL,
  POISON_LETHAL,
  applyHealthChange,
  checkVictory,
  createSnapshot,
  getAttackers,
  getEligibleCards,
  pickWeightedCard,
  rewindSnapshots,
  type HealthChangeSource,
  type Triple,
} from '@/logic/game';
import { planOpponentTurn } from '@/logic/opponent';

/** How long the floating +/- delta badge stays visible after the last change. */
const DELTA_DISPLAY_MS = 1600;

interface GameStoreState {
  // Settings
  startingOpponentHealth: number;
  startingPlayerLife: number;
  bracket: CommanderBracket;
  customEventFrequency: number;
  trackPlayer: boolean;
  trackPlayerPoison: boolean;
  trackPlayerCommanderDamage: boolean;
  trackOpponentPoison: boolean;
  trackOpponentCommanderDamage: boolean;
  currentDeckName: string;

  // Live Opponent Health (Counting Down to 0)
  opponentHealth: number;
  totalDamageDealt: number;
  isGameOver: boolean;
  winReason: WinReason | null;
  gameStartTime: number;

  // 3-Opponent Alt-Win Trackers (Pod)
  opponentPoison: Triple;
  opponentCommanderDamage: Triple;

  // Floating delta badge (display only; damage stats are recorded immediately)
  accumulatedDelta: number;
  isDeltaVisible: boolean;

  // Live Turn State
  turn: number;
  turnPhase: 'player' | 'opponent';
  turnSnapshots: TurnSnapshot[];

  // Opponent Turn System
  opponentCommander: MowuCommander | null;
  opponentTurnState: OpponentTurnState | null;
  /** Times Mowu has cast his commander this game (drives commander tax). */
  commanderTimesCast: number;

  // Player Counters
  playerLife: number;
  poisonCounters: number;
  commanderDamage: number;

  // Opponent Battlefield & Resolved Log
  activePermanents: ActivePermanent[];
  eventHistory: ResolvedEvent[];
  eventsTriggered: number;
  currentDrawnCard: ActivePermanent | ResolvedEvent | null;

  // Actions
  applyDamageToOpponent: (amount: number) => void;
  applyOpponentHealthChange: (delta: number, source?: HealthChangeSource) => void;
  adjustOpponentPoison: (index: 0 | 1 | 2, amount: number) => void;
  adjustOpponentCommanderDamage: (index: 0 | 1 | 2, amount: number) => void;
  nextTurn: () => void;
  prevTurn: () => void;
  endOpponentTurn: () => void;
  advanceOpponentPhase: () => void;
  counterCurrentCard: () => void;
  adjustPlayerLife: (amount: number) => void;
  adjustPoison: (amount: number) => void;
  adjustCommanderDamage: (amount: number) => void;
  adjustPermanentCounters: (instanceId: string, amount: number) => void;
  dismissPermanent: (instanceId: string) => void;
  clearAllPermanents: () => void;
  triggerEvent: (forceCardId?: string) => void;
  closeDrawnCard: () => void;
  resetGame: () => void;
  startNewGame: (settings: Partial<GameSettings> & { deckName?: string }) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  toggleTrackOpponentPoison: () => void;
  toggleTrackOpponentCommanderDamage: () => void;
  toggleTrackPlayerPoison: () => void;
  toggleTrackPlayerCommanderDamage: () => void;
}

type SettingsState = Pick<
  GameStoreState,
  | 'startingOpponentHealth'
  | 'startingPlayerLife'
  | 'bracket'
  | 'customEventFrequency'
  | 'trackPlayer'
  | 'trackPlayerPoison'
  | 'trackPlayerCommanderDamage'
  | 'trackOpponentPoison'
  | 'trackOpponentCommanderDamage'
  | 'currentDeckName'
>;

const DEFAULT_SETTINGS: SettingsState = {
  startingOpponentHealth: 120,
  startingPlayerLife: 40,
  bracket: 'b2',
  customEventFrequency: 4,
  trackPlayer: true,
  trackPlayerPoison: false,
  trackPlayerCommanderDamage: false,
  trackOpponentPoison: false,
  trackOpponentCommanderDamage: false,
  currentDeckName: '',
};

/** Everything that makes up a single game in progress, freshly initialised. */
const createFreshGame = (
  settings: Pick<SettingsState, 'startingOpponentHealth' | 'startingPlayerLife' | 'bracket'>,
) => {
  const now = Date.now();
  return {
    turn: 1,
    turnPhase: 'player' as const,
    opponentHealth: settings.startingOpponentHealth,
    totalDamageDealt: 0,
    accumulatedDelta: 0,
    isDeltaVisible: false,
    isGameOver: false,
    winReason: null,
    gameStartTime: now,
    playerLife: settings.startingPlayerLife,
    poisonCounters: 0,
    commanderDamage: 0,
    opponentPoison: [0, 0, 0] as Triple,
    opponentCommanderDamage: [0, 0, 0] as Triple,
    activePermanents: [],
    eventHistory: [],
    eventsTriggered: 0,
    currentDrawnCard: null,
    opponentCommander: pickRandomCommander(settings.bracket),
    opponentTurnState: null,
    commanderTimesCast: 0,
    turnSnapshots: [createSnapshot(1, settings.startingOpponentHealth, 0, now)],
  } satisfies Partial<GameStoreState>;
};

/** Keys that are saved to localStorage (everything except transient UI state and actions). */
const PERSISTED_KEYS = [
  ...(Object.keys(DEFAULT_SETTINGS) as (keyof SettingsState)[]),
  ...(Object.keys(createFreshGame(DEFAULT_SETTINGS)) as (keyof ReturnType<typeof createFreshGame>)[]),
].filter((k) => k !== 'accumulatedDelta' && k !== 'isDeltaVisible');

// The delta-badge timer is a side effect, not state: keep it out of the store.
let deltaTimer: ReturnType<typeof setTimeout> | null = null;
const clearDeltaTimer = () => {
  if (deltaTimer) clearTimeout(deltaTimer);
  deltaTimer = null;
};

const celebrate = () => confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });

/** Plan what the opponent does at the start of their turn. */
const computeOpponentTurn = (state: GameStoreState): OpponentTurnState => {
  const recentCasts = [
    ...state.eventHistory.map((e) => ({ cardId: e.cardId, turn: e.turnResolved })),
    ...state.activePermanents.map((p) => ({ cardId: p.cardId, turn: p.turnPlayed })),
  ];
  const commanderCard = getCommanderCard(state.opponentCommander?.id);
  const plan = planOpponentTurn(
    {
      turn: state.turn,
      bracket: state.bracket,
      customFrequency: state.customEventFrequency,
      commanderId: state.opponentCommander?.id,
      cardWeights: state.opponentCommander?.cardWeights ?? {},
      battlefieldCardIds: state.activePermanents.map((p) => p.cardId),
      recentCasts,
      cards: EVENT_CARDS,
      commander: commanderCard
        ? {
            card: commanderCard,
            onBattlefield: state.activePermanents.some((p) => p.isCommander),
            timesCast: state.commanderTimesCast,
          }
        : undefined,
    },
    Math.random,
  );
  const hasEvent = plan.plays.length > 0;
  const attackers = getAttackers(state.activePermanents, state.turn);

  let phase: OpponentTurnState['phase'] = 'idle';
  if (hasEvent) phase = 'event';
  else if (attackers.length > 0) phase = 'combat';

  return {
    phase,
    hasEvent,
    attackers,
    idleText: !hasEvent && attackers.length === 0 ? pickIdleText(state.opponentCommander) : null,
    eventTriggered: false,
    manaBudget: plan.budget,
    plannedCardIds: plan.plays.map((c) => c.id),
    casts: [],
  };
};

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => {
      /** Re-check alt win conditions after a tracker change and update game-over state. */
      const settleVictory = (patch: Partial<GameStoreState>) => {
        const state = { ...get(), ...patch };
        const win = checkVictory(
          state.opponentHealth,
          state.opponentPoison,
          state.opponentCommanderDamage,
          state.trackOpponentPoison,
          state.trackOpponentCommanderDamage,
        );
        if (win.isWon && !get().isGameOver) celebrate();
        set({ ...patch, isGameOver: win.isWon, winReason: win.reason });
      };

      const advanceToNextTurn = () => {
        const state = get();
        const nextTurnNum = state.turn + 1;
        clearDeltaTimer();
        set({
          turn: nextTurnNum,
          turnPhase: 'player',
          opponentTurnState: null,
          accumulatedDelta: 0,
          isDeltaVisible: false,
          turnSnapshots: [
            ...state.turnSnapshots,
            createSnapshot(nextTurnNum, state.opponentHealth, state.totalDamageDealt),
          ],
        });
      };

      /** Cast the next card in this opponent turn's plan. Returns false if none are left. */
      const castNextPlannedCard = (): boolean => {
        const turnState = get().opponentTurnState;
        if (!turnState) return false;
        const cardId = turnState.plannedCardIds[turnState.casts.length];
        if (!cardId) return false;
        get().triggerEvent(cardId);
        const cast = get().currentDrawnCard;
        set((current) => ({
          opponentTurnState: current.opponentTurnState
            ? {
                ...current.opponentTurnState,
                eventTriggered: true,
                casts: cast
                  ? [
                      ...current.opponentTurnState.casts,
                      { instanceId: cast.instanceId, cardId, name: cast.name, countered: false },
                    ]
                  : current.opponentTurnState.casts,
              }
            : null,
        }));
        return true;
      };

      return {
        ...DEFAULT_SETTINGS,
        ...createFreshGame(DEFAULT_SETTINGS),

        applyOpponentHealthChange: (delta, source = 'player') => {
          const state = get();
          const result = applyHealthChange(state, delta, source);
          if (result.appliedDelta === 0) return;

          clearDeltaTimer();
          deltaTimer = setTimeout(() => {
            deltaTimer = null;
            set({ accumulatedDelta: 0, isDeltaVisible: false });
          }, DELTA_DISPLAY_MS);

          settleVictory({
            opponentHealth: result.opponentHealth,
            totalDamageDealt: result.totalDamageDealt,
            turnSnapshots: result.turnSnapshots,
            accumulatedDelta: state.accumulatedDelta + result.appliedDelta,
            isDeltaVisible: true,
          });
        },

        applyDamageToOpponent: (damage) => {
          get().applyOpponentHealthChange(-damage, 'player');
        },

        adjustOpponentPoison: (index, amount) => {
          const next = [...get().opponentPoison] as Triple;
          next[index] = Math.max(0, Math.min(POISON_LETHAL, next[index] + amount));
          settleVictory({ opponentPoison: next });
        },

        adjustOpponentCommanderDamage: (index, amount) => {
          const next = [...get().opponentCommanderDamage] as Triple;
          next[index] = Math.max(0, Math.min(COMMANDER_DAMAGE_LETHAL, next[index] + amount));
          settleVictory({ opponentCommanderDamage: next });
        },

        nextTurn: () => {
          const state = get();
          if (state.isGameOver) return;

          if (state.turnPhase === 'opponent') {
            get().endOpponentTurn();
            return;
          }

          const oppTurn = computeOpponentTurn(state);

          // Solitaire mode with nothing attacking: skip the opponent turn entirely
          if (state.bracket === 'off' && oppTurn.attackers.length === 0) {
            advanceToNextTurn();
            return;
          }

          set({ turnPhase: 'opponent', opponentTurnState: oppTurn });

          if (oppTurn.hasEvent) castNextPlannedCard();
        },

        endOpponentTurn: () => {
          advanceToNextTurn();
        },

        advanceOpponentPhase: () => {
          const state = get();
          if (!state.opponentTurnState) return;
          const { phase } = state.opponentTurnState;

          if (phase === 'event') {
            // More cards planned this turn? Cast the next one.
            if (castNextPlannedCard()) return;

            // Re-evaluate attackers now the casts have resolved (a hasty creature may have arrived).
            // Mowu did cast something, so with no attackers the turn is 'complete', not 'idle'.
            const after = get();
            const attackers = getAttackers(after.activePermanents, after.turn);
            set({
              opponentTurnState: after.opponentTurnState
                ? {
                    ...after.opponentTurnState,
                    phase: attackers.length > 0 ? 'combat' : 'complete',
                    attackers,
                  }
                : null,
              currentDrawnCard: null,
            });
            return;
          }

          if (phase === 'combat') {
            set({ opponentTurnState: { ...state.opponentTurnState, phase: 'complete' } });
            return;
          }

          // idle or complete → end the opponent turn
          get().endOpponentTurn();
        },

        counterCurrentCard: () => {
          const state = get();
          const turnState = state.opponentTurnState;
          const card = state.currentDrawnCard;
          if (!turnState || turnState.phase !== 'event' || !card) return;

          if ('counters' in card) {
            // A countered permanent spell never enters the battlefield
            set({ activePermanents: state.activePermanents.filter((p) => p.instanceId !== card.instanceId) });
          } else {
            set({ eventHistory: state.eventHistory.filter((e) => e.instanceId !== card.instanceId) });
            if (card.healAmount) get().applyOpponentHealthChange(-card.healAmount, 'card');
          }

          set((current) => ({
            opponentTurnState: current.opponentTurnState
              ? {
                  ...current.opponentTurnState,
                  casts: current.opponentTurnState.casts.map((c) =>
                    c.instanceId === card.instanceId ? { ...c, countered: true } : c,
                  ),
                }
              : null,
          }));
          get().advanceOpponentPhase();
        },

        prevTurn: () => {
          const state = get();
          if (state.turn <= 1 || state.turnPhase !== 'player') return;
          clearDeltaTimer();
          set({
            turn: state.turn - 1,
            turnSnapshots: rewindSnapshots(state.turnSnapshots, state.turn),
            accumulatedDelta: 0,
            isDeltaVisible: false,
          });
        },

        adjustPlayerLife: (amount) => {
          set((state) => ({ playerLife: state.playerLife + amount }));
        },

        adjustPoison: (amount) => {
          set((state) => ({
            poisonCounters: Math.max(0, Math.min(POISON_LETHAL, state.poisonCounters + amount)),
          }));
        },

        adjustCommanderDamage: (amount) => {
          set((state) => ({
            commanderDamage: Math.max(
              0,
              Math.min(COMMANDER_DAMAGE_LETHAL, state.commanderDamage + amount),
            ),
          }));
        },

        adjustPermanentCounters: (instanceId, amount) => {
          set((state) => ({
            activePermanents: state.activePermanents.map((permanent) =>
              permanent.instanceId === instanceId
                ? { ...permanent, counters: Math.max(0, permanent.counters + amount) }
                : permanent,
            ),
          }));
        },

        dismissPermanent: (instanceId) => {
          set((state) => ({
            activePermanents: state.activePermanents.filter((p) => p.instanceId !== instanceId),
          }));
        },

        clearAllPermanents: () => {
          set({ activePermanents: [] });
        },

        triggerEvent: (forceCardId) => {
          const state = get();
          const eligible = getEligibleCards(EVENT_CARDS, state.turn, state.opponentCommander?.id);

          const forced = forceCardId ? findCardDefinition(forceCardId, EVENT_CARDS) : undefined;
          const cardDef =
            forced ?? pickWeightedCard(eligible, state.opponentCommander?.cardWeights ?? {}, Math.random);

          const computed = cardDef.computeStats(state.turn, state.bracket);
          const instanceId = `inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const eventsTriggered = state.eventsTriggered + 1;
          const isCommander = cardDef.id === getCommanderCard(state.opponentCommander?.id)?.id;

          if (cardDef.isPermanent) {
            const perm: ActivePermanent = {
              instanceId,
              cardId: cardDef.id,
              name: cardDef.name,
              manaCost: cardDef.manaCost,
              typeLine: cardDef.typeLine,
              artFile: cardDef.artFile,
              renderedText: computed.renderedText,
              flavorText: cardDef.flavorText,
              power: computed.power ?? cardDef.basePower,
              toughness: computed.toughness ?? cardDef.baseToughness,
              counters: computed.counters ?? cardDef.initialCounters ?? 0,
              counterType: cardDef.counterType,
              turnPlayed: state.turn,
              enteredOnOpponentTurn: state.turnPhase === 'opponent',
              isCommander,
            };
            set({
              activePermanents: [perm, ...state.activePermanents],
              currentDrawnCard: perm,
              eventsTriggered,
              // Casting from the command zone raises commander tax, even if it's then countered
              commanderTimesCast: state.commanderTimesCast + (isCommander ? 1 : 0),
            });
            return;
          }

          const resolved: ResolvedEvent = {
            instanceId,
            cardId: cardDef.id,
            name: cardDef.name,
            typeLine: cardDef.typeLine,
            artFile: cardDef.artFile,
            renderedText: computed.renderedText,
            turnResolved: state.turn,
            healAmount: computed.healAmount,
          };

          if (computed.healAmount && computed.healAmount > 0) {
            // Opponent life gain: changes life only, never erases the player's damage stats
            get().applyOpponentHealthChange(computed.healAmount, 'card');
          }

          set((current) => ({
            eventHistory: [resolved, ...current.eventHistory],
            currentDrawnCard: resolved,
            eventsTriggered,
          }));
        },

        closeDrawnCard: () => {
          set({ currentDrawnCard: null });
        },

        resetGame: () => {
          clearDeltaTimer();
          set(createFreshGame(get()));
        },

        startNewGame: (settings) => {
          clearDeltaTimer();
          const state = get();
          const { deckName, ...rest } = settings;
          const nextSettings: SettingsState = {
            startingOpponentHealth: rest.startingOpponentHealth ?? state.startingOpponentHealth,
            startingPlayerLife: rest.startingPlayerLife ?? state.startingPlayerLife,
            bracket: rest.bracket ?? state.bracket,
            customEventFrequency: rest.customEventFrequency ?? state.customEventFrequency,
            trackPlayer: rest.trackPlayer ?? state.trackPlayer,
            trackPlayerPoison: rest.trackPlayerPoison ?? state.trackPlayerPoison,
            trackPlayerCommanderDamage: rest.trackPlayerCommanderDamage ?? state.trackPlayerCommanderDamage,
            trackOpponentPoison: rest.trackOpponentPoison ?? state.trackOpponentPoison,
            trackOpponentCommanderDamage:
              rest.trackOpponentCommanderDamage ?? state.trackOpponentCommanderDamage,
            currentDeckName: deckName ?? state.currentDeckName,
          };
          set({ ...nextSettings, ...createFreshGame(nextSettings) });
        },

        updateSettings: (settings) => {
          set(settings);
        },

        toggleTrackOpponentPoison: () => {
          settleVictory({ trackOpponentPoison: !get().trackOpponentPoison });
        },

        toggleTrackOpponentCommanderDamage: () => {
          settleVictory({ trackOpponentCommanderDamage: !get().trackOpponentCommanderDamage });
        },

        toggleTrackPlayerPoison: () => {
          set((state) => ({ trackPlayerPoison: !state.trackPlayerPoison }));
        },

        toggleTrackPlayerCommanderDamage: () => {
          set((state) => ({ trackPlayerCommanderDamage: !state.trackPlayerCommanderDamage }));
        },
      };
    },
    {
      name: 'mowu-v3-game-store',
      // v0 persisted settings only; v1 also persists the game in progress.
      // v2: opponent turns carry a cast plan; drop any mid-turn state from older saves.
      version: 2,
      partialize: (state) =>
        Object.fromEntries(PERSISTED_KEYS.map((k) => [k, state[k]])) as Partial<GameStoreState>,
      migrate: (persisted, version) => {
        const saved = (persisted ?? {}) as Partial<SettingsState>;
        if (version < 1) {
          // Old saves have no game in progress: start one that matches the saved settings.
          const settings = { ...DEFAULT_SETTINGS, ...saved };
          return { ...settings, ...createFreshGame(settings) } as unknown as GameStoreState;
        }
        if (version < 2) {
          const game = persisted as Partial<GameStoreState>;
          if (game.turnPhase === 'opponent') {
            // Finish the interrupted opponent turn rather than resuming it in the old format
            return {
              ...game,
              turnPhase: 'player',
              opponentTurnState: null,
              currentDrawnCard: null,
            } as GameStoreState;
          }
        }
        return persisted as GameStoreState;
      },
    },
  ),
);
