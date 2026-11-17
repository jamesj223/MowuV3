# Mowu v3 — Phase 3 Plan: Mowu Plays Like an Opponent

> Status: **approved** (owner answers 2026-11-17, recorded at the end). Batch 0 done; Batch 1 next.

## Goals

1. **Mowu acts every turn outside Bracket 1** (ADR-018). Small actions count; big swings stay occasional.
2. **Commanders play to their archetype** with a recognisable plan (todo: "Commanders aren't really playing to
   their plans/archetypes yet").
3. **Mowu's commander is a real card**: cast, buffed, destroyed, recast with commander tax.
4. **Scaling you can tune in one place**, aimed at the official bracket turn expectations.
5. Quick win first: **neutral bracket stats** on the victory screen (todo).

**Ground rule (ADR-019): no invisible effects.** Everything Mowu does is either casting a card or changing a
card that is already on the battlefield (including his commander). The player can always see it and answer it
with the destroy button. No hidden timers, no effects that live only in the turn log.

## Non-goals (this phase)

- Knowing what the player does. The app still can't see the player's spells (see `CLAUDE.md`). Every new card
  must work as a "fake" card the player resolves themselves.
- Combat resolution (blocking UI, auto-applied damage/poison/commander damage). Moved to **Phase 4** together
  with the new archetypes; see the answer to Q6 below.
- New art for every new card. Art stays optional (see "Art budget").

---

## Where we are now

- Each opponent turn is either an **event** (on a fixed cadence: every 6/4/3/2/1 turns), **combat** (if
  creatures can attack), or **idle**. So B2 is idle on roughly 3 turns out of 4 until creatures accumulate.
- Card choice is a single weighted random draw from one global pool, biased by commander category weights.
  Nothing knows about mana, curve, or what is already on the battlefield.
- Only Tax Collector Mowu has a commander card. The other Mowus exist only as flavour (name, avatar, idle text).

---

## Design

### 1. Mana budget: the opponent's "curve"

Give Mowu an imaginary mana budget each turn, like a real player hitting land drops:

```
budget(turn, bracket) = turn + ramp(bracket, turn)        (capped, e.g. at 10)
```

| Bracket | Ramp (proposal) | Feel |
| --- | --- | --- |
| B1 Exhibition | +0 | Slow, quirky |
| B2 Core | +0 | Fair, on-curve |
| B3 Upgraded | +1 from turn 3 | One step ahead |
| B4 Optimized | +1 from turn 2, +2 from turn 4 | Fast mana |
| B5 cEDH | +2 from turn 1 | Explosive from the start |

Cards already have mana costs; their **mana value** (parsed from `manaCost`) is what they cost from the budget.
Mowu spends the budget each turn on one main play plus cheaper extras if mana remains.

This gives a natural curve without per-card turn gates: early turns are 1–2 drops and small taxes, later turns
bigger threats. The bracket mostly changes *how fast* Mowu climbs the curve, and the existing scaling (X values
and P/T) still applies on top. `minTurn` stays for cards that must never appear early (wipes).

### 2. The turn engine

A pure function in `src/logic/opponent.ts`, unit-tested with a seeded random generator:

```ts
planOpponentTurn(state, rng) → OpponentAction[]
```

Action types:

| Action | Example | Costs mana? |
| --- | --- | --- |
| `cast` | Cast Generic Chump Blocker; cast Wrath of Oops | Yes (MV) |
| `cast-commander` | Cast Mecha-Mowu from the command zone | MV + commander tax |
| `grow` | Put a +1/+1 counter on Mecha-Mowu; Warlord's soldiers +2 | Small/zero |
| `escalate` | Bureaucratic Delay's tax goes from {1} to {2} | Small |
| `combo-piece` | Archmage reveals Combo Part B | Yes |
| `attack` | Existing combat phase (unchanged rules, Haste/summoning sickness) | No |

**Guarantee (B2–B5):** every turn includes at least one main-phase action. Because of the ground rule, the
fallback must itself be a card or a change to a card on the battlefield:

1. cast the cheapest affordable card from the archetype pool (every pool has 1-mana cards, and the budget is
   at least 1 from turn 1); or
2. if nothing is castable (e.g. heavy taxes on Mowu himself later on), put a counter on Mowu's commander or one
   of his permanents (an "equip", "muster" or "study" effect, named on the card that does it).

B1 may legitimately do nothing (a quiet turn). Custom keeps its user-set cadence and uses the engine on its
event turns.

**Plays per turn** (mana permitting): B1–B2 one play; B3 one main play plus up to one cheaper extra; B4–B5 one
main play plus up to two cheaper extras.

The opponent-turn modal becomes a short **turn log**: "Main phase: casts X · equips Y" → "Combat: 2 attackers"
→ "Passes". Cards are still shown one at a time, as now. The idle auto-skip remains for quiet B1/Custom turns.

### 3. Commander zone

Every Mowu gets a **signature commander card**, generalising what Tax Collector Mowu already does. The B1
gimmick Mowus get vanilla commander cards (stats, art and flavour text, no abilities):

- Starts in the command zone. Cast it when the budget allows (its MV + {2} per previous cast).
- When the player destroys it (existing destroy button), it returns to the command zone, not the graveyard.
- State: `commander: { cardId, onBattlefield, timesCast }`, stored with the game.
- Shown in the left panel ("vs. Mecha-Mowu · in command zone / on battlefield · tax {2}").

### 4. Archetype playbooks

A playbook is data, not code: the commander card, a card pool with weights, an **upkeep** play (the cheap
every-turn fallback, always a card or a counter on a card), and **signature plays** with turn/bracket gates
and cooldowns.

| Mowu | Brackets | Every-turn upkeep (card or counter on a card) | Signature plays | Escalation by bracket |
| --- | --- | --- | --- | --- |
| **Tax Collector** | B2–B5 | Cast a cheap tax permanent, or add a "tax" counter to one already in play (its tax goes up by {1}) | Bureaucratic Delay, Spectral Moat, his commander card | B2 minor taxes → B5 "one spell per turn" lock piece |
| **Scholar** | B2–B5 | Cast a cheap "homework" spell, or a "study" counter on the Scholar card; at N counters its printed ability triggers (discard/loot/bounce) | Clumsy Thief, Command Zone Recall, "homework" taxes on noncreature spells | Bigger/faster lessons; B5 free disruption |
| **Mecha-Mowu** | B2–B3 | Cast or recast himself; otherwise cast a cheap equipment, or "equip" (+1/+1 counter on him) | Equipment cards that pump him; Voltron attacks with commander damage | B3 equips grow faster and gain evasion |
| **Warlord** | B2–B4 | Cast a soldier token card, or "muster" (+1/+2 on an existing swarm card) | Anthems, a big token wave, "must attack" swarms | More tokens per turn, earlier anthems |
| **Alchemist** | B3–B4 | Cast a Toxic 1-drop, or "brew" (+1 on a poison swarm card) | Toxic creatures, "proliferate" (+1 to your poison if you have any) | Higher Toxic, earlier proliferate |
| **Archmage** | B4–B5 | Cast a cheap disruption spell or blocker | **Combo pieces**: B4 three parts (A/B/C), B5 two parts | B5 assembles faster; pieces protected by blockers |
| **Left-Facing / Chair-Sitting** | B1 | None (quiet turns allowed) | Vanilla commander card, themed and mostly harmless cards | — |

**Combo tracker (Archmage).** Pieces are permanents of different types (creature/artifact/enchantment) so the
player has realistic answers. The battlefield shows "Combo: 2/3 assembled". If all pieces are on the battlefield
at the start of Mowu's turn, the combo resolves and the game is **lost** (recorded as a loss with reason
`combo`). When only one piece is missing, a clear **"one piece away"** warning shows on the battlefield and in
the turn log. Destroying any piece breaks it. Card names telegraph the plan ("Combo Part A: …").

### 5. Card pool

Rough count to make playbooks work: about **25–35 new cards**, split into:

- **Shared filler** (~8): cheap, low-impact plays any Mowu can make, so "something every turn" never runs dry.
- **Per-archetype** (~3–5 each): commander card + upkeep/signature cards.
- **Rework existing cards** (backlog): reword the "must attack/must block" reminder text, and make the Homing
  Fireball Pigeon / Wrath of Oops / Meat Pie numbers come from the tuning table.

Cards keep using `computeStats(turn, bracket)`, but the multipliers move into `src/data/tuning.ts`.

**Art budget.** New cards get the same blank MS Paint canvases as before (`npm run placeholders`), which you
replace on your own time. The script will read the card list from `src/data/cards.ts` instead of its own
hard-coded list, so new cards get a blank automatically. Cards can share art (all seven blockers share
`chump-blocker.png`). Batch 4 delivers a **prioritised "most wanted art" list** in `docs/`: commander cards
first, then the cards you'll see most often.

### 6. Tuning and playtesting

- One file, `src/data/tuning.ts`: ramp table, budget cap, scaling multipliers, signature-play cooldowns, combo
  speed. No magic numbers in card definitions.
- Target: a typical deck for a bracket should be able to win a little after the bracket's `minTurns`, with
  Mowu's pressure mattering but not dictating the game.
- Measure with real games: match history already stores bracket and turns. Add a per-bracket view to Stats
  ("B3: 12 games, median win turn 7"). No auto-tuning; you adjust `tuning.ts`.

### 7. Victory screen bracket stats (quick win, done)

Plain stats, no verdict: the selected bracket, its expected game length (official minimum, e.g. "8+ turns"),
and "Won on turn N". Fast and slow wins are both visible at a glance. Wizards gives no upper bound, so no
"range" is shown; if we later want one it must come from `tuning.ts` and be labelled as Mowu's target, not as
Wizards' guidance.

---

## Implementation batches

Each batch ends with lint, tests, build and a browser check, then updates ROADMAP/ADRs.

- [x] **Batch 0: Quick win.** Neutral bracket stats on the victory screen.
- [ ] **Batch 1: Engine foundation.** Mana value parser, `tuning.ts`, budget, `planOpponentTurn` with the
  B2–B5 guarantee using existing cards plus shared filler (all real cards); turn-log UI. *Deliverable: Mowu never idles in B2+.*
- [ ] **Batch 2: Command zone.** Commander state, tax, recast on destroy, left-panel display. Generalise Tax
  Collector Mowu; add commander cards for the other archetype Mowus.
- [ ] **Batch 3: Playbooks, one archetype at a time.** Suggested order: Mecha (Voltron, simplest and most
  requested) → Warlord → Archmage (with combo tracker) → Tax Collector (escalation) → Alchemist → Scholar →
  B1 gimmicks.
- [ ] **Batch 4: Card pool pass.** Remaining new cards, reminder-text rewording, placeholder script reads the
  card list, "most wanted art" list.
- [ ] **Batch 5: Commander settings.** Enable/disable individual Mowus (backlog item); the New Game dialog
  already lists possible commanders, so they become toggles.
- [ ] **Batch 6: Tuning pass** after you've played some games on the new engine.

---

## Owner answers (2026-11-17)

1. **B1 commanders:** yes, vanilla commander cards, so each has its own art and flavour text.
2. **Mana budget:** the ramp table is a fine starting point; tune later.
3. **Archmage's combo:** loss on assembly is fine, given clear telegraphing (card names plus the
   "one piece away" warning) and piece count scaling by bracket. Can be softened later.
4. **Plays per turn:** one big card plus one or two cheaper ones at higher brackets, mana permitting.
5. **Art:** blank canvases for new cards, which the owner edits later, plus a prioritised list.
6. **Combat resolution:** left to Claude. Decision: **Phase 4.** Phase 3 already changes the opponent turn a
   lot; combat resolution is a separate UI that's easier to design once Mowu attacks every turn with
   commanders, swarms and Toxic creatures, and it pairs naturally with the Phase 4 archetypes (Flying/Aggro).
   Until then, the attack summary keeps showing attackers and total power and the player applies damage.
7. **New archetypes** (Flying, Aggro, Chaos, group hug/forced draw, mill): all Phase 4.

Also from this round: the victory screen shows plain stats without wording (done in Batch 0), and upkeep
plays must be cards or effects on the commander/permanents (the ground rule above, ADR-019).
