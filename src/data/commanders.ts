import type { MowuCommander } from '@/types/opponent';
import type { CommanderBracket } from '@/types/game';

export const MOWU_COMMANDERS: MowuCommander[] = [
  {
    id: 'tax-collector',
    name: 'Tax Collector Mowu',
    title: 'The Taxmaster',
    brackets: ['b1', 'b2'],
    archetype: 'Taxes / Stax',
    flavour: 'A very good boy who demands his treat taxes promptly.',
    avatar: '🐕',
    accentColor: 'amber',
    idleTexts: [
      'Mowu audits your mana base suspiciously...',
      'Mowu sniffs your lands for unreported income...',
      'Mowu stamps another tax form with his paw...',
      'Mowu checks your deck registration for irregularities...',
      'Mowu adjusts his tiny reading glasses and reviews the ledger...',
      'Mowu buries a treat in his tax haven...',
      'Mowu considers adding another tax bracket...',
    ],
    cardWeights: {
      tax: 2.5,
      creature: 0.8,
      lifegain: 1.5,
      removal: 0.7,
      disruption: 1.2,
      board_wipe: 0.5,
    },
  },
  {
    id: 'alchemist',
    name: 'Alchemist Mowu',
    title: 'The Brewmaster',
    brackets: ['b2', 'b3'],
    archetype: 'Poison / Infect',
    flavour: 'Brews toxic concoctions in his lab. Tail wagging optional.',
    avatar: '🧪',
    accentColor: 'lime',
    idleTexts: [
      'Mowu stirs a bubbling cauldron with his tail...',
      'Mowu sniffs a vial of something suspiciously green...',
      'Mowu accidentally knocks over a beaker. It hisses ominously...',
      'Mowu licks a toxic mushroom. He seems fine. Probably.',
      'Mowu adds "just a pinch" of nightshade to the brew...',
      'Mowu labels a bottle "Definitely Not Poison" in crayon...',
      'Mowu taste-tests the latest batch. His tongue turns purple...',
    ],
    cardWeights: {
      creature: 1.8,
      tax: 0.6,
      removal: 1.0,
      disruption: 1.3,
      lifegain: 0.5,
      board_wipe: 0.7,
    },
  },
  {
    id: 'mecha',
    name: 'Mecha-Mowu',
    title: 'The Iron Pup',
    brackets: ['b3', 'b4'],
    archetype: 'Voltron / Equipment',
    flavour: 'Equipped with the finest artifacts. Good boy, upgraded.',
    avatar: '🤖',
    accentColor: 'sky',
    idleTexts: [
      'Mecha-Mowu recalibrates his targeting systems...',
      'Mecha-Mowu polishes his chrome plating...',
      'Mecha-Mowu deploys a tiny satellite dish from his head...',
      'Mecha-Mowu\'s eyes glow red briefly. Just a routine scan.',
      'Mecha-Mowu equips another attachment to his mechanical tail...',
      'Mecha-Mowu downloads the latest firmware update...',
      'Mecha-Mowu beeps contentedly while defragmenting...',
    ],
    cardWeights: {
      creature: 1.5,
      tax: 1.0,
      removal: 1.5,
      disruption: 0.8,
      lifegain: 0.6,
      board_wipe: 1.2,
    },
  },
  {
    id: 'scholar',
    name: 'Scholar Mowu',
    title: 'The Wise Pup',
    brackets: ['b1', 'b2'],
    archetype: 'Control / Draw',
    flavour: 'Always has the answer in paw. Nose buried in ancient tomes.',
    avatar: '📚',
    accentColor: 'blue',
    idleTexts: [
      'Scholar Mowu adjusts his monocle and re-reads your commander...',
      'Scholar Mowu scribbles notes in the margins of a spellbook...',
      'Scholar Mowu reorganises his hand by mana cost...',
      'Scholar Mowu peers over his spectacles disapprovingly...',
      'Scholar Mowu mutters about proper stack resolution...',
      'Scholar Mowu consults a dusty tome titled "1001 Counterspells"...',
      'Scholar Mowu files your last play under "Questionable Decisions"...',
    ],
    cardWeights: {
      disruption: 2.0,
      removal: 1.5,
      tax: 1.0,
      creature: 0.7,
      lifegain: 0.8,
      board_wipe: 1.3,
    },
  },
  {
    id: 'warlord',
    name: 'Warlord Mowu',
    title: 'The Pack Leader',
    brackets: ['b3', 'b4'],
    archetype: 'Aggro / Tokens',
    flavour: 'Commands an army of loyal minions. Fetch is mandatory.',
    avatar: '⚔️',
    accentColor: 'rose',
    idleTexts: [
      'Warlord Mowu rallies his troops with a mighty bark...',
      'Warlord Mowu surveys the battlefield from atop a pile of bones...',
      'Warlord Mowu sharpens his claws on your life total...',
      'Warlord Mowu howls, summoning reinforcements from the kennel...',
      'Warlord Mowu practices his intimidating growl...',
      'Warlord Mowu reviews the battle map, tail thumping impatiently...',
      'Warlord Mowu chews on a strategy guide aggressively...',
    ],
    cardWeights: {
      creature: 2.5,
      board_wipe: 0.3,
      removal: 0.8,
      tax: 0.5,
      lifegain: 0.6,
      disruption: 0.7,
    },
  },
  {
    id: 'archmage',
    name: 'Archmage Mowu',
    title: 'The Infinite Loop',
    brackets: ['b4'],
    archetype: 'Combo / cEDH',
    flavour: 'Wins through arcane combinations. Such combo, much wow.',
    avatar: '🌀',
    accentColor: 'purple',
    idleTexts: [
      'Archmage Mowu contemplates the infinite...',
      'Archmage Mowu assembles pieces of something terrifying...',
      'Archmage Mowu tutors for the perfect answer...',
      'Archmage Mowu holds up priority with a knowing grin...',
      'Archmage Mowu shuffles his library. Again. And again...',
      'Archmage Mowu whispers "in response" to absolutely nothing...',
      'Archmage Mowu stacks seventeen triggers and dares you to follow...',
    ],
    cardWeights: {
      disruption: 2.0,
      removal: 1.8,
      board_wipe: 1.5,
      tax: 1.5,
      creature: 0.8,
      lifegain: 0.4,
    },
  },
];

/**
 * Generic idle texts used as fallback when no commander is selected
 * (e.g. when events are off or bracket is custom/off).
 */
export const GENERIC_IDLE_TEXTS = [
  'Opponent bides their time...',
  'Opponent looks at their phone...',
  'Opponent twiddles their thumbs...',
  'Opponent reorganises their lands...',
  'Opponent re-reads your commander...',
  'Opponent shuffles absent-mindedly...',
  'Opponent stares into the middle distance...',
  'Opponent counts their lands for the third time...',
  'Opponent flicks their cards rhythmically...',
  'Opponent pretends to think deeply about nothing...',
];

/**
 * Pick a random commander that matches the given bracket.
 * Returns null if bracket is 'off' or 'custom'.
 */
export function pickRandomCommander(bracket: CommanderBracket): MowuCommander | null {
  if (bracket === 'off' || bracket === 'custom') return null;

  const eligible = MOWU_COMMANDERS.filter((c) => c.brackets.includes(bracket));
  if (eligible.length === 0) return null;

  return eligible[Math.floor(Math.random() * eligible.length)];
}

/**
 * Pick a random idle text from the commander's pool, or from the generic pool.
 */
export function pickIdleText(commander: MowuCommander | null): string {
  const pool = commander?.idleTexts ?? GENERIC_IDLE_TEXTS;
  return pool[Math.floor(Math.random() * pool.length)];
}
