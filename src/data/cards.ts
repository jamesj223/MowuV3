import type { EventCardDefinition } from '@/types/card';
import type { CommanderBracket } from '@/types/game';

const getBracketMultiplier = (bracket: CommanderBracket): number => {
  switch (bracket) {
    case 'b1': return 0.75;
    case 'b2': return 1.0;
    case 'b3': return 1.25;
    case 'b4': return 1.6;
    case 'b5': return 2.0;
    default: return 1.0;
  }
};

export const EVENT_CARDS: EventCardDefinition[] = [
  {
    id: 'homing-fireball-pigeon',
    name: 'Homing Fireball Pigeon',
    manaCost: '{1}{R}',
    typeLine: 'Creature — Bird Elemental',
    artFile: 'homing-fireball-pigeon.png',
    category: 'removal',
    isPermanent: false,
    minTurn: 2,
    flavorText: 'It flies with burning precision straight toward your biggest threat.',
    templateText: 'Deals {X} damage to your creature with the highest power.',
    computeStats: (turn, bracket) => {
      const mult = getBracketMultiplier(bracket);
      const x = Math.max(2, Math.round(turn * mult + 1));
      return {
        renderedText: `Deals ${x} damage to your creature with the highest power.`,
      };
    },
  },
  {
    id: 'generic-chump-blocker',
    name: 'Generic Chump Blocker',
    manaCost: '{W}',
    typeLine: 'Creature — Citizen Token',
    artFile: 'chump-blocker.png',
    category: 'creature',
    isPermanent: true,
    minTurn: 1,
    basePower: 1,
    baseToughness: 1,
    flavorText: '"I volunteered for guard duty, but nobody mentioned giant dragons."',
    templateText: 'Defender.\nMust block your highest power attacker if able.',
    computeStats: () => ({
      renderedText: 'Defender.\nMust block your highest power attacker if able.',
      power: 1,
      toughness: 1,
    }),
  },
  {
    id: 'hardy-chump-blocker',
    name: 'Hardy Shield Bearer',
    manaCost: '{1}{W}',
    typeLine: 'Creature — Dwarf Soldier Token',
    artFile: 'chump-blocker.png',
    category: 'creature',
    isPermanent: true,
    minTurn: 2,
    basePower: 0,
    baseToughness: 5,
    flavorText: '"Hold the line! He can barely scratch this granite shield."',
    templateText: 'Defender, Reach.\nMust block your highest power attacker if able.',
    computeStats: () => ({
      renderedText: 'Defender, Reach.\nMust block your highest power attacker if able.',
      power: 0,
      toughness: 5,
    }),
  },
  {
    id: 'slippery-chump-blocker',
    name: 'Slippery Chump Blocker',
    manaCost: '{1}{U}',
    typeLine: 'Creature — Frog Rogue Token',
    artFile: 'chump-blocker.png',
    category: 'creature',
    isPermanent: true,
    minTurn: 1,
    basePower: 1,
    baseToughness: 2,
    flavorText: 'It hops in the way of your attacks, strikes first, and slips away.',
    templateText: 'Defender, Reach, First Strike.\nMust block if able.',
    computeStats: () => ({
      renderedText: 'Defender, Reach, First Strike.\nMust block if able.',
      power: 1,
      toughness: 2,
    }),
  },
  {
    id: 'deadly-chump-blocker',
    name: 'Deadly Chump Blocker',
    manaCost: '{B}',
    typeLine: 'Creature — Snake Assassin Token',
    artFile: 'chump-blocker.png',
    category: 'creature',
    isPermanent: true,
    minTurn: 2,
    basePower: 1,
    baseToughness: 1,
    flavorText: 'A tiny drop of venom is all it takes to bring down a colossus.',
    templateText: 'Defender, Deathtouch.\nMust block your highest power attacker if able.',
    computeStats: () => ({
      renderedText: 'Defender, Deathtouch.\nMust block your highest power attacker if able.',
      power: 1,
      toughness: 1,
    }),
  },
  {
    id: 'contaminated-chump-blocker',
    name: 'Contaminated Blocker',
    manaCost: '{B}{G}',
    typeLine: 'Creature — Phyrexian Insect Token',
    artFile: 'chump-blocker.png',
    category: 'creature',
    isPermanent: true,
    minTurn: 2,
    basePower: 1,
    baseToughness: 1,
    flavorText: 'Its toxic ichor leaves a lingering stain on anything it touches.',
    templateText: 'Defender, Toxic 1.\nWhen this creature dies from blocking, you get 1 poison counter.',
    computeStats: () => ({
      renderedText: 'Defender, Toxic 1.\nWhen this creature dies from blocking, you get 1 poison counter.',
      power: 1,
      toughness: 1,
    }),
  },
  {
    id: 'indecisive-chump-blocker',
    name: 'Indecisive Chump Blocker',
    manaCost: '{1}{R}',
    typeLine: 'Creature — Goblin Scout Token',
    artFile: 'chump-blocker.png',
    category: 'creature',
    isPermanent: true,
    minTurn: 2,
    basePower: 1,
    baseToughness: 2,
    flavorText: '"Wait, do I jump left or jump right? AAAAH!"',
    templateText: 'Defender.\nWhen this creature dies, discard a random nonland card, then draw a card.',
    computeStats: () => ({
      renderedText: 'Defender.\nWhen this creature dies, discard a random nonland card, then draw a card.',
      power: 1,
      toughness: 2,
    }),
  },
  {
    id: 'not-a-chump-blocker',
    name: 'Definitely Not a Chump',
    manaCost: '{2}{W}{U}{B}{R}{G}',
    typeLine: 'Creature — Overqualified Champion',
    artFile: 'chump-blocker.png',
    category: 'creature',
    isPermanent: true,
    minTurn: 3,
    basePower: 1,
    baseToughness: 2,
    flavorText: '"I have mastered seven ancient martial disciplines just to stand in this doorway."',
    templateText: 'Defender, First Strike, Deathtouch, Vigilance, Flanking, Horsemanship, Shadow, Trample, Reach.\nMust block if able.',
    computeStats: () => ({
      renderedText: 'Defender, First Strike, Deathtouch, Vigilance, Flanking, Horsemanship, Shadow, Trample, Reach.\nMust block if able.',
      power: 1,
      toughness: 2,
    }),
  },
  {
    id: 'wall-of-beef',
    name: 'Gargantuan Wall of Beef',
    manaCost: '{2}{G}{G}',
    typeLine: 'Creature — Wall Beast',
    artFile: 'wall-of-beef.png',
    category: 'creature',
    isPermanent: true,
    minTurn: 3,
    flavorText: 'A towering fortress of prime cuts.',
    templateText: 'Defender, Reach.\nMust block if able.',
    computeStats: (turn, bracket) => {
      const mult = getBracketMultiplier(bracket);
      const toughness = Math.max(4, Math.round(turn * mult + 2));
      return {
        renderedText: `Defender, Reach.\nMust block if able. (Toughness: ${toughness})`,
        power: 0,
        toughness,
      };
    },
  },
  {
    id: 'wrath-of-oops',
    name: 'Wrath of Oops',
    manaCost: '{2}{W}{W}',
    typeLine: 'Sorcery',
    artFile: 'wrath-of-oops.png',
    category: 'board_wipe',
    isPermanent: false,
    minTurn: 4,
    flavorText: '"Did I drop the sacred relic again?"',
    templateText: 'Destroy all creatures with mana value {X} or less.',
    computeStats: (turn, bracket) => {
      if (bracket === 'b5' || bracket === 'b4' || turn >= 6) {
        return { renderedText: 'Destroy all creatures. They cannot be regenerated.' };
      }
      const mv = bracket === 'b3' ? 5 : bracket === 'b1' ? 3 : 4;
      return { renderedText: `Destroy all creatures with mana value ${mv} or less.` };
    },
  },
  {
    id: 'bureaucratic-delay',
    name: 'Bureaucratic Delay',
    manaCost: '{1}{W}',
    typeLine: 'Enchantment',
    artFile: 'bureaucratic-delay.png',
    category: 'tax',
    isPermanent: true,
    minTurn: 2,
    flavorText: 'Please fill out form 27-B in triplicate before casting your spell.',
    templateText: 'Noncreature spells cost {X} more to cast.',
    computeStats: (_turn, bracket) => {
      const tax = bracket === 'b5' ? 3 : bracket === 'b4' ? 2 : 1;
      return {
        renderedText: `Noncreature spells you cast cost {${tax}} more to cast.`,
      };
    },
  },
  {
    id: 'laser-pointer',
    name: 'Targeted Laser Pointer',
    manaCost: '{1}{B}',
    typeLine: 'Instant',
    artFile: 'laser-pointer.png',
    category: 'removal',
    isPermanent: false,
    minTurn: 3,
    flavorText: 'Spot removal locks on with feline precision.',
    templateText: 'Destroy your artifact or enchantment with the highest mana value.',
    computeStats: () => ({
      renderedText: 'Destroy your artifact or enchantment with the highest mana value.',
    }),
  },
  {
    id: 'suspicious-meat-pie',
    name: 'Suspicious Meat Pie',
    manaCost: '{W}',
    typeLine: 'Instant',
    artFile: 'meat-pie.png',
    category: 'lifegain',
    isPermanent: false,
    minTurn: 2,
    flavorText: 'It smells questionable, but opponent devours it anyway.',
    templateText: 'Opponent gains {X} life.',
    computeStats: (_turn, bracket) => {
      const heal = bracket === 'b5' ? 14 : bracket === 'b4' ? 10 : bracket === 'b3' ? 8 : bracket === 'b1' ? 4 : 6;
      return {
        renderedText: `Opponent devours the pie and gains +${heal} life!`,
        healAmount: heal,
      };
    },
  },
  {
    id: 'clumsy-thief',
    name: 'Clumsy Thief',
    manaCost: '{1}{U}',
    typeLine: 'Sorcery',
    artFile: 'clumsy-thief.png',
    category: 'disruption',
    isPermanent: false,
    minTurn: 3,
    flavorText: 'He knocked over the vase, but still snatched a card from your hand.',
    templateText: 'Discard a nonland card at random, then draw a card.',
    computeStats: () => ({
      renderedText: 'Discard a nonland card at random, then draw a card.',
    }),
  },
  {
    id: 'tax-collector-mowu',
    name: 'Tax Collector Mowu',
    manaCost: '{2}{G}{W}',
    typeLine: 'Legendary Creature — Good Boy Taxer',
    artFile: 'tax-collector-mowu.png',
    category: 'tax',
    signatureCommanderId: 'tax-collector',
    isPermanent: true,
    minTurn: 3,
    basePower: 3,
    baseToughness: 3,
    initialCounters: 0,
    flavorText: 'A very good boy who demands his treat taxes promptly.',
    templateText: 'Haste, Vigilance.\nWhenever you cast your second spell each turn, Mowu gains +1/+1 and you lose 2 life.',
    computeStats: () => ({
      renderedText: 'Haste, Vigilance.\nWhenever you cast your second spell each turn, Mowu gets a +1/+1 counter and you lose 2 life.',
      power: 3,
      toughness: 3,
    }),
  },
  {
    id: 'toxic-mosquito-swarm',
    name: 'Toxic Mosquito Swarm',
    manaCost: '{B}{G}',
    typeLine: 'Creature — Insect Token',
    artFile: 'toxic-mosquito.png',
    category: 'creature',
    isPermanent: true,
    minTurn: 2,
    basePower: 1,
    baseToughness: 1,
    initialCounters: 1,
    flavorText: 'Buzzing with concentrated infect.',
    templateText: 'Haste, Flying, Toxic 1.\nMust attack each combat if able.',
    computeStats: (turn, bracket) => {
      const count = bracket === 'b5' ? 3 : bracket === 'b4' || turn >= 6 ? 2 : 1;
      return {
        renderedText: `Haste, Flying, Toxic 1 (Player takes 1 poison counter if unblocked).\nMust attack each combat if able. (Swarm Count: ${count})`,
        power: 1,
        toughness: 1,
      };
    },
  },
  {
    id: 'commander-banishment',
    name: 'Command Zone Recall',
    manaCost: '{1}{U}{U}',
    typeLine: 'Instant',
    artFile: 'commander-banishment.png',
    category: 'removal',
    isPermanent: false,
    minTurn: 4,
    flavorText: 'Back to the command tent for a tactical debrief.',
    templateText: 'Return your Commander to the command zone. (Commander tax applies on recasting).',
    computeStats: () => ({
      renderedText: 'Return your Commander to the command zone. (Commander tax applies as usual).',
    }),
  },
  {
    id: 'graveyard-vacuum',
    name: 'Graveyard Vacuum',
    manaCost: '{1}',
    typeLine: 'Artifact',
    artFile: 'graveyard-vacuum.png',
    category: 'disruption',
    isPermanent: false,
    minTurn: 3,
    flavorText: 'Whoosh! All your recurrable shenanigans are gone.',
    templateText: 'Exile all cards from your graveyard.',
    computeStats: () => ({
      renderedText: 'Exile all cards from your graveyard.',
    }),
  },
  {
    id: 'apex-behemoth',
    name: 'Apex Behemoth',
    manaCost: '{4}{G}{G}',
    typeLine: 'Creature — Dinosaur Beast',
    artFile: 'apex-behemoth.png',
    category: 'creature',
    isPermanent: true,
    minTurn: 5,
    flavorText: 'Too huge to ignore.',
    templateText: 'Haste, Trample, Vigilance. Must attack each combat if able.',
    computeStats: (turn, bracket) => {
      const bonus = bracket === 'b5' ? 6 : bracket === 'b4' ? 4 : bracket === 'b3' ? 2 : 1;
      const stat = Math.max(5, turn + bonus);
      return {
        renderedText: `Haste, Trample, Vigilance.\nAttacks each combat if able. (${stat}/${stat})`,
        power: stat,
        toughness: stat,
      };
    },
  },
  {
    id: 'ghostly-barrier',
    name: 'Spectral Moat',
    manaCost: '{2}{W}',
    typeLine: 'Enchantment',
    artFile: 'ghostly-barrier.png',
    category: 'tax',
    isPermanent: true,
    minTurn: 4,
    flavorText: 'The ghosts will accept either toll money or your tears.',
    templateText: 'Creatures you control must pay {2} each to attack.',
    computeStats: () => ({
      renderedText: 'For each creature you attack with, pay {2} or that creature cannot attack.',
    }),
  },
];
