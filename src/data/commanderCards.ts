/**
 * Each Mowu's commander card. Mowu casts these from the command zone (not from
 * the random card pool); recasting costs commander tax. Linked to a commander
 * by `signatureCommanderId`.
 *
 * Batch 2 versions: B1 gimmick commanders are vanilla (stats, art and flavour
 * only). Archetype abilities arrive with each playbook in Phase 3 Batch 3, and
 * must follow ADR-019 (static or triggered printed text only, no activated
 * abilities, nothing that works from the command zone).
 *
 * Art: replace the blank canvases in public/cards/ (run `npm run placeholders`).
 */
import type { EventCardDefinition } from '@/types/card';

const commanderCard = (
  card: Omit<EventCardDefinition, 'isPermanent' | 'category' | 'templateText' | 'computeStats'> & {
    rulesText?: string;
    power: number;
    toughness: number;
  },
): EventCardDefinition => {
  const { rulesText = '', power, toughness, ...rest } = card;
  return {
    ...rest,
    category: 'creature',
    isPermanent: true,
    basePower: power,
    baseToughness: toughness,
    templateText: rulesText,
    computeStats: () => ({ renderedText: rulesText, power, toughness }),
  };
};

export const COMMANDER_CARDS: EventCardDefinition[] = [
  commanderCard({
    id: 'commander-left-facing',
    signatureCommanderId: 'left-facing',
    name: 'Left-Facing Mowu',
    manaCost: '{2}{W}',
    typeLine: 'Legendary Creature — Dog Purist',
    artFile: 'commander-left-facing.png',
    power: 2,
    toughness: 3,
    flavorText: 'He was painted facing right once. He has not spoken to the artist since.',
  }),
  commanderCard({
    id: 'commander-chair-sitting',
    signatureCommanderId: 'chair-sitting',
    name: 'Chair-Sitting Mowu',
    manaCost: '{2}{G}',
    typeLine: 'Legendary Creature — Dog Loafer',
    artFile: 'commander-chair-sitting.png',
    power: 1,
    toughness: 4,
    flavorText: 'Undefeated in seven consecutive games of musical chairs, mostly by never getting up.',
  }),
  commanderCard({
    id: 'tax-collector-mowu',
    signatureCommanderId: 'tax-collector',
    name: 'Tax Collector Mowu',
    manaCost: '{2}{G}{W}',
    typeLine: 'Legendary Creature — Good Boy Taxer',
    artFile: 'tax-collector-mowu.png',
    power: 3,
    toughness: 3,
    initialCounters: 0,
    counterType: 'plus-one',
    flavorText: 'A very good boy who demands his treat taxes promptly.',
    rulesText:
      'Haste, Vigilance.\nWhenever you cast your second spell each turn, Mowu gets a +1/+1 counter and you lose 2 life.',
  }),
  commanderCard({
    id: 'commander-scholar',
    signatureCommanderId: 'scholar',
    name: 'Scholar Mowu',
    manaCost: '{2}{U}',
    typeLine: 'Legendary Creature — Dog Wizard',
    artFile: 'commander-scholar.png',
    power: 1,
    toughness: 4,
    flavorText: 'Has read every book in the library. Has chewed most of them.',
  }),
  commanderCard({
    id: 'commander-mecha',
    signatureCommanderId: 'mecha',
    name: 'Mecha-Mowu',
    manaCost: '{3}',
    typeLine: 'Legendary Artifact Creature — Dog Construct',
    artFile: 'commander-mecha.png',
    power: 3,
    toughness: 3,
    initialCounters: 0,
    counterType: 'plus-one',
    flavorText: 'Good boy, upgraded. Fetch protocol: online.',
    rulesText: 'Vigilance.',
  }),
  commanderCard({
    id: 'commander-warlord',
    signatureCommanderId: 'warlord',
    name: 'Warlord Mowu',
    manaCost: '{2}{R}{W}',
    typeLine: 'Legendary Creature — Dog Warrior',
    artFile: 'commander-warlord.png',
    power: 3,
    toughness: 3,
    flavorText: 'Fetch is mandatory. Retreat is not in his vocabulary, mainly because he is a dog.',
    rulesText: 'Haste.',
  }),
  commanderCard({
    id: 'commander-alchemist',
    signatureCommanderId: 'alchemist',
    name: 'Alchemist Mowu',
    manaCost: '{1}{B}{G}',
    typeLine: 'Legendary Creature — Dog Alchemist',
    artFile: 'commander-alchemist.png',
    power: 2,
    toughness: 2,
    flavorText: 'Tail wagging optional. Safety goggles also, apparently, optional.',
    rulesText: 'Toxic 1. (Players dealt combat damage by this creature also get a poison counter.)',
  }),
  commanderCard({
    id: 'commander-archmage',
    signatureCommanderId: 'archmage',
    name: 'Archmage Mowu',
    manaCost: '{2}{U}{R}',
    typeLine: 'Legendary Creature — Dog Wizard',
    artFile: 'commander-archmage.png',
    power: 2,
    toughness: 4,
    flavorText: 'Such combo. Much wow. Very infinite.',
    rulesText: 'Flying.',
  }),
];

/** The commander card for a Mowu commander id, if any. */
export const getCommanderCard = (commanderId: string | undefined): EventCardDefinition | undefined =>
  commanderId ? COMMANDER_CARDS.find((c) => c.signatureCommanderId === commanderId) : undefined;

/** Every card definition, for lookups by id (pool cards + commander cards). */
export const findCardDefinition = (
  cardId: string,
  pool: EventCardDefinition[],
): EventCardDefinition | undefined =>
  pool.find((c) => c.id === cardId) ?? COMMANDER_CARDS.find((c) => c.id === cardId);
