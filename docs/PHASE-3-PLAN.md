# Mowu v3 — Phase 3 Plan: Mowu Plays Like an Opponent

> Status: **draft for owner review**. Nothing here is implemented yet. Decisions marked **(Q)** are open
> questions, collected at the end.

## Goals

1. **Mowu acts every turn outside Bracket 1** (ADR-018). Small actions count; big swings stay occasional.
2. **Commanders play to their archetype** with a recognisable plan (todo: "Commanders aren't really playing to
   their plans/archetypes yet").
3. **Mowu's commander is a real card**: cast, buffed, destroyed, recast with commander tax.
4. **Scaling you can tune in one place**, aimed at the official bracket turn expectations.
5. Quick win first: **neutral bracket pace summary** on the victory screen (todo).

## Non-goals (this phase)

- Knowing what the player does. The app still can't see the player's spells (see `CLAUDE.md`). Every new card
  must work as a "fake" card the player resolves themselves.
- A full combat simulator. A lighter combat-resolution step is included as a stretch batch (Batch 6).
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

**Guarantee (B2–B5):** if the plan contains no main-phase action, the engine falls back to the archetype's
cheapest "upkeep" action (a `grow` or a 1-drop). B1 may legitimately return nothing (quiet turn). Custom keeps
its user-set cadence and uses the engine on its event turns.

The opponent-turn modal becomes a short **turn log**: "Main phase: casts X · equips Y" → "Combat: 2 attackers"
→ "Passes". Cards are still shown one at a time, as now. The idle auto-skip remains for quiet B1/Custom turns.

### 3. Commander zone

Each archetype Mowu (all except the B1 gimmicks, **(Q1)**) gets a **signature commander card**, generalising
what Tax Collector Mowu already does:

- Starts in the command zone. Cast it when the budget allows (its MV + {2} per previous cast).
- When the player destroys it (existing destroy button), it returns to the command zone, not the graveyard.
- State: `commander: { cardId, onBattlefield, timesCast }`, stored with the game.
- Shown in the left panel ("vs. Mecha-Mowu · in command zone / on battlefield · tax {2}").

### 4. Archetype playbooks

A playbook is data, not code: the commander card, a card pool with weights, an **upkeep** action (the cheap
every-turn fallback), and **signature plays** with turn/bracket gates and cooldowns.

| Mowu | Brackets | Every-turn upkeep | Signature plays | Escalation by bracket |
| --- | --- | --- | --- | --- |
| **Tax Collector** | B2–B5 | Audit: raise one tax by {1} or cast a small tax | Bureaucratic Delay, Spectral Moat, his commander card | B2 minor taxes → B5 "one spell per turn" lock piece |
| **Scholar** | B2–B5 | Study: counter on Scholar; at N, a "lesson" triggers (discard/loot/bounce) | Clumsy Thief, Command Zone Recall, "homework" taxes on noncreature spells | Bigger/faster lessons; B5 free disruption |
| **Mecha-Mowu** | B2–B3 | Cast or recast himself; otherwise equip (+1/+1 counter) | Equipment cards that pump him; Voltron attacks with commander damage | B3 equips grow faster and gain evasion |
| **Warlord** | B2–B4 | Muster: +1 or +2 soldiers on his token swarm | Anthems, a big token wave, "must attack" swarms | More tokens per turn, earlier anthems |
| **Alchemist** | B3–B4 | Brew: a Toxic 1-drop, or +1 poison-swarm counter | Toxic creatures, "proliferate" (+1 to your poison if you have any) | Higher Toxic, earlier proliferate |
| **Archmage** | B4–B5 | Research: a cheap disruption spell or blocker | **Combo pieces**: B4 three parts (A/B/C), B5 two parts | B5 assembles faster; pieces protected by blockers |
| **Left-Facing / Chair-Sitting** | B1 | None (quiet turns allowed) | Themed, mostly harmless cards | — |

**Combo tracker (Archmage).** Pieces are permanents of different types (creature/artifact/enchantment) so the
player has realistic answers. The battlefield shows "Combo: 2/3 assembled". If all pieces are on the battlefield
at the start of Mowu's turn, the combo resolves and the game is **lost** (recorded as a loss with reason
`combo`). Destroying any piece breaks it. **(Q3)**

### 5. Card pool

Rough count to make playbooks work: about **25–35 new cards**, split into:

- **Shared filler** (~8): cheap, low-impact plays any Mowu can make, so "something every turn" never runs dry.
- **Per-archetype** (~3–5 each): commander card + upkeep/signature cards.
- **Rework existing cards** (backlog): reword the "must attack/must block" reminder text, and make the Homing
  Fireball Pigeon / Wrath of Oops / Meat Pie numbers come from the tuning table.

Cards keep using `computeStats(turn, bracket)`, but the multipliers move into `src/data/tuning.ts`.

**Art budget.** Every new card works with the existing "MS Paint" placeholder. Cards can share art (all seven
blockers already share `chump-blocker.png`). The plan will include a **"most wanted art"** list (the commander
cards first) so you can draw at your own pace. **(Q5)**

### 6. Tuning and playtesting

- One file, `src/data/tuning.ts`: ramp table, budget cap, scaling multipliers, signature-play cooldowns, combo
  speed. No magic numbers in card definitions.
- Target: a typical deck for a bracket should be able to win a little after the bracket's `minTurns`, with
  Mowu's pressure mattering but not dictating the game.
- Measure with real games: match history already stores bracket and turns. Add a per-bracket view to Stats
  ("B3: 12 games, median win turn 7"). No auto-tuning; you adjust `tuning.ts`.

### 7. Victory screen pace summary (quick win)

Replace the current "Faster than … expects / may play above this bracket" message with a neutral line in plain
colours: **"Bracket 3: Upgraded · expects at least 6 turns · you won on turn 5"**. No verdict. `getPaceVerdict`
becomes unused and is removed (its tests go with it).

---

## Implementation batches

Each batch ends with lint, tests, build and a browser check, then updates ROADMAP/ADRs.

- [ ] **Batch 0: Quick win.** Neutral pace summary on the victory screen.
- [ ] **Batch 1: Engine foundation.** Mana value parser, `tuning.ts`, budget, `planOpponentTurn` with the
  B2–B5 guarantee using existing cards plus shared filler; turn-log UI. *Deliverable: Mowu never idles in B2+.*
- [ ] **Batch 2: Command zone.** Commander state, tax, recast on destroy, left-panel display. Generalise Tax
  Collector Mowu; add commander cards for the other archetype Mowus.
- [ ] **Batch 3: Playbooks, one archetype at a time.** Suggested order: Mecha (Voltron, simplest and most
  requested) → Warlord → Archmage (with combo tracker) → Tax Collector (escalation) → Alchemist → Scholar →
  B1 gimmicks.
- [ ] **Batch 4: Card pool pass.** Remaining new cards, reminder-text rewording, "most wanted art" list.
- [ ] **Batch 5: Commander settings.** Enable/disable individual Mowus (backlog item); the New Game dialog
  already lists possible commanders, so they become toggles.
- [ ] **Batch 6 (stretch): Combat resolution.** Mark each attacker blocked/unblocked; unblocked damage
  auto-applies to player life, Toxic to player poison, commander attacks to commander damage. Could move to
  Phase 4 **(Q6)**.
- [ ] **Batch 7: Tuning pass** after you've played some games on the new engine.

---

## Open questions for the owner

1. **B1 commanders:** should Left-Facing and Chair-Sitting Mowu get commander cards too, or stay
   "personality only"? (Proposal: personality only; B1 is about theme, not a game plan.)
2. **Mana budget:** happy with the ramp table above as a starting point? It's the main difficulty dial.
3. **Archmage's combo:** is "combo assembled = you lose (recorded as a loss)" too harsh for a goldfish tool?
   Alternative: it deals a big chunk of damage, or forces a "you must answer this next turn" warning first.
   (Proposal: warning when one piece is missing, loss on assembly; B4 three pieces, B5 two.)
4. **How many actions per turn?** Proposal: one main play plus at most one cheap extra (two in B5), so turns
   stay quick to read.
5. **Art:** OK with placeholders for new cards, plus a prioritised "most wanted art" list?
6. **Combat resolution:** in Phase 3 (stretch) or Phase 4?
7. **Archetype gaps:** your todo mentions Flying/Aggro/Chaos, group hug/forced draw and mill. Phase 4 material,
   or swap one in now?
