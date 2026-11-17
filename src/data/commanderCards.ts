/**
 * Each Mowu's commander card. Mowu casts these from the command zone (not from
 * the random card pool); recasting costs commander tax. Linked to a commander
 * by `signatureCommanderId`.
 *
 * B1 gimmick commanders are vanilla (stats, art and flavour only). Archetype
 * commanders carry their playbook's printed text, which must follow ADR-019:
 * static or triggered text only, no activated abilities, nothing that works
 * from the command zone.
 *
 * Art: replace the blank canvases in public/cards/ (run `npm run placeholders`).
 */
import type { CardEffect, EventCardDefinition, StaticBuff } from '@/types/card';

const commanderCard = (
  card: Omit<EventCardDefinition, 'isPermanent' | 'category' | 'templateText' | 'computeStats'> & {
    rulesText?: string;
    power: number;
    toughness: number;
    upkeep?: CardEffect[];
    buff?: StaticBuff;
  },
): EventCardDefinition => {
  const { rulesText = '', power, toughness, upkeep, buff, ...rest } = card;
  return {
    ...rest,
    category: 'creature',
    isPermanent: true,
    basePower: power,
    baseToughness: toughness,
    templateText: rulesText,
    computeStats: () => ({ renderedText: rulesText, power, toughness, upkeep, buff }),
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
    counterType: 'study',
    initialCounters: 0,
    flavorText: 'Has read every book in the library. Has chewed most of them.',
    rulesText:
      "At the beginning of Mowu's upkeep, put a study counter on Scholar Mowu. Then if it has three or more, remove three and you discard a card at random.",
    upkeep: [
      { type: 'counters', target: 'self', amount: 1 },
      { type: 'threshold', threshold: 3, text: 'Lesson time! Scholar Mowu removes three study counters: you discard a card at random.' },
    ],
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
    rulesText: "Vigilance.\nAt the beginning of Mowu's upkeep, put a +1/+1 counter on Mecha-Mowu.",
    upkeep: [{ type: 'counters', target: 'self', amount: 1 }],
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
    rulesText: "Haste.\nAt the beginning of Mowu's upkeep, create a 1/1 Pup Soldier creature token.",
    upkeep: [{ type: 'create-tokens', tokenId: 'token-pup-soldier', count: 1 }],
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
    rulesText:
      'Toxic 1. (Players dealt combat damage by this creature also get a poison counter.)\nOther creatures Mowu controls have Toxic 1.',
    buff: { target: 'creatures', power: 0, toughness: 0, keywords: ['Toxic 1'] },
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
    rulesText: 'Flying.\nCombo pieces Mowu controls have hexproof. (You can\'t target them.)',
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
