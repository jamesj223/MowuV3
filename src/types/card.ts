import type { CommanderBracket } from './game';

export type EventCategory = 
  | 'creature' 
  | 'board_wipe' 
  | 'removal' 
  | 'tax' 
  | 'disruption' 
  | 'lifegain';

/**
 * How a permanent's counters are interpreted:
 * - 'plus-one': +1/+1 counters added to power and toughness.
 * - 'swarm': number of identical bodies (each attacks separately).
 */
export type CounterType = 'plus-one' | 'swarm';

export interface EventCardDefinition {
  id: string;
  name: string;
  manaCost: string;
  typeLine: string;
  artFile: string;             // relative to /cards/
  category: EventCategory;
  isPermanent: boolean;       // creatures & enchantments stay on battlefield
  minTurn?: number;           // turns before this can appear
  flavorText?: string;
  signatureCommanderId?: string; // only this commander can cast this card
  basePower?: number;
  baseToughness?: number;
  initialCounters?: number;
  counterType?: CounterType;
  templateText: string;
  // Scaler computes dynamic card text and stats given current turn & Commander bracket
  computeStats: (turn: number, bracket: CommanderBracket) => {
    renderedText: string;
    power?: number;
    toughness?: number;
    healAmount?: number;      // if card heals the opponent
    counters?: number;        // overrides initialCounters (e.g. scaled swarm size)
  };
}

export interface ActivePermanent {
  instanceId: string;
  cardId: string;
  name: string;
  manaCost: string;
  typeLine: string;
  artFile: string;
  renderedText: string;
  flavorText?: string;
  power?: number;
  toughness?: number;
  counters: number;
  counterType?: CounterType;
  turnPlayed: number;
  enteredOnOpponentTurn?: boolean; // for summoning sickness
}

export interface ResolvedEvent {
  instanceId: string;
  cardId: string;
  name: string;
  typeLine: string;
  artFile: string;
  renderedText: string;
  turnResolved: number;
}
