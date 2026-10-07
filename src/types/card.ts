import type { CommanderBracket } from './game';

export type EventCategory = 
  | 'creature' 
  | 'board_wipe' 
  | 'removal' 
  | 'tax' 
  | 'disruption' 
  | 'lifegain';

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
  basePower?: number;
  baseToughness?: number;
  initialCounters?: number;
  templateText: string;
  // Scaler computes dynamic card text and stats given current turn & Commander bracket
  computeStats: (turn: number, bracket: CommanderBracket) => {
    renderedText: string;
    power?: number;
    toughness?: number;
    healAmount?: number;      // if card heals the opponent
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
  turnPlayed: number;
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
