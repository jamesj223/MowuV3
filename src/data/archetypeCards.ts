/**
 * Archetype playbooks (Phase 3 Batch 3): each Mowu's own cards, plus tokens.
 *
 * Card text convention: "you" is the player, "Mowu" is the opponent.
 * Effects in `effects` / `upkeep` / `buff` are applied by the app; anything
 * else in the text (discard, pay, untap restrictions) the player resolves.
 * Every effect comes from a cast card or printed text on a permanent (ADR-019).
 *
 * Art: blank canvases are created by `npm run placeholders`.
 */
import type { CardStats, EventCardDefinition } from '@/types/card';
import type { CommanderBracket } from '@/types/game';

type CardInput = Omit<EventCardDefinition, 'templateText' | 'computeStats'> & {
  stats: (turn: number, bracket: CommanderBracket) => CardStats;
};

const card = ({ stats, ...rest }: CardInput): EventCardDefinition => ({
  ...rest,
  templateText: stats(1, 'b2').renderedText,
  computeStats: stats,
});

/** Pick a value by bracket: [B1–B2 (and custom), B3, B4, B5]. */
const byBracket = <T,>(bracket: CommanderBracket, [low, b3, b4, b5]: [T, T, T, T]): T =>
  bracket === 'b5' ? b5 : bracket === 'b4' ? b4 : bracket === 'b3' ? b3 : low;

const plural = (n: number, word: string) => `${n === 1 ? 'a' : n} ${word}${n === 1 ? '' : 's'}`;

// ─── Tokens (created by effects, never cast directly) ────────────────────────

export const TOKEN_CARDS: EventCardDefinition[] = [
  card({
    id: 'token-pup-soldier',
    name: 'Pup Soldier',
    manaCost: '',
    typeLine: 'Token Creature — Dog Soldier',
    artFile: 'token-pup-soldier.png',
    category: 'creature',
    isPermanent: true,
    basePower: 1,
    baseToughness: 1,
    flavorText: 'Sit. Stay. Charge!',
    stats: () => ({ renderedText: "This creature can't block.", power: 1, toughness: 1 }),
  }),
  card({
    id: 'token-toxic-spore',
    name: 'Toxic Spore',
    manaCost: '',
    typeLine: 'Token Creature — Fungus',
    artFile: 'token-toxic-spore.png',
    category: 'creature',
    isPermanent: true,
    basePower: 1,
    baseToughness: 1,
    flavorText: 'Do not sniff.',
    stats: () => ({ renderedText: "Toxic 1.\nThis creature can't block.", power: 1, toughness: 1 }),
  }),
];

export const TOKENS_BY_ID: Record<string, EventCardDefinition> = Object.fromEntries(
  TOKEN_CARDS.map((t) => [t.id, t]),
);

// ─── Mecha-Mowu: Voltron / equipment ─────────────────────────────────────────

const MECHA = ['mecha'];
const mechaCards: EventCardDefinition[] = [
  card({
    id: 'mecha-rocket-boots',
    name: 'Rocket Boots',
    manaCost: '{1}',
    typeLine: 'Artifact — Equipment',
    artFile: 'mecha-rocket-boots.png',
    category: 'creature',
    isPermanent: true,
    exclusiveTo: MECHA,
    flavorText: 'Zoomies, now with thrust.',
    stats: (_t, b) => {
      const p = byBracket(b, [1, 2, 2, 2]);
      return {
        renderedText: `Mowu's commander gets +${p}/+0 and has Haste.`,
        buff: { target: 'commander', power: p, toughness: 0, keywords: ['Haste'] },
      };
    },
  }),
  card({
    id: 'mecha-laser-collar',
    name: 'Laser Collar',
    manaCost: '{2}',
    typeLine: 'Artifact — Equipment',
    artFile: 'mecha-laser-collar.png',
    category: 'creature',
    isPermanent: true,
    exclusiveTo: MECHA,
    minTurn: 2,
    flavorText: 'The red dot finally fights back.',
    stats: (_t, b) => {
      const p = byBracket(b, [2, 3, 3, 3]);
      return {
        renderedText: `Mowu's commander gets +${p}/+0 and has Trample.`,
        buff: { target: 'commander', power: p, toughness: 0, keywords: ['Trample'] },
      };
    },
  }),
  card({
    id: 'mecha-titanium-plating',
    name: 'Titanium Plating',
    manaCost: '{3}',
    typeLine: 'Artifact — Equipment',
    artFile: 'mecha-titanium-plating.png',
    category: 'creature',
    isPermanent: true,
    exclusiveTo: MECHA,
    minTurn: 3,
    flavorText: 'Belly rubs now require a wrench.',
    stats: (_t, b) => {
      const t = byBracket(b, [3, 4, 4, 4]);
      return {
        renderedText: `Mowu's commander gets +1/+${t} and has Vigilance.`,
        buff: { target: 'commander', power: 1, toughness: t, keywords: ['Vigilance'] },
      };
    },
  }),
  card({
    id: 'mecha-jet-pack',
    name: 'Jet Pack',
    manaCost: '{2}',
    typeLine: 'Artifact — Equipment',
    artFile: 'mecha-jet-pack.png',
    category: 'creature',
    isPermanent: true,
    exclusiveTo: MECHA,
    minBracket: 3,
    minTurn: 3,
    flavorText: 'Fetch, but from above.',
    stats: () => ({
      renderedText: "Mowu's commander gets +1/+1 and has Flying.",
      buff: { target: 'commander', power: 1, toughness: 1, keywords: ['Flying'] },
    }),
  }),
  card({
    id: 'mecha-oil-change',
    name: 'Oil Change',
    manaCost: '{1}',
    typeLine: 'Sorcery',
    artFile: 'mecha-oil-change.png',
    category: 'creature',
    isPermanent: false,
    exclusiveTo: MECHA,
    requires: ['commander-on-battlefield'],
    flavorText: 'Synthetic. Only the best for a good boy.',
    stats: (_t, b) => {
      const n = byBracket(b, [1, 2, 2, 2]);
      return {
        renderedText: `Put ${plural(n, '+1/+1 counter')} on Mowu's commander.`,
        effects: [{ type: 'counters', target: 'commander', amount: n }],
      };
    },
  }),
];

// ─── Warlord Mowu: aggro / tokens ────────────────────────────────────────────

const WARLORD = ['warlord'];
const pupTokens = (n: number) =>
  `Create ${n === 1 ? 'a 1/1 Pup Soldier creature token' : `${n} 1/1 Pup Soldier creature tokens`}.`;
const warlordCards: EventCardDefinition[] = [
  card({
    id: 'warlord-recruit',
    name: 'Recruitment Drive',
    manaCost: '{W}',
    typeLine: 'Sorcery',
    artFile: 'warlord-recruit.png',
    category: 'creature',
    isPermanent: false,
    exclusiveTo: WARLORD,
    flavorText: 'Free treats for every new enlistee.',
    stats: (_t, b) => {
      const n = byBracket(b, [1, 1, 2, 2]);
      return { renderedText: pupTokens(n), effects: [{ type: 'create-tokens', tokenId: 'token-pup-soldier', count: n }] };
    },
  }),
  card({
    id: 'warlord-muster',
    name: 'Muster the Pups',
    manaCost: '{1}{W}',
    typeLine: 'Sorcery',
    artFile: 'warlord-muster.png',
    category: 'creature',
    isPermanent: false,
    exclusiveTo: WARLORD,
    minTurn: 2,
    flavorText: 'Line up! Noses forward!',
    stats: (_t, b) => {
      const n = byBracket(b, [2, 3, 4, 4]);
      return { renderedText: pupTokens(n), effects: [{ type: 'create-tokens', tokenId: 'token-pup-soldier', count: n }] };
    },
  }),
  card({
    id: 'warlord-war-horn',
    name: 'War Horn',
    manaCost: '{1}{R}',
    typeLine: 'Enchantment',
    artFile: 'warlord-war-horn.png',
    category: 'creature',
    isPermanent: true,
    exclusiveTo: WARLORD,
    minTurn: 2,
    flavorText: 'Sounds suspiciously like a squeaky toy.',
    stats: () => ({
      renderedText: 'Pup Soldiers Mowu controls get +1/+0 and have Haste.',
      buff: { target: 'tokens', tokenId: 'token-pup-soldier', power: 1, toughness: 0, keywords: ['Haste'] },
    }),
  }),
  card({
    id: 'warlord-pack-banner',
    name: 'Pack Banner',
    manaCost: '{2}{W}',
    typeLine: 'Enchantment',
    artFile: 'warlord-pack-banner.png',
    category: 'creature',
    isPermanent: true,
    exclusiveTo: WARLORD,
    minBracket: 3,
    minTurn: 4,
    flavorText: 'A paw print on a stick. Morale has never been higher.',
    stats: () => ({
      renderedText: 'Creatures Mowu controls get +1/+1.',
      buff: { target: 'creatures', power: 1, toughness: 1 },
    }),
  }),
  card({
    id: 'warlord-release-the-hounds',
    name: 'Release the Hounds',
    manaCost: '{3}{R}{W}',
    typeLine: 'Sorcery',
    artFile: 'warlord-release-the-hounds.png',
    category: 'creature',
    isPermanent: false,
    exclusiveTo: WARLORD,
    minTurn: 5,
    flavorText: 'Someone opened the gate to the dog park.',
    stats: (_t, b) => {
      const n = byBracket(b, [4, 5, 6, 6]);
      return { renderedText: pupTokens(n), effects: [{ type: 'create-tokens', tokenId: 'token-pup-soldier', count: n }] };
    },
  }),
];

// ─── Alchemist Mowu: poison / infect ─────────────────────────────────────────

const ALCHEMIST = ['alchemist'];
const alchemistCards: EventCardDefinition[] = [
  card({
    id: 'alchemist-plague-rat',
    name: 'Plague Rat',
    manaCost: '{B}',
    typeLine: 'Creature — Rat',
    artFile: 'alchemist-plague-rat.png',
    category: 'creature',
    isPermanent: true,
    exclusiveTo: ALCHEMIST,
    basePower: 1,
    baseToughness: 1,
    flavorText: "Mowu's lab assistant. Unpaid. Unwashed.",
    stats: () => ({ renderedText: 'Haste, Toxic 1.', power: 1, toughness: 1 }),
  }),
  card({
    id: 'alchemist-toxic-spores',
    name: 'Toxic Spores',
    manaCost: '{1}{G}',
    typeLine: 'Sorcery',
    artFile: 'alchemist-toxic-spores.png',
    category: 'creature',
    isPermanent: false,
    exclusiveTo: ALCHEMIST,
    flavorText: 'Accidentally left the cauldron lid off. Again.',
    stats: (_t, b) => {
      const n = byBracket(b, [2, 2, 3, 3]);
      return {
        renderedText: `Create ${n} 1/1 Toxic Spore creature tokens with Toxic 1.`,
        effects: [{ type: 'create-tokens', tokenId: 'token-toxic-spore', count: n }],
      };
    },
  }),
  card({
    id: 'alchemist-vial-of-venom',
    name: 'Vial of Venom',
    manaCost: '{1}{B}',
    typeLine: 'Sorcery',
    artFile: 'alchemist-vial-of-venom.png',
    category: 'disruption',
    isPermanent: false,
    exclusiveTo: ALCHEMIST,
    requires: ['player-poisoned'],
    flavorText: 'Label reads "drink me". Do not.',
    stats: (_t, b) => {
      const n = byBracket(b, [1, 1, 2, 2]);
      return {
        renderedText: `If you have any poison counters, you get ${plural(n, 'more poison counter')}.`,
        effects: [{ type: 'player-poison', amount: n, onlyIfPoisoned: true }],
      };
    },
  }),
  card({
    id: 'alchemist-bubbling-cauldron',
    name: 'Bubbling Cauldron',
    manaCost: '{3}',
    typeLine: 'Artifact',
    artFile: 'alchemist-bubbling-cauldron.png',
    category: 'disruption',
    isPermanent: true,
    exclusiveTo: ALCHEMIST,
    minTurn: 4,
    flavorText: 'Simmer for three turns. Stir with tail.',
    stats: () => ({
      renderedText: "At the beginning of Mowu's upkeep, if you have any poison counters, you get another poison counter.",
      upkeep: [{ type: 'player-poison', amount: 1, onlyIfPoisoned: true }],
    }),
  }),
];

// ─── Scholar Mowu: control / draw ────────────────────────────────────────────

const SCHOLAR = ['scholar'];
const scholarCards: EventCardDefinition[] = [
  card({
    id: 'scholar-pop-quiz',
    name: 'Pop Quiz',
    manaCost: '{U}',
    typeLine: 'Instant',
    artFile: 'scholar-pop-quiz.png',
    category: 'disruption',
    isPermanent: false,
    exclusiveTo: SCHOLAR,
    flavorText: 'Pencils down. Paws up.',
    stats: (_t, b) => {
      const pay = byBracket(b, [2, 2, 3, 3]);
      return { renderedText: `You discard a card at random unless you pay {${pay}}.` };
    },
  }),
  card({
    id: 'scholar-homework',
    name: 'Homework',
    manaCost: '{1}{U}',
    typeLine: 'Enchantment',
    artFile: 'scholar-homework.png',
    category: 'tax',
    isPermanent: true,
    exclusiveTo: SCHOLAR,
    flavorText: 'The dog did not eat it. The dog assigned it.',
    stats: (_t, b) => {
      const tax = byBracket(b, [1, 1, 2, 2]);
      return { renderedText: `The first noncreature spell you cast each turn costs {${tax}} more.` };
    },
  }),
  card({
    id: 'scholar-study-group',
    name: 'Study Group',
    manaCost: '{1}{U}',
    typeLine: 'Sorcery',
    artFile: 'scholar-study-group.png',
    category: 'disruption',
    isPermanent: false,
    exclusiveTo: SCHOLAR,
    requires: ['commander-on-battlefield'],
    flavorText: 'Mostly naps, but with flashcards.',
    stats: () => ({
      renderedText: "Put two study counters on Mowu's commander.",
      effects: [{ type: 'counters', target: 'commander', amount: 2 }],
    }),
  }),
  card({
    id: 'scholar-detention',
    name: 'Detention',
    manaCost: '{2}{U}',
    typeLine: 'Enchantment',
    artFile: 'scholar-detention.png',
    category: 'removal',
    isPermanent: true,
    exclusiveTo: SCHOLAR,
    minTurn: 3,
    flavorText: 'Sit. Stay. Think about what you did.',
    stats: () => ({ renderedText: "Your creature with the highest power doesn't untap during your untap step." }),
  }),
];

// ─── Tax Collector Mowu: taxes / stax ────────────────────────────────────────

const TAX = ['tax-collector'];
const taxCards: EventCardDefinition[] = [
  card({
    id: 'tax-audit',
    name: 'Surprise Audit',
    manaCost: '{W}',
    typeLine: 'Sorcery',
    artFile: 'tax-audit.png',
    category: 'tax',
    isPermanent: false,
    exclusiveTo: TAX,
    requires: ['tax-permanent'],
    flavorText: 'Every treat must be accounted for.',
    stats: () => ({
      renderedText: 'Put a tax counter on each permanent Mowu controls with tax counters on it.',
      effects: [{ type: 'counters', target: 'tax-permanents', amount: 1 }],
    }),
  }),
  card({
    id: 'tax-late-fee',
    name: 'Late Fee',
    manaCost: '{1}{W}',
    typeLine: 'Enchantment',
    artFile: 'tax-late-fee.png',
    category: 'tax',
    isPermanent: true,
    exclusiveTo: TAX,
    counterType: 'tax',
    initialCounters: 1,
    flavorText: 'Compounding interest, compounded daily, by a dog.',
    stats: () => ({
      renderedText:
        'Late Fee enters with a tax counter.\nAt the beginning of your upkeep, pay {1} for each tax counter on Late Fee or lose 2 life.',
    }),
  }),
  card({
    id: 'tax-paperwork-pile',
    name: 'Paperwork Pile',
    manaCost: '{G}',
    typeLine: 'Artifact',
    artFile: 'tax-paperwork-pile.png',
    category: 'tax',
    isPermanent: true,
    exclusiveTo: TAX,
    flavorText: 'Form 27-B, now in quadruplicate.',
    stats: () => ({ renderedText: 'The first spell you cast each turn costs {1} more.' }),
  }),
  card({
    id: 'tax-rule-of-paw',
    name: 'Rule of Paw',
    manaCost: '{2}{W}',
    typeLine: 'Legendary Enchantment',
    artFile: 'tax-rule-of-paw.png',
    category: 'tax',
    isPermanent: true,
    exclusiveTo: TAX,
    minBracket: 5,
    minTurn: 3,
    flavorText: 'One treat per turn. No exceptions. Not even for you.',
    stats: () => ({ renderedText: "Each player can't cast more than one spell each turn." }),
  }),
];

// ─── Archmage Mowu: combo ────────────────────────────────────────────────────

const ARCHMAGE = ['archmage'];
const comboText = (piece: string, bracket: CommanderBracket) => {
  const needed = bracket === 'b5' ? 'A and B' : 'A, B and C';
  const count = bracket === 'b5' ? 2 : 3;
  return `Combo piece ${piece} (of ${count}).\nAt the beginning of Mowu's turn, if he controls combo pieces ${needed}, you lose the game.`;
};
const archmageCards: EventCardDefinition[] = [
  card({
    id: 'archmage-combo-a',
    name: 'Infinite Loop Engine',
    manaCost: '{2}{U}',
    typeLine: 'Legendary Artifact',
    artFile: 'archmage-combo-a.png',
    category: 'combo',
    isPermanent: true,
    exclusiveTo: ARCHMAGE,
    comboPiece: 'A',
    minTurn: 2,
    flavorText: 'Goes around and around, like a dog chasing its tail.',
    stats: (_t, b) => ({ renderedText: comboText('A', b) }),
  }),
  card({
    id: 'archmage-combo-b',
    name: 'Bottomless Treat Dispenser',
    manaCost: '{1}{U}{R}',
    typeLine: 'Legendary Enchantment',
    artFile: 'archmage-combo-b.png',
    category: 'combo',
    isPermanent: true,
    exclusiveTo: ARCHMAGE,
    comboPiece: 'B',
    minTurn: 3,
    flavorText: 'Every treat dispensed refills the dispenser. Do the math.',
    stats: (_t, b) => ({ renderedText: comboText('B', b) }),
  }),
  card({
    id: 'archmage-combo-c',
    name: 'Familiar of Recursion',
    manaCost: '{2}{R}',
    typeLine: 'Legendary Creature — Dog Familiar',
    artFile: 'archmage-combo-c.png',
    category: 'combo',
    isPermanent: true,
    exclusiveTo: ARCHMAGE,
    comboPiece: 'C',
    maxBracket: 4,
    minTurn: 4,
    basePower: 0,
    baseToughness: 3,
    flavorText: 'Fetches the ball that fetches the ball.',
    stats: (_t, b) => ({ renderedText: `Defender.\n${comboText('C', b)}`, power: 0, toughness: 3 }),
  }),
  card({
    id: 'archmage-spell-snare',
    name: 'Spell Snare',
    manaCost: '{U}',
    typeLine: 'Instant',
    artFile: 'archmage-spell-snare.png',
    category: 'disruption',
    isPermanent: false,
    exclusiveTo: ARCHMAGE,
    flavorText: '"In response..."',
    stats: () => ({ renderedText: 'The first spell you cast during your next turn costs {2} more.' }),
  }),
  card({
    id: 'archmage-thought-leash',
    name: 'Thought Leash',
    manaCost: '{1}{U}',
    typeLine: 'Sorcery',
    artFile: 'archmage-thought-leash.png',
    category: 'disruption',
    isPermanent: false,
    exclusiveTo: ARCHMAGE,
    flavorText: 'Walkies, but for your hand.',
    stats: () => ({ renderedText: 'You discard a card at random.' }),
  }),
  card({
    id: 'archmage-arcane-sentinel',
    name: 'Arcane Sentinel',
    manaCost: '{1}{U}',
    typeLine: 'Artifact Creature — Construct',
    artFile: 'archmage-arcane-sentinel.png',
    category: 'creature',
    isPermanent: true,
    exclusiveTo: ARCHMAGE,
    minTurn: 2,
    basePower: 0,
    baseToughness: 4,
    flavorText: 'Guards the combo. Also guards the snacks.',
    stats: () => ({
      renderedText: "Defender. Blocks if able.\nCombo pieces Mowu controls can't be destroyed while Arcane Sentinel is on the battlefield.",
      power: 0,
      toughness: 4,
    }),
  }),
];

// ─── B1 gimmick Mowus: harmless, themed ──────────────────────────────────────

const LEFT = ['left-facing'];
const CHAIR = ['chair-sitting'];
const gimmickCards: EventCardDefinition[] = [
  card({
    id: 'left-sinister-squirrel',
    name: 'Sinister Squirrel',
    manaCost: '{G}',
    typeLine: 'Creature — Squirrel',
    artFile: 'left-sinister-squirrel.png',
    category: 'creature',
    isPermanent: true,
    exclusiveTo: LEFT,
    basePower: 1,
    baseToughness: 1,
    flavorText: '"Sinister" is Latin for "left". He is mostly harmless.',
    stats: () => ({ renderedText: '', power: 1, toughness: 1 }),
  }),
  card({
    id: 'left-westward-wind',
    name: 'Westward Wind',
    manaCost: '{1}{U}',
    typeLine: 'Sorcery',
    artFile: 'left-westward-wind.png',
    category: 'disruption',
    isPermanent: false,
    exclusiveTo: LEFT,
    flavorText: 'Blows everything slightly to the left.',
    stats: () => ({ renderedText: 'Each player draws a card.' }),
  }),
  card({
    id: 'left-leftmost-heirloom',
    name: 'Leftmost Heirloom',
    manaCost: '{1}',
    typeLine: 'Artifact',
    artFile: 'left-leftmost-heirloom.png',
    category: 'lifegain',
    isPermanent: true,
    exclusiveTo: LEFT,
    flavorText: 'Always placed at the far left of the mantelpiece.',
    stats: () => ({
      renderedText: "At the beginning of Mowu's upkeep, Mowu gains 1 life.",
      upkeep: [{ type: 'opponent-life', amount: 1 }],
    }),
  }),
  card({
    id: 'chair-comfy-armchair',
    name: 'Comfy Armchair',
    manaCost: '{1}{W}',
    typeLine: 'Artifact',
    artFile: 'chair-comfy-armchair.png',
    category: 'creature',
    isPermanent: true,
    exclusiveTo: CHAIR,
    flavorText: 'Lumbar support for every creature.',
    stats: () => ({
      renderedText: 'Creatures Mowu controls get +0/+1.',
      buff: { target: 'creatures', power: 0, toughness: 1 },
    }),
  }),
  card({
    id: 'chair-musical-chairs',
    name: 'Musical Chairs',
    manaCost: '{1}{R}',
    typeLine: 'Sorcery',
    artFile: 'chair-musical-chairs.png',
    category: 'disruption',
    isPermanent: false,
    exclusiveTo: CHAIR,
    flavorText: 'He never gets up, so he never loses.',
    stats: () => ({
      renderedText: 'Each player shuffles their hand into their library, then draws that many cards.',
    }),
  }),
  card({
    id: 'chair-nap-time',
    name: 'Nap Time',
    manaCost: '{W}',
    typeLine: 'Instant',
    artFile: 'chair-nap-time.png',
    category: 'removal',
    isPermanent: false,
    exclusiveTo: CHAIR,
    flavorText: 'Five more minutes.',
    stats: () => ({
      renderedText: "Tap your creature with the highest power. It doesn't untap during your next untap step.",
    }),
  }),
];

export const ARCHETYPE_CARDS: EventCardDefinition[] = [
  ...mechaCards,
  ...warlordCards,
  ...alchemistCards,
  ...scholarCards,
  ...taxCards,
  ...archmageCards,
  ...gimmickCards,
];
