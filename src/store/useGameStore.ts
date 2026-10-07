import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import confetti from 'canvas-confetti';
import type { CommanderBracket, GameSettings, TurnSnapshot } from '@/types/game';
import { COMMANDER_BRACKETS } from '@/types/game';
import type { ActivePermanent, ResolvedEvent } from '@/types/card';
import { EVENT_CARDS } from '@/data/cards';

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
  turnSnapshots: TurnSnapshot[];

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
      turnSnapshots: [{ turn: 1, damageThisTurn: 0, opponentHealth: 120, totalDamage: 0, timestamp: Date.now() }],

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

        const bracketConfig = COMMANDER_BRACKETS[state.bracket];
        const freq = state.bracket === 'custom' ? state.customEventFrequency : bracketConfig.eventFrequency;

        if (freq > 0 && nextTurnNum % freq === 0) {
          get().triggerEvent();
        }
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
        let eligible = EVENT_CARDS.filter((c) => (c.minTurn ?? 1) <= state.turn);
        if (eligible.length === 0) eligible = EVENT_CARDS;

        const cardDef = forceCardId
          ? EVENT_CARDS.find((c) => c.id === forceCardId) || eligible[0]
          : eligible[Math.floor(Math.random() * eligible.length)];

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

        set({
          turn: 1,
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
      }),
    }
  )
);
