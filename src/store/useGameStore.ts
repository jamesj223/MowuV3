import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import confetti from 'canvas-confetti';
import type { CommanderBracket, GameSettings, TurnSnapshot } from '@/types/game';
import { COMMANDER_BRACKETS } from '@/types/game';
import type { ActivePermanent, ResolvedEvent } from '@/types/card';
import type { MowuCommander, OpponentTurnState, AttackingCreature } from '@/types/opponent';
import { EVENT_CARDS } from '@/data/cards';
import { pickRandomCommander, pickIdleText } from '@/data/commanders';

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
  winReason: 'life' | 'poison' | 'commander_damage' | null;
  gameStartTime: number;

  // 3-Opponent Alt-Win Trackers (Pod)
  opponentPoison: [number, number, number];
  opponentCommanderDamage: [number, number, number];

  // Floating Delta Accumulator (V1 Debounced style)
  accumulatedDelta: number;
  isDeltaVisible: boolean;
  pendingDamage: number;
  deltaTimerId: ReturnType<typeof setTimeout> | null;

  // Live Turn State
  turn: number;
  turnPhase: 'player' | 'opponent';
  turnSnapshots: TurnSnapshot[];

  // Opponent Turn System
  opponentCommander: MowuCommander | null;
  opponentTurnState: OpponentTurnState | null;

  // Player Counters
  playerLife: number;
  poisonCounters: number;
  commanderDamage: number;

  // Opponent Battlefield & Resolved Log
  activePermanents: ActivePermanent[];
  eventHistory: ResolvedEvent[];
  currentDrawnCard: ActivePermanent | ResolvedEvent | null;

  // Actions
  applyDamageToOpponent: (amount: number) => void;
  applyOpponentHealthChange: (delta: number) => void;
  adjustOpponentPoison: (index: 0 | 1 | 2, amount: number) => void;
  adjustOpponentCommanderDamage: (index: 0 | 1 | 2, amount: number) => void;
  nextTurn: () => void;
  prevTurn: () => void;
  endOpponentTurn: () => void;
  advanceOpponentPhase: () => void;
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

const checkVictory = (
  health: number,
  poison: [number, number, number],
  cmdrDmg: [number, number, number],
  trackOppPoison: boolean,
  trackOppCmdr: boolean
): { isWon: boolean; reason: 'life' | 'poison' | 'commander_damage' | null } => {
  if (health <= 0) return { isWon: true, reason: 'life' };
  if (trackOppPoison && poison[0] >= 10 && poison[1] >= 10 && poison[2] >= 10) {
    return { isWon: true, reason: 'poison' };
  }
  if (trackOppCmdr && cmdrDmg[0] >= 21 && cmdrDmg[1] >= 21 && cmdrDmg[2] >= 21) {
    return { isWon: true, reason: 'commander_damage' };
  }
  return { isWon: false, reason: null };
};

/**
 * Extract attacking creatures from active permanents.
 * A creature attacks if it has power > 0 and does NOT have the Defender keyword.
 */
const getAttackers = (permanents: ActivePermanent[]): AttackingCreature[] => {
  return permanents
    .filter((p) => {
      if (p.power === undefined || p.power <= 0) return false;
      const text = p.renderedText.toLowerCase();
      return !text.includes('defender');
    })
    .map((p) => ({
      instanceId: p.instanceId,
      name: p.name,
      power: p.power ?? 0,
      toughness: p.toughness ?? 0,
      keywords: extractKeywords(p.renderedText),
    }));
};

/**
 * Extract keyword abilities from card rules text for display.
 */
const extractKeywords = (text: string): string => {
  const keywords = ['Haste', 'Trample', 'Flying', 'Vigilance', 'Deathtouch', 'Reach', 'Toxic', 'Lifelink', 'First Strike', 'Double Strike', 'Menace'];
  const found = keywords.filter((kw) => text.toLowerCase().includes(kw.toLowerCase()));
  return found.join(', ');
};

/**
 * Compute what the opponent does on their turn.
 */
const computeOpponentTurn = (
  state: GameStoreState,
): OpponentTurnState => {
  const bracketConfig = COMMANDER_BRACKETS[state.bracket];
  const freq = state.bracket === 'custom' ? state.customEventFrequency : bracketConfig.eventFrequency;
  const hasEvent = freq > 0 && state.turn % freq === 0;
  const attackers = getAttackers(state.activePermanents);

  // Determine starting phase
  let phase: OpponentTurnState['phase'] = 'idle';
  if (hasEvent) {
    phase = 'event';
  } else if (attackers.length > 0) {
    phase = 'combat';
  }

  const commander = state.opponentCommander ?? pickRandomCommander(state.bracket);

  return {
    phase,
    hasEvent,
    attackers,
    idleText: (!hasEvent && attackers.length === 0) ? pickIdleText(commander) : null,
    eventTriggered: false,
  };
};

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
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

      opponentHealth: 120,
      totalDamageDealt: 0,
      isGameOver: false,
      winReason: null,
      gameStartTime: Date.now(),

      opponentPoison: [0, 0, 0],
      opponentCommanderDamage: [0, 0, 0],

      accumulatedDelta: 0,
      isDeltaVisible: false,
      pendingDamage: 0,
      deltaTimerId: null,

      turn: 1,
      turnPhase: 'player',
      turnSnapshots: [{ turn: 1, damageThisTurn: 0, opponentHealth: 120, totalDamage: 0, timestamp: Date.now() }],

      // Opponent Turn System
      opponentCommander: pickRandomCommander('b2'),
      opponentTurnState: null,

      playerLife: 40,
      poisonCounters: 0,
      commanderDamage: 0,

      activePermanents: [],
      eventHistory: [],
      currentDrawnCard: null,

      applyOpponentHealthChange: (delta: number) => {
        const state = get();
        const newHealth = Math.max(0, state.opponentHealth + delta);
        const damageDone = delta < 0 ? Math.abs(delta) : 0;
        const win = checkVictory(
          newHealth,
          state.opponentPoison,
          state.opponentCommanderDamage,
          state.trackOpponentPoison,
          state.trackOpponentCommanderDamage
        );

        if (win.isWon && !state.isGameOver) {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
          });
        }

        if (state.deltaTimerId) {
          clearTimeout(state.deltaTimerId);
        }

        const newAccumulated = state.accumulatedDelta + delta;
        const pendingDamage = delta < 0
          ? state.pendingDamage + damageDone
          : Math.max(0, state.pendingDamage - delta);

        const timerId = setTimeout(() => {
          set((current) => {
            const resolvedDamage = current.pendingDamage;
            const snapshots = [...current.turnSnapshots];
            const lastIdx = snapshots.length - 1;
            if (lastIdx >= 0 && snapshots[lastIdx].turn === current.turn) {
              snapshots[lastIdx] = {
                ...snapshots[lastIdx],
                damageThisTurn: snapshots[lastIdx].damageThisTurn + resolvedDamage,
                totalDamage: current.totalDamageDealt + resolvedDamage,
              };
            }
            return {
              totalDamageDealt: current.totalDamageDealt + resolvedDamage,
              pendingDamage: 0,
              accumulatedDelta: 0,
              isDeltaVisible: false,
              deltaTimerId: null,
              turnSnapshots: snapshots,
            };
          });
        }, 1600);

        set({
          opponentHealth: newHealth,
          pendingDamage,
          isGameOver: win.isWon,
          winReason: win.reason,
          accumulatedDelta: newAccumulated,
          isDeltaVisible: true,
          deltaTimerId: timerId,
        });
      },

      applyDamageToOpponent: (damage: number) => {
        get().applyOpponentHealthChange(-damage);
      },

      adjustOpponentPoison: (index, amount) => {
        const state = get();
        const newPoison = [...state.opponentPoison] as [number, number, number];
        newPoison[index] = Math.max(0, Math.min(10, newPoison[index] + amount));

        const win = checkVictory(
          state.opponentHealth,
          newPoison,
          state.opponentCommanderDamage,
          state.trackOpponentPoison,
          state.trackOpponentCommanderDamage
        );

        if (win.isWon && !state.isGameOver) {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        }

        set({
          opponentPoison: newPoison,
          isGameOver: win.isWon,
          winReason: win.reason,
        });
      },

      adjustOpponentCommanderDamage: (index, amount) => {
        const state = get();
        const newCmdr = [...state.opponentCommanderDamage] as [number, number, number];
        newCmdr[index] = Math.max(0, Math.min(21, newCmdr[index] + amount));

        const win = checkVictory(
          state.opponentHealth,
          state.opponentPoison,
          newCmdr,
          state.trackOpponentPoison,
          state.trackOpponentCommanderDamage
        );

        if (win.isWon && !state.isGameOver) {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        }

        set({
          opponentCommanderDamage: newCmdr,
          isGameOver: win.isWon,
          winReason: win.reason,
        });
      },

      nextTurn: () => {
        const state = get();
        if (state.isGameOver) return;

        // If we're in player phase, transition to opponent phase
        if (state.turnPhase === 'player') {
          // Compute what the opponent will do
          const oppTurn = computeOpponentTurn(state);

          // If bracket is 'off' or there's truly nothing to show, skip opponent turn entirely
          if (state.bracket === 'off' && oppTurn.attackers.length === 0) {
            // Skip straight to next turn like before
            const nextTurnNum = state.turn + 1;
            const snapshots = [
              ...state.turnSnapshots,
              {
                turn: nextTurnNum,
                damageThisTurn: 0,
                opponentHealth: state.opponentHealth,
                totalDamage: state.totalDamageDealt,
                timestamp: Date.now(),
              },
            ];
            set({
              turn: nextTurnNum,
              accumulatedDelta: 0,
              isDeltaVisible: false,
              turnSnapshots: snapshots,
            });
            return;
          }

          // Enter opponent turn
          set({
            turnPhase: 'opponent',
            opponentTurnState: oppTurn,
          });

          // If it's an event turn, trigger the event immediately
          if (oppTurn.hasEvent) {
            get().triggerEvent();
            set((current) => ({
              opponentTurnState: current.opponentTurnState
                ? { ...current.opponentTurnState, eventTriggered: true }
                : null,
            }));
          }
          return;
        }

        // If we're somehow called during opponent phase, end it
        get().endOpponentTurn();
      },

      endOpponentTurn: () => {
        const state = get();
        const nextTurnNum = state.turn + 1;
        const snapshots = [
          ...state.turnSnapshots,
          {
            turn: nextTurnNum,
            damageThisTurn: 0,
            opponentHealth: state.opponentHealth,
            totalDamage: state.totalDamageDealt,
            timestamp: Date.now(),
          },
        ];

        set({
          turn: nextTurnNum,
          turnPhase: 'player',
          opponentTurnState: null,
          accumulatedDelta: 0,
          isDeltaVisible: false,
          turnSnapshots: snapshots,
        });
      },

      advanceOpponentPhase: () => {
        const state = get();
        if (!state.opponentTurnState) return;

        const { phase, hasEvent } = state.opponentTurnState;

        if (phase === 'event') {
          // Re-evaluate attackers now that the event card has resolved (in case creature with haste was played)
          const currentAttackers = getAttackers(state.activePermanents);
          if (currentAttackers.length > 0) {
            set({
              opponentTurnState: {
                ...state.opponentTurnState,
                phase: 'combat',
                attackers: currentAttackers,
              },
              currentDrawnCard: null,
            });
          } else {
            // Nothing else to do — show idle text or pass
            const commander = state.opponentCommander ?? pickRandomCommander(state.bracket);
            const idleText = pickIdleText(commander);
            set({
              opponentTurnState: { ...state.opponentTurnState, phase: 'idle', idleText },
              currentDrawnCard: null,
            });
          }
          return;
        }

        if (phase === 'combat') {
          // Combat completed
          set({
            opponentTurnState: { ...state.opponentTurnState, phase: 'complete' },
          });
          return;
        }

        // idle or complete → end the opponent turn
        get().endOpponentTurn();
      },

      prevTurn: () => {
        const state = get();
        if (state.turn <= 1) return;
        set({ turn: state.turn - 1 });
      },

      adjustPlayerLife: (amount: number) => {
        set((state) => ({ playerLife: state.playerLife + amount }));
      },

      adjustPoison: (amount: number) => {
        set((state) => ({
          poisonCounters: Math.max(0, Math.min(10, state.poisonCounters + amount)),
        }));
      },

      adjustCommanderDamage: (amount: number) => {
        set((state) => ({
          commanderDamage: Math.max(0, Math.min(21, state.commanderDamage + amount)),
        }));
      },

      adjustPermanentCounters: (instanceId, amount) => {
        set((state) => ({
          activePermanents: state.activePermanents.map((permanent) =>
            permanent.instanceId === instanceId
              ? { ...permanent, counters: Math.max(0, permanent.counters + amount) }
              : permanent
          ),
        }));
      },

      dismissPermanent: (instanceId: string) => {
        set((state) => ({
          activePermanents: state.activePermanents.filter((p) => p.instanceId !== instanceId),
        }));
      },

      clearAllPermanents: () => {
        set({ activePermanents: [] });
      },

      triggerEvent: (forceCardId?: string) => {
        const state = get();
        let eligible = EVENT_CARDS.filter((c) => {
          if ((c.minTurn ?? 1) > state.turn) return false;
          if (c.signatureCommanderId && state.opponentCommander?.id !== c.signatureCommanderId) {
            return false;
          }
          return true;
        });
        if (eligible.length === 0) {
          eligible = EVENT_CARDS.filter((c) => !c.signatureCommanderId || state.opponentCommander?.id === c.signatureCommanderId);
        }
        if (eligible.length === 0) eligible = EVENT_CARDS;

        let cardDef;
        if (forceCardId) {
          cardDef = EVENT_CARDS.find((c) => c.id === forceCardId) || eligible[0];
        } else {
          // Apply commander card weights if a commander is active
          const commander = state.opponentCommander;
          if (commander && Object.keys(commander.cardWeights).length > 0) {
            // Weighted random selection
            const weights = eligible.map((c) => commander.cardWeights[c.category] ?? 1.0);
            const totalWeight = weights.reduce((sum, w) => sum + w, 0);
            let roll = Math.random() * totalWeight;
            let idx = 0;
            for (let i = 0; i < weights.length; i++) {
              roll -= weights[i];
              if (roll <= 0) {
                idx = i;
                break;
              }
            }
            cardDef = eligible[idx];
          } else {
            cardDef = eligible[Math.floor(Math.random() * eligible.length)];
          }
        }

        const computed = cardDef.computeStats(state.turn, state.bracket);
        const instanceId = `inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

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
            counters: cardDef.initialCounters ?? 0,
            turnPlayed: state.turn,
          };
          set({
            activePermanents: [perm, ...state.activePermanents],
            currentDrawnCard: perm,
          });
        } else {
          const resolved: ResolvedEvent = {
            instanceId,
            cardId: cardDef.id,
            name: cardDef.name,
            typeLine: cardDef.typeLine,
            artFile: cardDef.artFile,
            renderedText: computed.renderedText,
            turnResolved: state.turn,
          };

          if (computed.healAmount && computed.healAmount > 0) {
            get().applyOpponentHealthChange(computed.healAmount);
          }

          set({
            eventHistory: [resolved, ...state.eventHistory],
            currentDrawnCard: resolved,
          });
        }
      },

      closeDrawnCard: () => {
        set({ currentDrawnCard: null });
      },

      resetGame: () => {
        const state = get();
        if (state.deltaTimerId) clearTimeout(state.deltaTimerId);

        // Pick a new commander for the current bracket
        const commander = pickRandomCommander(state.bracket);

        set({
          turn: 1,
          turnPhase: 'player',
          opponentHealth: state.startingOpponentHealth,
          totalDamageDealt: 0,
          accumulatedDelta: 0,
          isDeltaVisible: false,
          deltaTimerId: null,
          isGameOver: false,
          winReason: null,
          gameStartTime: Date.now(),
          playerLife: state.startingPlayerLife,
          poisonCounters: 0,
          commanderDamage: 0,
          opponentPoison: [0, 0, 0],
          opponentCommanderDamage: [0, 0, 0],
          activePermanents: [],
          eventHistory: [],
          currentDrawnCard: null,
          opponentCommander: commander,
          opponentTurnState: null,
          turnSnapshots: [
            {
              turn: 1,
              damageThisTurn: 0,
              opponentHealth: state.startingOpponentHealth,
              totalDamage: 0,
              timestamp: Date.now(),
            },
          ],
        });
      },

      startNewGame: (settings) => {
        const state = get();
        if (state.deltaTimerId) clearTimeout(state.deltaTimerId);

        const startHealth = settings.startingOpponentHealth ?? state.startingOpponentHealth;
        const playerLife = settings.startingPlayerLife ?? state.startingPlayerLife;
        const bracket = settings.bracket ?? state.bracket;
        const customFreq = settings.customEventFrequency ?? state.customEventFrequency;
        const deck = settings.deckName ?? state.currentDeckName;

        // Pick a commander for the new bracket
        const commander = pickRandomCommander(bracket);

        set({
          startingOpponentHealth: startHealth,
          startingPlayerLife: playerLife,
          bracket,
          customEventFrequency: customFreq,
          trackPlayer: settings.trackPlayer ?? state.trackPlayer,
          trackPlayerPoison: settings.trackPlayerPoison ?? state.trackPlayerPoison,
          trackPlayerCommanderDamage: settings.trackPlayerCommanderDamage ?? state.trackPlayerCommanderDamage,
          trackOpponentPoison: settings.trackOpponentPoison ?? state.trackOpponentPoison,
          trackOpponentCommanderDamage: settings.trackOpponentCommanderDamage ?? state.trackOpponentCommanderDamage,
          currentDeckName: deck,
          turn: 1,
          turnPhase: 'player',
          opponentHealth: startHealth,
          totalDamageDealt: 0,
          accumulatedDelta: 0,
          isDeltaVisible: false,
          pendingDamage: 0,
          deltaTimerId: null,
          isGameOver: false,
          winReason: null,
          gameStartTime: Date.now(),
          playerLife,
          poisonCounters: 0,
          commanderDamage: 0,
          opponentPoison: [0, 0, 0],
          opponentCommanderDamage: [0, 0, 0],
          activePermanents: [],
          eventHistory: [],
          currentDrawnCard: null,
          opponentCommander: commander,
          opponentTurnState: null,
          turnSnapshots: [
            {
              turn: 1,
              damageThisTurn: 0,
              opponentHealth: startHealth,
              totalDamage: 0,
              timestamp: Date.now(),
            },
          ],
        });
      },

      updateSettings: (settings) => {
        set((state) => ({ ...state, ...settings }));
      },

      toggleTrackOpponentPoison: () => {
        set((state) => ({ trackOpponentPoison: !state.trackOpponentPoison }));
      },

      toggleTrackOpponentCommanderDamage: () => {
        set((state) => ({ trackOpponentCommanderDamage: !state.trackOpponentCommanderDamage }));
      },

      toggleTrackPlayerPoison: () => {
        set((state) => ({ trackPlayerPoison: !state.trackPlayerPoison }));
      },

      toggleTrackPlayerCommanderDamage: () => {
        set((state) => ({ trackPlayerCommanderDamage: !state.trackPlayerCommanderDamage }));
      },
    }),
    {
      name: 'mowu-v3-game-store',
      partialize: (state) => ({
        startingOpponentHealth: state.startingOpponentHealth,
        startingPlayerLife: state.startingPlayerLife,
        bracket: state.bracket,
        customEventFrequency: state.customEventFrequency,
        trackPlayer: state.trackPlayer,
        trackPlayerPoison: state.trackPlayerPoison,
        trackPlayerCommanderDamage: state.trackPlayerCommanderDamage,
        trackOpponentPoison: state.trackOpponentPoison,
        trackOpponentCommanderDamage: state.trackOpponentCommanderDamage,
        currentDeckName: state.currentDeckName,
        opponentCommander: state.opponentCommander,
      }),
    }
  )
);
