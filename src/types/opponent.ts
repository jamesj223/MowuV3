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
  keywords: string;  // extracted from renderedText
}

export interface OpponentTurnState {
  phase: OpponentTurnPhase;
  hasEvent: boolean;
  attackers: AttackingCreature[];
  idleText: string | null;
  eventTriggered: boolean;          // whether the event card has already been triggered
}
