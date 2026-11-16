# Mowu V3 - Implementation Roadmap & Status Tracker

> **Notice for Any AI Model / Developer**:
> This document tracks the current progress, completed tasks, and upcoming milestones. Update the task checkboxes and the **Current Handoff Status** section whenever you complete a chunk of work.

---

## Current Handoff Status
- **Current State**: Widescreen layout maximization, streamlined in-play cards, long-press/hold-to-repeat buttons, and on-demand 3-opponent Infect/Commander Damage tracks are fully implemented and verified.
- **Key Enhancements Implemented in Response to Feedback**:
  1. **Expansive Widescreen Stage**: Expanded container up to 1850px, slimming down the side docks (`w-72 sm:w-80`) and dedicating 70%+ of the viewport to the Opponent Battlefield.
  2. **Streamlined In-Play Battlefield Cards**: Created `variant="in_play"` mode that removes flavor text, set symbols, and mana headers from active tokens/permanents in play. Cards dynamically wrap in a responsive flex layout. Full details remain available on click via `variant="detailed"` modal.
  3. **HoldButton (Click for ±1, Hold for ±10)**: Replaced cluttered `[-10, -5, -1, +1, +5]` buttons with clean `[-1]` and `[+1]` buttons that accelerate to ±10 when held (>350ms).
  4. **On-Demand Alt-Win Tracks (3-Opponent Pod)**:
     - Poison & Commander damage are hidden by default to keep the interface uncluttered.
     - When playtesting Infect or Voltron, toggling them reveals **3 distinct virtual opponents** (Opponent 1, 2, 3) with individual tracks (0–10 poison, 0–21 commander damage). Reaching lethal on all 3 triggers victory!
- **Verification**: `npm run build` completed with zero TypeScript or Vite errors.

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
