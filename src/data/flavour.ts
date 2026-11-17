/** Flavour text pools that aren't tied to a single commander. */

/** Shown when Archmage Mowu's combo resolves. `{turn}` is replaced with the turn number. */
export const COMBO_LOSS_TEXTS: { title: string; subtitle: string }[] = [
  {
    title: "Mowu's Combo Resolved",
    subtitle: "Every combo piece was on the battlefield at the start of Mowu's turn {turn}.",
  },
  {
    title: 'Infinite Loop Detected',
    subtitle: 'Archmage Mowu chased his own tail. Forever. You lost on turn {turn}.',
  },
  {
    title: 'Such Combo. Much Loss.',
    subtitle: 'The pieces lined up and Mowu went infinite on turn {turn}. Very wow.',
  },
  {
    title: 'Stack Overflow',
    subtitle: 'Mowu put seventeen triggers on the stack and you stopped counting. Lost on turn {turn}.',
  },
  {
    title: 'The Treats Never Stop',
    subtitle: 'An endless supply of treats, and an endless supply of reasons you lost on turn {turn}.',
  },
  {
    title: 'Good Boy Goes Infinite',
    subtitle: 'Archmage Mowu assembled his combo and wagged his way to victory on turn {turn}.',
  },
];

/** Pick a stable entry for a given key (e.g. the game's start time), so it doesn't change on re-render. */
export const pickStable = <T,>(items: T[], key: number): T => items[Math.abs(Math.floor(key)) % items.length];
