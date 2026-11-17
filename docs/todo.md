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
- **No invisible opponent effects.** Every Mowu action is a card or a change to a card on the battlefield
  (e.g. counters on his commander), so the player can always see and answer it (ADR-019).
- Commanders aren't really playing to their plans/archetypes yet.
    - Voltron Mowu should be playing his commander and buffing it each turn (or recasting it, if it's not already on the battlefield.)
    - Combo Mowu should start assembling pieces of his combo. (e.g. B4 "3 Card Combo Part A/B/C" and B5 "2 Card Combo". Maybe each part is a different type: Creature/Enchantment/Artifact).
    - Other commanders/archetypes should have similar signature playbooks.

## Up Next

- Phase 3 (`docs/PHASE-3-PLAN.md`): opponent turn engine, commander zone, archetype playbooks.

## Phase 4

- New archetypes: Flying, Aggro, Chaos, group hug/forced draw, mill.
- Combat resolution (see Backlog "Attack modal" item).
- Archetype specific playbooks:
  - Voltron equipment/aura buffs
  - Combo piece tracker
  - Stax escalation levels
  - Token swarm multiplication

## Backlog

- Attack modal should show all attacking creatures? Make it more fleshed out. Have a UI for declaring whether an attacker is blocked, survives/dies etc. Have the Player status card and a version of the battlefield card. And have damage/cmdr/infect auto apply if not blocked.
- Add more cards!
- Rework some of the existing cards.
- Reword or remove some of the reminder text. Particularly the must attack and must block.
- Setting to enable/disable specific commanders. So people don't have to play against Infect Mowu if they don't want.
- Separate settings page from new game page?

## Long term

- Deploy to where old mowu lives
- Integrate into commander bag? "Click here to playtest this deck" and have it redirect and auto fill deck name, bracket etc.
