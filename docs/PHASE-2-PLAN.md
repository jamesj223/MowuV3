# Mowu v3 — Phase 2 Plan: Archetypes, 5 Brackets & Game Polish

## Overview

Based on playtest feedback and `todo.md`, Phase 2 focuses on four key pillars:
1. **Immediate Bug Fixes & Quality of Life Tweaks**
2. **5-Tier Commander Bracket System** (WotC standard: B1 Exhibition → B5 cEDH)
3. **Mowu Commander Re-alignment & Archetype Foundations**
4. **Chump Blocker Variety Pack** (7 distinct blocker cards)

---

## Part 1: Quick Fixes & Polish

### 1.1 Card Art Preloading

- **Issue**: Pop-in / slow appearance when cards or modals render.
- **Cause**: Browser requests images asynchronously only when the `<img>` tag mounts.
- **Fix**: Add an image preloader utility that runs once on app startup, caching all `/cards/*.png` assets in browser memory.
- **File**: `src/utils/imagePreloader.ts` (invoked in `App.tsx` or `main.tsx`).
- **Notes**: Should load in the background, and cache should persist across visits/refreshes if possible. Currently only ~600 kb of images, may need to revisit if card art dramatically increases.

### 1.2 Idle Turn Auto-Skip with 5s Visual Progress Bar

- **Feature**: On Mowu's turn, when phase is `idle` (no spells cast, no attackers), provide a 5-second countdown with an animated progress bar embedded in the continue button.
- **Rules**:
  - Automatically advances to player turn after 5s.
  - User can press `Space`, `Enter`, or click to skip immediately without waiting.
  - Hovering pauses the countdown (giving time to read flavour text if desired).
  - **CRITICAL**: ONLY active during `idle` phase. Never auto-skip when Mowu attacks or casts a card!
- **File**: `src/components/ui/OpponentTurnModal.tsx`.

### 1.3 Fix Tax Collector Mowu Initial Counter
- **Bug**: Tax Collector entered with `+1/+1` counter even though card text says it only gets one when you cast your second spell.
- **Fix**: Remove `initialCounters: 1` in `EVENT_CARDS` in `cards.ts`.

### 1.4 Legendary Commander Exclusivity
- **Bug**: Mecha-Mowu played Tax Collector Mowu from the general deck.
- **Fix**: Filter out any card whose ID or name matches another commander variant when drawing from `EVENT_CARDS`, or only allow a commander to summon their own avatar.

---

## Part 2: 5-Tier Commander Bracket System

Align with the official MTG 5-Bracket framework:

| Bracket | Name | Target Turns | Event Frequency | Description |
|---------|------|--------------|-----------------|-------------|
| **B1** | Exhibition | 11–14+ turns | Every 6 turns | Theme decks, silly wincons, ultra-casual |
| **B2** | Core | 8–10 turns | Every 4 turns | Standard precons, average EDH pacing |
| **B3** | Upgraded | 6–8 turns | Every 3 turns | Tuned synergies, efficient removal & threats |
| **B4** | Optimized | 4–6 turns | Every 2 turns | Fast mana, combo assembly, heavy interaction |
| **B5** | cEDH / Max Power | 2–4 turns | Every 1–2 turns | Turn 2–3 win attempts, ruthless stax clocks |

### UI Changes

- Update `NewGameModal.tsx`:
  - Widen modal (`max-w-2xl`).
  - Render a clean 5-column responsive selector or streamlined cards.
  - Preview eligible commanders for the selected bracket.
- Update `CommanderBracket` type in `game.ts` to `'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'custom' | 'off'`.

---

## Part 3: Mowu Commander Re-alignment

Re-assign and scale commanders across the 5 brackets:

| Commander | Allowed Brackets | Archetype | Theme & Flavor |
|-----------|------------------|-----------|----------------|
| **Gimmick Mowu** (New!) | **B1** | Gimmick / Theme | "Mowu Facing Left" or "Mowu Sitting on a Chair" — purely silly, no stax/infect |
| **Tax Collector Mowu** | **B2–B5** | Taxes / Stax | Scales from minor treat taxes (B2) to Rule of Law / Winter Orb stax (B5) |
| **Scholar Mowu** | **B2–B5** | Control / Draw | Scales from bounce/tutors (B2) to Force of Will counterspells (B5) |
| **Mecha-Mowu** | **B2–B3** | Voltron / Equip | Buffs himself and suits up with artifact equipment |
| **Warlord Mowu** | **B2–B4** | Aggro / Tokens | Swarms with creature tokens and anthem buffs |
| **Alchemist Mowu** | **B3–B4** | Poison / Infect | Toxic counters, contaminated minions |
| **Archmage Mowu** | **B4–B5** | Combo / cEDH | Assembles combo pieces (3-card in B4, 2-card in B5) |

---

## Part 4: Chump Blocker Variety Pack

Replace the single static Chump Blocker with a flavorful pool of 7 blockers:

1. **Generic Chump Blocker**: 1/1 Defender. Simple, honest meat shield.
2. **Slippery Chump Blocker**: 1/2 Defender, Reach, First Strike. Tricky to attack through.
3. **Deadly Chump Blocker**: 1/1 Defender, Deathtouch. Trades with anything.
4. **Contaminated Blocker**: 1/1 Defender, Toxic 1. Leaves a lingering poison counter on the player if you attack into it.
5. **Indecisive Blocker**: 1/2 Defender. "When this dies, discard a random card, then draw a card."
6. **"Definitely Not a Chump" Blocker**: 1/1 Defender with absurd useless keywords (Banding, Flanking, Horsemanship, Shadow, Trample, Vigilance).

---

## Implementation Roadmap

- [x] **Batch 1: Quick Fixes & Polish** (Card art preloading, 5s idle progress bar, Tax Collector counter fix, commander card deduplication)
- [x] **Batch 2: 5-Bracket System** (Update types, constants, NewGameModal layout, TurnCounter badges)
- [x] **Batch 3: Commander Roster & B1 Gimmick** (Add Gimmick Mowu, rebalance bracket assignments)
- [x] **Batch 4: Chump Blocker Expansion** (Add additional blocker definitions to `cards.ts`)

> **Status:** Implemented on `feat/phase-2`, then merged with the bug-fix branch and tested
> (unit tests + browser playthrough). The idle auto-skip was rewritten as `src/hooks/useIdleAutoSkip.ts`
> (the original broke React's rules of hooks). Open question: the bracket **target turns** above
> are not yet verified against Wizards' official guidance (see the "Open questions" section of `ROADMAP.md`).
