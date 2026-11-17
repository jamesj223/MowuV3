import type { CommanderBracket } from './game';
import type { EventCategory } from './card';

export interface MowuCommander {
  id: string;
  name: string;
  title: string;
  brackets: CommanderBracket[];      // which brackets this commander can appear in
  archetype: string;
  flavour: string;
  avatar: string;                     // emoji avatar
  accentColor: string;               // tailwind color classes for theming
  idleTexts: string[];               // flavour text when opponent has nothing to do
  cardWeights: Partial<Record<EventCategory, number>>; // bias for card selection (1.0 = normal)
}

export type OpponentTurnPhase = 'event' | 'combat' | 'idle' | 'complete';

export interface AttackingCreature {
  instanceId: string;
  name: string;
  power: number;
  toughness: number;
  count: number;     // number of bodies (swarms attack with several)
  keywords: string;  // extracted from renderedText
}

/** One card Mowu cast this turn, for the turn log. */
export interface OpponentCast {
  instanceId: string;
  cardId: string;
  name: string;
  countered: boolean;
}

export interface OpponentTurnState {
  phase: OpponentTurnPhase;
  hasEvent: boolean;
  attackers: AttackingCreature[];
  idleText: string | null;
  eventTriggered: boolean;          // whether the event card has already been triggered
  manaBudget: number;               // Mowu's mana this turn
  plannedCardIds: string[];         // cards Mowu will cast this turn, in order
  casts: OpponentCast[];            // cards cast so far this turn (turn log)
}
