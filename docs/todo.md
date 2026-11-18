# todo.md

## Completed (Phase 2)

- [x] **Card art preloading**: Pre-caches card images on app load in `src/utils/imagePreloader.ts` to eliminate render lag/pop-in.
- [x] **Idle turn auto-skip with 5s animated progress bar**: In `OpponentTurnModal`, when Mowu has nothing to do, a 5-second countdown runs with a visual progress bar. Space/Enter or click skips immediately; hovering pauses. Never auto-skips attacks or spell casts.
- [x] **Tax Collector Mowu counter fix**: Removed initial counter; now enters clean at 3/3 and accumulates counters only when 2nd spell is cast.
- [x] **Commander card deduplication**: Added `signatureCommanderId` system so commanders only summon their own signature cards.
- [x] **5 Commander Brackets**: B1 Exhibition, B2 Core, B3 Upgraded, B4 Optimized, B5 cEDH. Names, expectations and turn guidance (at least 9 / 8 / 6 / 4 turns; cEDH any turn) now follow Wizards' Oct 2025 update (ADR-017).
- [x] **Rebalanced Mowu Commanders**:
  - B1: Left-Facing Mowu (👈) and Chair-Sitting Mowu (🪑) (gimmick-only, no stax/infect).
  - B2–B5: Tax Collector Mowu (🐕) & Scholar Mowu (📚)
  - B2–B3: Mecha-Mowu (🤖)
  - B2–B4: Warlord Mowu (⚔️)
  - B3–B4: Alchemist Mowu (🧪)
  - B4–B5: Archmage Mowu (🌀)
- [x] **Chump Blocker Expansion (7 variants)**:
  - Generic Chump Blocker (1/1 Defender)
  - Hardy Shield Bearer (0/5 Defender, Reach)
  - Slippery Chump Blocker (1/2 Defender, First Strike, Reach)
  - Deadly Chump Blocker (1/1 Defender, Deathtouch)
  - Contaminated Blocker (1/1 Defender, Toxic 1, poison on death)
  - Indecisive Chump Blocker (1/2 Defender, loot on death)
  - Definitely Not a Chump (1/2 Defender, Banding, Horsemanship, Shadow, etc.)

---

## Bugs/Tweaks/Feedback

- Skull icon for creatures, X for enchantments? Kept intentionally as a nice touch!
- **Rule: outside of Bracket 1, Mowu does *something* every turn.** No idle turns in Brackets 2–5.
  "Something" doesn't mean a bomb: a cheap creature, a counter on an existing permanent, a small tax, or
  recasting/buffing his commander all count. Big swings (wipes, combo pieces, finishers) stay occasional.
  Bracket 1 (Exhibition) can still have quiet turns, but should lean into its theme when it acts.
  Custom and Solitaire are unchanged. Even if we have to dial down the strength of some cards and add more.
  (Phase 3; see ADR-018.)
- [x] **Victory screen: bracket stats, no verdict.** Shows the selected bracket, its expected game length and
  the turn you won on. No wording, so wins that are too fast *and* too slow are both visible and left for the
  user to interpret. (Done in Phase 3 Batch 0.)
- **Every Mowu action needs a source the player can answer** (ADR-019): either a card being cast (counterable)
  or printed text on a permanent (removable). No tokens/counters appearing from nowhere, no eminence-style
  command-zone abilities, no activated abilities.
- [x] Commanders play to their plans/archetypes (Phase 3 Batch 3).
    - [x] Voltron Mowu casts his commander, grows it each upkeep, recasts it, and suits up with equipment.
    - [x] Combo Mowu assembles pieces (B4 three, B5 two) of different types, with a tracker and warning.
    - [x] Every other Mowu has a signature playbook (taxes, study/lessons, tokens, poison, B1 themes).

## Up Next

- **Smarter attacks (Phase 3 tuning pass).** Mowu attacks with every non-Defender creature, so engine
  creatures make suicidal attacks (playtest: Scholar Mowu's 1/4 swung into a 7/7, though his value is his
  upkeep study trigger, which doesn't need him to attack). Options: give Scholar Mowu Defender (simple, and
  it signals he's an engine); or an attack rule where creatures with upkeep triggers or static buffs, or power
  well below toughness, stay home unless the attack is "safe" (evasion, or Mowu's biggest creature).
- **Combat screen copy.** "Assign blockers and take damage as needed" doesn't say *how*: today the player has
  to end Mowu's turn first (the modal covers Player Status). Proper fix is Phase 4 combat resolution; until
  then, at least reword the hint.

- **Commander-targeting removal (Phase 3 tuning pass).** Almost all of Mowu's removal targets "your creature
  with the highest power", which misses commander-centric value engines (e.g. Jodah: rarely the biggest
  creature, but the thing a real table works through protection to kill). "Your commander" is always
  identifiable, so add fake cards that go after it, scaled by bracket:
  - targeted (destroy / exile / loses abilities): player's hexproof, protection, indestructible still apply;
  - untargeted at B4–B5 (edict "sacrifice your commander", "your commander's abilities don't work while this
    is on the battlefield"), like strong tables getting around protection;
  - commander tax pressure (bounce / back to the command zone).
  Weight toward control archetypes (Scholar, Archmage). Compare against the baseline playtest (Jodah, Nov 2026).

- Phase 3 (`docs/PHASE-3-PLAN.md`): opponent turn engine, commander zone, archetype playbooks.

## Phase 4

- New archetypes: Flying, Aggro, Chaos, group hug/forced draw, mill.
- Combat resolution (see Backlog "Attack modal" item).
- [x] Archetype specific playbooks (Phase 3 Batch 3):
  - [x] Voltron equipment buffs
  - [x] Combo piece tracker
  - [x] Stax escalation (tax counters + Surprise Audit, Rule of Paw at B5)
  - [x] Token swarm multiplication

## Backlog

- Art: see `docs/ART-LIST.md` (`npm run placeholders -- --status` shows what's still blank).

- Attack modal should show all attacking creatures? Make it more fleshed out. Have a UI for declaring whether an attacker is blocked, survives/dies etc. Have the Player status card and a version of the battlefield card. And have damage/cmdr/infect auto apply if not blocked.
- [x] Add more cards! (Phase 3: 33 archetype cards, 5 generic, 2 tokens; more welcome)
- [x] Rework some of the existing cards. (Phase 3 Batch 4: numbers in `CARD_TUNING`, clearer text)
- [x] Reword or remove some of the reminder text. Particularly the must attack and must block. (Phase 3 Batch 4)
- [x] Setting to enable/disable specific commanders. So people don't have to play against Infect Mowu if they don't want. (Phase 3 Batch 5)
- Separate settings page from new game page?

## Long term

- Deploy to where old mowu lives
- Integrate into commander bag? "Click here to playtest this deck" and have it redirect and auto fill deck name, bracket etc.
