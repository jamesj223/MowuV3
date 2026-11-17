# Mowu V3 - Implementation Roadmap & Status Tracker

> **Notice for Any AI Model / Developer**:
> This document tracks the current progress, completed tasks, and upcoming milestones. Update the task checkboxes and the **Current Handoff Status** section whenever you complete a chunk of work.

---

## Current Handoff Status
- **Phase 3 in progress (2026-11-17)** on `feat/phase-3`, plan in `docs/PHASE-3-PLAN.md`. Done: Batch 0 (neutral victory stats), Batch 1 (turn engine: mana budget, every-turn casts in B2–B5, multiple plays per turn, turn log, Countered button). Next: Batch 2 (command zone). Known: B5 casts a lot with the current small card pool (~2.75 cards/turn); revisit in the tuning pass once the pool grows.
- **Current State (2026-11-16)**: Phase 2 (5 brackets, commander roster, chump blocker pack, idle auto-skip, art preloading) merged with a bug-fix pass. See `DECISIONS.md` ADR-013 to ADR-016 for what changed and why.
- **Verification**: `npm run lint`, `npm test` and `npm run build` all pass (also run in CI); main flows checked in a browser.
- **Docs**: the app README (`README.md`) covers hotkeys, project layout and how to add a card.

### Open questions
1. ~~Bracket target turns~~ Resolved: official Oct 2025 wording and turn expectations (ADR-017).
2. **Card scaling.** The per-bracket multipliers and formulas in `src/data/cards.ts` are untuned guesses. Intended feel: between solitaire goldfishing and a Forge/Arena-style bot; outside of Bracket 1 the bot does *something* every turn (ADR-018). Needs a design pass plus playtesting: which events suit which turn/bracket/deck, and how strongly they scale. The bracket `minTurns` give a target: a typical deck for a bracket should win a bit after that turn.
3. ~~Help text~~ Resolved: no longer claims difficulty "matches" the brackets.

---

## Milestone 1: Foundation & Project Setup
- [x] Initialize Vite + React + TypeScript in `mowu-v3/`
- [x] Configure Tailwind CSS v4 & PostCSS
- [x] Install dependencies: `lucide-react`, `zustand`, `recharts`, `canvas-confetti`
- [x] Set up basic UI layout container with responsive dark/modern MTG theme
- [x] Verify local dev server runs with zero errors

---

## Milestone 2: Core Goldfish Engine & Tactile Trackers
- [x] Zustand `useGameStore` implementation (turn counter, damage dealt, target damage, delta history)
- [x] Opponent tracker UI with rapid increment/decrement buttons (+1, -1, +5, -5, +10, -10)
- [x] Animated floating Life Delta indicator (like V1's signed popup that fades out cleanly)
- [x] Turn counter with Next Turn / Step-back controls
- [x] Keyboard shortcuts engine (Space/Enter for next turn, W/S or Arrows for damage, Ctrl+Q quick restart, Esc for menu)
- [x] Optional Player Tracker panel (Player Life: 40, Poison: 0-10, Commander Damage: 0-21)
- [x] Victory screen / celebration modal when target damage is reached (turns taken, total damage, confetti effect)

---

## Milestone 3: Playtest Card Component & Event System
- [x] Define initial set of 14 custom Goldfish Event Cards (Wipes, Targeted Removal, Tokens/Blockers, Taxes, Disruption)
- [x] Dynamic scaling logic (formula: `{X}` damage or stats based on turn number & difficulty: Easy, Medium, Hard)
- [x] Authentic MTG Playtest Card component (header, mana cost symbols, MS Paint art window, type line, rules text, P/T, artist credit)
- [x] Create starter placeholder PNGs in `public/cards/` for MS Paint editing
- [x] Opponent Battlefield tray: Persistent permanents (e.g. 2/2 Zombie blocker, Ghostly Prison) with click-to-destroy/remove
- [x] Event Draw animation & Card Zoom/Inspector modal

---

## Milestone 4: Deck Library & History Persistence
- [x] Deck management (select existing decks or enter new ones)
- [x] Match history logging to `localStorage` (deck name, date, turns taken, damage dealt, events encountered)
- [x] Settings & New Game modal (starting life, target damage, event frequency, player tracker toggle)
- [x] Export & Import game data as JSON

---

## Milestone 5: Analytics Dashboard & Final Polish
- [x] Recharts damage-per-turn graph and cumulative damage progression
- [x] Deck performance stats (Average turns to win, fastest win, game count)
- [x] Keyboard shortcut cheat-sheet modal (`?` key)
- [x] Mobile UX polish & tactile button press effects
- [x] Build verification (`npm run build`) and final testing
