# Architectural Decision Records (ADRs)

## ADR-001: Target Opponent Damage Tracking
- **Date**: 2026-10-07
- **Decision**: Default to a single unified opponent damage target of 120 (simulating 3 opponents at 40 life each in Commander), with configurable targets (e.g. 40 for 1v1, or custom).
- **Rationale**: User confirmed a single combined target is cleaner and more effective for playtesting than micromanaging 3 separate life pools, while acknowledging 120 represents a typical 4-player pod.

## ADR-002: Optional Player Tracker
- **Date**: 2026-10-07
- **Decision**: Include an optional Player Tracker showing Player Life (default 40), Poison counters (0–10), and Commander Damage (0–21). Can be collapsed or expanded based on player preference.
- **Rationale**: Many goldfish events (creature tokens attacking, poison tokens, life drains) require tracking player survival to test deck resilience.

## ADR-003: Hybrid Dynamic Card Frame with User-Editable PNG Artwork
- **Date**: 2026-10-07
- **Decision**: Implement a custom MTG / Playtest card component in CSS/SVG. Card rules text and stats (e.g. `{X}` damage, `{N}` tokens) are dynamically calculated by difficulty and turn count. Artwork is loaded from static PNG files in `/public/cards/` (e.g., `homing-fireball-pigeon.png`) which the user can directly create and paint in MS Paint. Fallback to doodle SVGs if image is not yet drawn.
- **Rationale**: Combines the best of both worlds: dynamic mechanical scaling by game state + charming homemade MS Paint aesthetics.

## ADR-004: Multi-Model Handoff & Continuity Architecture
- **Date**: 2026-10-07
- **Decision**: Maintain clear state documentation in `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, and `docs/ROADMAP.md`. All application code lives in `mowu-v3/` with TypeScript types and modular Zustand stores.
- **Update (2026-11)**: `docs/` now lives *inside* the `mowu-v3` git repository so it is versioned and visible to any agent working on the repo.
- **Rationale**: Ensures any model in the free tier rotation can immediately read the project state, run commands, and continue implementation without loss of context.

## ADR-005: Opponent Health (Countdown) & Native Lifegain
- **Date**: 2026-10-07
- **Decision**: Switch primary counter from "Damage Dealt (0 to 120)" to **Opponent Health** (starts at 120 or 40, counts down to 0). Dealing damage reduces health; opponent lifegain cards (e.g. *Suspicious Meat Pie*) naturally heal opponent health (+5). Total damage dealt is retained as a tracked metric for analytics.
- **Rationale**: MTG opponents have life totals, not damage caps. Counting down to 0 is standard MTG UX and naturally accommodates lifegain without modifying damage ceilings.

## ADR-006: Debounced Floating Delta Accumulator (V1 Restoration)
- **Date**: 2026-10-07
- **Decision**: Implement the V1 debounced floating delta indicator. Mashing buttons or hotkeys (e.g. 17 times) accumulates in real-time (`-1`, `-2`, ..., `-17`) with high-contrast color styling (green for healing, red for damage). A 1.5s timer resets on each keypress; when user stops typing, it smoothly fades out and resets to 0.
- **Rationale**: User explicitly relies on this feedback to deal exact burst amounts during combat calculation without manual mental arithmetic.

## ADR-007: Commander Bracket System (Brackets 1–4) — *superseded by Phase 2 (5 brackets)*
- **Date**: 2026-10-07
- **Decision**: Replace generic difficulty levels with the official MTG Commander Bracket System:
  - **Bracket 1 (Exhibition / Precon)**: Benchmark 10–13 turns, event frequency every 6 turns, mild disruption (chump blockers, small taxes).
  - **Bracket 2 (Core / Casual)**: Benchmark 8–10 turns, event frequency every 4 turns, standard wipes & mid blockers.
  - **Bracket 3 (Optimized Casual)**: Benchmark 5–7 turns, event frequency every 3 turns, aggressive clocks & high interaction.
  - **Bracket 4 (cEDH / High Power)**: Benchmark 3–5 turns, event frequency every 2 turns, ruthless stax & early wipes.
  - **Custom / Off**: Fully manual or disabled events.
- **Rationale**: Aligns directly with modern Commander deckbuilding standards and provides clear game-length targets for playtesting.

## ADR-008: 3-Column Cockpit / Playmat Layout
- **Date**: 2026-10-07
- **Decision**: Redesign page structure from stacked cards into a 3-column MTG cockpit:
  - **Left Wing**: Opponent Health & Tactile Pad with the debounced floating delta.
  - **Center Stage**: The Opponent Battlefield (active cards, tokens, and spell drawer) with its own internal scroll so adding cards never displaces controls off screen.
  - **Right Wing**: Turn Engine (current turn, big Next Turn button, bracket badge) and Player Status (Life, Poison, Commander damage).
  - Responsive collapse for mobile with quick access bar.
- **Rationale**: Prevents battlefield card expansion from pushing controls off screen and mirrors digital MTG playmat conventions.

## ADR-009: Expansive Widescreen & Sleek HUD Real Estate
- **Date**: 2026-10-07
- **Decision**: Remove artificial max-width constraints on widescreen/desktop (expanding to 1920px max or fluid). Slim down the side docks so the Battlefield gets 70%+ of the viewport width.
- **Rationale**: Goldfishing requires seeing active board states clearly without horizontal cramped feeling on modern monitors.

## ADR-010: Streamlined In-Play Battlefield Cards
- **Date**: 2026-10-07
- **Decision**: In-play battlefield cards strip non-essential clutter (hide flavor text, set acronyms, and extraneous mana headers). Focus purely on Card Title, Art, Type line, Rules Text, and P/T box. Full details remain available in the click-to-zoom modal.
- **Rationale**: Allows cards to scale cleanly and fit gracefully across multiple columns as the opponent plays more permanents.

## ADR-011: Long-Press & Rapid Step (Replace ±5 with Clean ±1 / Hold for 10)
- **Date**: 2026-10-07
- **Decision**: Replace cluttered button arrays (`-10, -5, -1, +1, +5`) with sleek, prominent `[-1]` and `[+1]` buttons. Single click = ±1; Long-press / hold (>400ms) = auto-repeats / jumps by ±10. Keyboard uses `Alt` for ±10 (see ADR-014; `Ctrl` was dropped).
- **Rationale**: Vastly cleaner UI footprint while preserving rapid combat math and the V1 mashable feel.

## ADR-012: On-Demand Alt-Win Trackers (3-Opponent Poison & Commander Damage)
- **Date**: 2026-10-07
- **Decision**: Default to hidden for Poison and Commander damage (both for player and opponent) to keep the primary view clean. When toggled on for playtesting Infect or Voltron decks:
  - Tracks **Opponent Poison** across 3 virtual opponents (each with 0–10 counters). A pod opponent dies at 10 poison. Reaching 10 on all 3 wins the game!
  - Tracks **Opponent Commander Damage** across 3 virtual opponents (each with 0–21 damage). Reaching 21 on all 3 wins the game!
- **Rationale**: Accurately simulates the rules of Commander where Infect and Voltron require taking out 3 separate opponents rather than a single pool.



## ADR-013: Damage Is Recorded Immediately; the Delta Badge Is Display-Only
- **Date**: 2026-11-16
- **Decision**: Damage counts toward `totalDamageDealt` and the current turn's snapshot the moment it is dealt. The 1.6s debounce (ADR-006) now only controls the floating delta badge. A manual heal (+ / W / Up) is a *rollback* that undoes at most the damage dealt this turn; opponent life gain from event cards changes life only and never reduces damage stats.
- **Rationale**: The debounced bookkeeping lost the killing blow on the victory screen, credited damage to the wrong turn when ending a turn quickly, and let opponent lifegain erase the player's damage.

## ADR-014: Hotkeys Avoid Ctrl/Cmd
- **Date**: 2026-11-16
- **Decision**: `Shift` = ×5, `Alt` = ×10, `Shift+R` = restart (asks first if a game is in progress), `E` = trigger event. Ctrl/Cmd combos are left to the browser. Letter keys use `event.code` so they work across layouts and with Alt on macOS. Board hotkeys are ignored while a dialog is open or after game over.
- **Rationale**: Browsers don't let pages intercept Ctrl+W (close tab) or Ctrl+Q (quit, Firefox on Linux/Windows), so the old Ctrl+W (+10 heal) and Ctrl+Q (restart) closed the app.

## ADR-015: Pure Game Logic Module + Tests
- **Date**: 2026-11-16
- **Decision**: Game rules (victory checks, attackers, summoning sickness, counters, damage bookkeeping, card eligibility, weighted picks) live in `src/logic/game.ts` as pure functions with Vitest tests. Stores call into it. CI runs lint, tests and build.
- **Rationale**: Every agent handoff so far has introduced regressions that a test suite would have caught (including a broken build).

## ADR-016: Counter Types
- **Date**: 2026-11-16
- **Decision**: Cards declare a `counterType`: `'plus-one'` (+1/+1 counters added to P/T) or `'swarm'` (number of bodies; each attacks). Cards without one show no counter controls.
- **Rationale**: ADR/feedback item 6 left counter meaning up to the user, so counters never affected combat.

## ADR-017: Bracket Definitions Quoted from Wizards (Oct 2025 Update)
- **Date**: 2026-11-16
- **Decision**: Bracket names, "players expect" bullets and turn expectations in `src/types/game.ts` are quoted verbatim from Wizards' *Commander Brackets Beta Update – October 21, 2025*. The turn expectation is stored as `minTurns` (9 / 8 / 6 / 4 / none for cEDH). Core (B2) is no longer described in terms of precons, matching that update. The victory screen originally compared the winning turn to `minTurns`; see ADR-020 for the current neutral display.
- **Rationale**: Earlier LLM-written descriptions invented turn ranges (e.g. "11–14+", "2–4") and tied brackets to precons. Supersedes ADR-007 and the turn targets in `PHASE-2-PLAN.md`.
- **Precedence**: Where earlier LLM-made decisions conflict with ones recorded from ADR-013 onward, the later ones win (owner's call, 2026-11-16).

## ADR-018: Outside Bracket 1, Mowu Acts Every Turn
- **Date**: 2026-11-17
- **Decision**: In Brackets 2–5 the opponent takes at least one main-phase action on every one of its turns; idle turns don't happen. An action can be small (cheap creature, counter on an existing permanent, minor tax, casting or buffing its commander); big effects (wipes, combo pieces, finishers) remain occasional and are gated by turn and bracket. Bracket 1 (Exhibition) may have quiet turns and leans into its theme. Custom keeps the user-set cadence; Solitaire has no opponent.
- **Rationale**: Owner playtest feedback: an opponent that often does nothing doesn't feel like a real opponent, especially at higher brackets. Supersedes the "event every N turns" cadence for B2–B5 (ADR-007, `PHASE-2-PLAN.md`). The idle auto-skip (Phase 2) remains for B1, Custom and turns where the player wants to move quickly.

## ADR-019: Every Opponent Action Has a Source the Player Can Answer
- **Date**: 2026-11-17 (revised same day after owner clarification)
- **Decision**: Every Mowu action comes from one of two sources:
  1. **Casting a card** (the player could counter it; the opponent-turn screen has a "Countered" button), or
  2. **Printed text on a permanent on the battlefield**: static effects ("Mowu's creatures get +1/+1", "spells cost {1} more") or triggered abilities ("At the beginning of your upkeep, put a +1/+1 counter on Mecha-Mowu"). The player answers these by removing the permanent.
  Not allowed: effects with no card behind them (tokens or counters that "just appear" on Mowu's turn), eminence-style abilities that work from the command zone, and (by preference) activated abilities. Mowu changes existing permanents only by casting other cards (e.g. an equipment or aura) or via their printed text.
- **Rationale**: Owner: the issue is the *source*, not the effect. A spell that makes two tokens can be countered; tokens appearing from nowhere cannot. Source-less effects feel unfair. Consequence: the every-turn guarantee (ADR-018) is "cast the cheapest card", and every card pool must contain cheap cards.

## ADR-020: Victory Screen Shows Bracket Stats Without a Verdict
- **Date**: 2026-11-17
- **Decision**: The victory screen shows the bracket, its official expected game length (minimum turns, e.g. "8+ turns") and the winning turn, with no wording or colour judgement. Supersedes the "faster than this bracket expects" message from ADR-017.
- **Rationale**: Owner preference for neutral, matter-of-fact information; wins that are too fast and too slow are both visible. Wizards gives no upper bound, so no range is invented.

## ADR-021: Command Zone Rules for Mowu's Commander
- **Date**: 2026-11-17
- **Decision**: Every Mowu has one commander card (`src/data/commanderCards.ts`), kept out of the random card pool. When it's in the command zone and Mowu can afford its mana value plus commander tax ({2} per previous cast), casting it is that turn's main play; cheaper extras may follow at B3–B5. It is never used as the every-turn fallback. A cast counts toward tax even if countered. If it leaves the battlefield (destroyed, Clear Board, countered) it returns to the command zone (derived: "on battlefield" = a permanent flagged `isCommander`). B1 commanders are vanilla; archetype text arrives with Batch 3 playbooks, within ADR-019 (no activated or command-zone abilities).
- **Rationale**: Mirrors real Commander play closely enough to feel familiar (players recast commanders as soon as it's sensible) while keeping the planner simple. Commander damage is still applied by the player; attackers are tagged "Commander" to make that easy.

## ADR-022: The App Applies What It Can; the Player Resolves the Rest
- **Date**: 2026-11-17
- **Decision**: Card effects are split. Effects the app can track (counters on Mowu's permanents, Mowu's tokens, the player's poison counters, Mowu's life) are applied automatically when a card resolves or a printed upkeep trigger fires, and are listed in the turn log. Effects only the player can carry out (discard, pay mana, untap restrictions, cost increases) stay as card text. Each cast records an undo so "Countered" reverses its automatic effects exactly. Static buffs (equipment, anthems) are computed from the permanents on the battlefield, never stored on the buffed creature, so removing the source removes the buff.
- **Rationale**: Keeps the board state honest and low-effort for the player while respecting the core constraint that the app can't see the player's side (see `CLAUDE.md`), and keeps every effect traceable to a source (ADR-019).

## ADR-023: Switching Mowus Off
- **Date**: 2026-11-17
- **Decision**: The player can switch individual Mowu commanders off by clicking them in the New Game dialog. The list (`disabledCommanders`) is a persisted setting, applied to new games and restarts. If every Mowu for the chosen bracket is off, the game uses a generic opponent (no commander, generic cards only) rather than refusing to start or ignoring the setting; the dialog warns when that will happen.
- **Rationale**: Owner backlog item (e.g. skipping Infect). Falling back to a generic opponent respects the player's choice and keeps every bracket playable.

## ADR-024: Mowus Have Matchups, Not Perfect Answers
- **Date**: 2026-11-18
- **Decision**: Not every Mowu needs an answer to every player archetype, and none should feel like it always has the right answer. Each Mowu has strengths and blind spots (e.g. Tax Collector's noncreature taxes do little against an all-creature deck); that matchup variety is intended. Mowu never "reads" the player's deck or board: card choice stays driven by his own archetype, mana and the board facts he can see (his own permanents, the player's tracked counters). Tuning adds general-purpose interaction where it fits an archetype (e.g. commander-targeting removal for control Mowus), not tailored counters.
- **Rationale**: Owner direction during the first playtest. Real Commander pods have good and bad matchups; an opponent that always has the answer feels unfair and implausible.
