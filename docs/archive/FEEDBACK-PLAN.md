# Mowu V3 — Feedback Implementation Plan

## Summary of Feedback & Proposed Changes

Your feedback covers 8 distinct items ranging from quick UI fixes to significant new game systems. I've categorised them into three tiers:

### 🟢 Tier 1: Quick UI Fixes (Can implement now)

#### 1. Swap Left/Right Panels
**Current**: Left = Opponent Life | Center = Battlefield | Right = Turn + Player
**Requested**: Left = Turn + Player | Center = Battlefield | Right = Opponent Life
**Rationale**: Left-to-right reading flow: Turn → My Status → Board State → Opponent

**Change**: Swap the panel order in [App.tsx](file:///D:/Git/MowuV3/mowu-v3/src/App.tsx#L57-L73)

#### 2. Long Press +10 Repeat Too Fast
**Current**: `holdDelay: 350ms`, `repeatInterval: 120ms` in [HoldButton.tsx](file:///D:/Git/MowuV3/mowu-v3/src/components/ui/HoldButton.tsx#L7-L8)
**Fix**: Increase `repeatInterval` from `120ms` → `400ms` (or make it configurable per-use). Also increase `holdDelay` to `500ms` so it's harder to accidentally trigger.

#### 3. Opponent Life Controls — Consistent +/- Style
**Current**: Two verbose side-by-side buttons: "-1 Damage (Hold for -10)" and "+1 Heal (Hold for +10)" plus a floating delta badge in the header
**Requested**: Match the compact right-aligned `[-] [+]` style used by Player Life, Poison, and Commander Damage. Remove floating delta from header.
**Change**: Redesign [DamageTracker.tsx](file:///D:/Git/MowuV3/mowu-v3/src/components/counters/DamageTracker.tsx) to use the same row layout as PlayerTracker — label on left, value + compact ± buttons on right.

#### 4. Player Poison/Cmdr Toggles — Add Icons
**Current**: Player toggles say "Poison" / "Cmdr" (text only). Opponent toggles have `<Biohazard>` and `<Crown>` icons.
**Requested**: Add the same icons to the player toggles. Also move opponent toggles to match the player's header-right position.
**Change**: 
- Add `<Biohazard>` icon to player poison toggle, `<Crown>` icon to player cmdr toggle in [PlayerTracker.tsx](file:///D:/Git/MowuV3/mowu-v3/src/components/counters/PlayerTracker.tsx#L37-L60)
- Move opponent toggles from bottom of DamageTracker into the header area (right-aligned), matching the PlayerTracker layout

---

### 🟡 Tier 2: Gameplay Enhancements (Need some design decisions)

#### 5. Creatures Need Haste or Defender
**Current**: Creatures have varied keywords but no consistent haste/defender rule
**Proposal**: All attacking creatures get **Haste** (they attack immediately). All defensive creatures get **Defender**. This is a data change in [cards.ts](file:///D:/Git/MowuV3/mowu-v3/src/data/cards.ts).

| Card | Current Keywords | Proposed |
|------|-----------------|----------|
| Slippery Chump Blocker | Reach, Deathtouch, must block | + **Defender** |
| Wall of Beef | Defender, Reach, must block | Already has Defender ✅ |
| Tax Collector Mowu | Vigilance | + **Haste** |
| Toxic Mosquito Swarm | Flying, Toxic 1, must attack | + **Haste** |
| Apex Behemoth | Trample, Vigilance, must attack | + **Haste** |

#### 6. Card Counters (Tokens / +1/+1)
**Proposal**: Add a `counters` field to `ActivePermanent`. On the card UI, show a counter badge. Click the badge or right-click the card to +/- counters.
- Counter badge renders on top of the P/T box (e.g., "×3" for token count, or "+2/+2" for buff counters)
- Right-click context menu with: "+1 Counter", "-1 Counter", "Destroy"
- Single counter type per card (keeps it simple) — user decides if it means tokens or +1/+1

> [!NOTE]
> This requires changes to: `ActivePermanent` type, `useGameStore`, `PlaytestCard`, and `BattlefieldZone`.

---

### 🔴 Tier 3: Major New Systems (Completed ✅)

#### 7. Opponent Turn System & Combat ✅
Implemented a complete two-phase turn cycle: Player Turn → Opponent Turn.
- **Opponent Turn Modal** with multi-phase flow:
  1. **Main Phase**: When an event triggers, displays the drawn card directly with full playtest card art and stats.
  2. **Combat Phase**: Automatically identifies all attacking creatures (power > 0 without Defender), showing total attack power, individual P/T, and keywords.
  3. **Idle / Pass Phase**: Shows custom commander flavour text or passes when nothing is active.
- Keyboard support: `Space` / `Enter` or `Escape` steps through opponent phases seamlessly.
- Visual TurnCounter badge toggles between `[User You]` (green) and `[Swords Opp]` (rose).

#### 8. Opponent Commanders (Mowu Variants) ✅
Implemented random commander assignment based on selected bracket level.
- **Roster of 6 Mowu variants** (`src/data/commanders.ts`):
  - Tax Collector Mowu (B1-B2, Taxes/Stax) 🐕
  - Scholar Mowu (B1-B2, Control/Draw) 📚
  - Alchemist Mowu (B2-B3, Poison/Infect) 🧪
  - Mecha-Mowu (B3-B4, Voltron/Equipment) 🤖
  - Warlord Mowu (B3-B4, Aggro/Tokens) ⚔️
  - Archmage Mowu (B4, Combo/cEDH) 🌀
- **Dynamic influence**:
  - Biases card category weights in `triggerEvent` according to commander archetype.
  - Unique idle flavour text pool per commander.
  - Displays commander avatar, title, and archetype in `DamageTracker`, `TurnCounter`, `NewGameModal`, and `OpponentTurnModal`.
  - Persisted across reloads and runs in Zustand store.

---

## Recommended Implementation Order

1. **Swap panels** ✅
2. **Fix long press timing** ✅
3. **Redesign opponent life controls** ✅
4. **Add icons to player toggles + align opponent toggles** ✅
5. **Add haste/defender to creatures** ✅
6. **Card counter system** ✅
7. **Opponent turn system** ✅
8. **Mowu commander variants** ✅

> [!NOTE]
> Items 1-6 can be implemented right now. Items 7-8 need some design decisions from you first — I've outlined my proposals above but want your input before building.

**Shall I proceed with implementing items 1-6 now?**
