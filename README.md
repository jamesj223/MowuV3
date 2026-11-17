# Mowu v3 — MTG Commander Goldfish Companion

Mowu is a browser companion for **goldfishing** Magic: The Gathering Commander decks: playing your deck solo
against a simulated opponent pod to see how fast it can close out a game.

It tracks the pod's shared life total (120 by default, three opponents × 40), optional poison and commander-damage
tracks, and your own life. It also runs an AI opponent: a randomly assigned "Mowu" commander casts event cards
scaled to your [Commander Bracket](#brackets) and attacks you with its creatures.

## Features

- **Opponent life tracker.** Damage is recorded the moment you deal it. A floating badge shows the running
  delta for the current burst.
- **Opponent turns.** After each of your turns, Mowu takes a turn. He has a mana budget (the turn number,
  plus ramp at higher brackets) and spends it on cards: one main play, plus cheaper extras at Brackets 3–5.
  Outside Bracket 1 he casts something every turn. You can mark any card he casts as **Countered** (`C`), and it
  doesn't resolve. Then his non-Defender creatures attack. Creatures he casts during his own turn have summoning
  sickness unless they have Haste.
- **Mowu commanders.** Each one biases which kinds of card appear (taxes, creatures, removal…) and has its own
  idle flavour text.
- **Counters.** +1/+1 counters (e.g. Tax Collector Mowu) pump the creature. Swarm counters (Toxic Mosquito
  Swarm) set how many bodies attack.
- **Stats.** The current game's life curve and damage per turn, per-deck benchmarks (wins/losses, fastest win,
  averages), and a match log with JSON export/import.
- **Persistence.** Settings, the game in progress and match history are saved to `localStorage`, so a reload
  doesn't lose your game.

## Hotkeys

| Action | Keys |
| --- | --- |
| End turn / continue opponent turn | `Space`, `Enter` |
| Deal damage (1 / 5 / 10) | `S`, `↓`, `-` · with `Shift` ×5 · with `Alt` ×10 |
| Heal / roll back (1 / 5 / 10) | `W`, `↑`, `+` · with `Shift` ×5 · with `Alt` ×10 |
| Trigger a random event | `E` |
| Counter the spell Mowu is casting (his turn) | `C` |
| Restart (asks first if a game is in progress) | `Shift + R` |
| Analytics | `B` |
| Close dialog / open New Game | `Esc` |
| Help | `?` |

Ctrl/Cmd shortcuts are left to the browser on purpose.

**Rollback vs. life gain.** A manual heal (`W` / `↑` / `+`) is treated as an undo: it removes damage you dealt
*this turn*. Life the opponent gains from an event card changes its life total only and never reduces your
damage stats.

The flag button in the navbar concedes the game and logs a loss for the current deck.

## Brackets

Brackets follow Wizards of the Coast's Commander Brackets, as revised in the
[October 21, 2025 update](https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025).
Each bracket says how many turns you should expect to play before anyone wins or loses. The victory screen
shows that expectation next to the turn you actually won on, so you can see at a glance whether a deck is
winning faster or slower than its bracket suggests.

| Bracket | Expect to play at least | Mowu casts | Mowu's mana (ramp) |
| --- | --- | --- | --- |
| 1: Exhibition | 9 turns | every 6 turns | turn number |
| 2: Core | 8 turns | every turn, 1 card | turn number |
| 3: Upgraded | 6 turns | every turn, up to 2 cards | +1 from turn 3 |
| 4: Optimized | 4 turns | every turn, up to 3 cards | +1 from turn 2, +2 from turn 4 |
| 5: cEDH | any turn | every turn, up to 3 cards | +2 |
| Custom | | every N turns (you choose) | turn number |
| Off (solitaire) | | never | |

The official "players expect" descriptions appear in the New Game dialog. Mowu's mana, plays per turn and
card scaling are our own tuning, all in `src/data/tuning.ts`.

## Development

```bash
npm install
npm run dev          # start the dev server
npm test             # unit tests (Vitest)
npm run lint         # oxlint
npm run build        # type-check + production build
npm run placeholders # create placeholder art for any card missing an image
```

CI (`.github/workflows/ci.yml`) runs lint, tests and build on every push to `master` and on every pull request.

### Project layout

```
src/
  logic/game.ts        pure game rules (victory, attackers, counters, damage bookkeeping), unit-tested
  logic/opponent.ts    Mowu's turn planner (mana budget, what to cast), unit-tested
  data/tuning.ts       difficulty dials: ramp, plays per turn, scaling multipliers
  store/               Zustand stores: live game + settings, decks + match history
  data/cards.ts        event card definitions and their bracket/turn scaling
  data/commanders.ts   Mowu commander variants, card weights and idle texts
  components/          UI (counters, battlefield, modals, stats)
  hooks/useHotkeys.ts  keyboard shortcuts
public/cards/          card art served at runtime (PNG)
art-src/               editable art source files (.pxd), not shipped in the build
```

### Adding a card

1. Add an entry to `EVENT_CARDS` in `src/data/cards.ts`. Give it a `category`, set `isPermanent` (creatures and
   enchantments stay on the battlefield), and write a `computeStats(turn, bracket)` that returns the rendered
   rules text plus any power/toughness, `healAmount` or starting `counters`. Set `counterType` if its counters mean
   something (`'plus-one'` or `'swarm'`).
2. Drop the art into `public/cards/<artFile>`. Until you do, the card shows an "MS Paint" placeholder.
3. Run `npm test`. The card-data tests check every card across all brackets and several turn numbers.

### Deploying under a sub-path

Card art is resolved against Vite's `base`, so you can build for a sub-path (e.g. GitHub Pages) with
`npx vite build --base=/your-repo/`.
