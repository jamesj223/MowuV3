# Mowu V3 - Architecture Specification

## 1. Executive Summary
Mowu V3 is a modern, high-performance web application designed for playtesting (goldfishing) Magic: The Gathering Commander decks. It strikes a balance between solitary goldfishing and automated bot simulators by introducing scalable, interactive opponent events, dynamic game tracking, and persistent analytics.

## 2. Tech Stack
- **Framework**: React 18 / 19 with TypeScript & Vite
- **Styling**: Tailwind CSS, PostCSS, Lucide React icons
- **State Management**: Zustand with `localStorage` persistence
- **Animation**: Framer Motion & CSS keyframe animations (tactile life deltas, card draws)
- **Keyboard Handling**: React Hotkeys Hook / native event listeners with full config & cheat-sheet
- **Charts / Analytics**: Recharts
- **Storage**: LocalStorage / IndexedDB for deck configurations and game match history

## 3. Directory Layout
```
/
├── MowuV1/                  # Historical reference (V1)
├── MowuV2/                  # Historical reference (V2)
├── docs/                    # Multi-model continuity & specifications
│   ├── ARCHITECTURE.md     # High-level architecture and data models
│   ├── DECISIONS.md        # Architectural Decision Records (ADRs)
│   └── ROADMAP.md          # Implementation milestones & progress tracking
└── mowu-v3/                 # Mowu V3 Production App (Vite + React + TS)
    ├── public/
    │   └── cards/          # MS Paint card artwork PNGs (user editable)
    └── src/
        ├── assets/         # App icons, logos, sound effects
        ├── components/     # UI Components
        │   ├── cards/      # MTG Playtest Card renderer & inspector
        │   ├── counters/   # Life, Turn, Delta, Commander Damage, Poison
        │   ├── events/     # Active event tray, battlefield, resolution log
        │   ├── stats/      # Charts, deck history, analytics
        │   └── ui/         # Dialogs, buttons, tooltips, sheets
        ├── data/           # Default event card definitions & scaling formulas
        ├── hooks/          # Keyboard shortcuts, sound effects, screen wake-lock
        ├── store/          # Zustand game store, settings store, deck store
        └── types/          # TypeScript definitions
```

## 4. Domain Models & Schemas

### 4.1 Game State (`useGameStore`)
- **Turn Counter**: Current turn number (1-indexed).
- **Opponent Tracking**:
  - `targetDamage`: Default 120 (configurable, e.g. 40 or custom).
  - `damageDealt`: Total cumulative damage dealt to opponent.
  - `remainingLife`: `targetDamage - damageDealt`.
  - `damageThisTurn`: Tracked per-turn damage input.
- **Player Tracking (Optional Toggle)**:
  - `playerLife`: Starts at 40, increment/decrement.
  - `poisonCounters`: Starts at 0, lethal at 10.
  - `commanderDamage`: Starts at 0, lethal at 21.
- **Opponent Battlefield & Events**:
  - `activePermanents`: Persistent tokens and enchantments (e.g. 2/2 Zombie blocker, Ghostly Prison tax). Click to destroy/dismiss.
  - `resolvedEvents`: History log of one-shot spells (wipes, discards).
  - `eventFrequency`: Number of turns between events (default 3, or Easy=7, Medium=5, Hard=3, Off=0, Custom).

### 4.2 Card & Event Schema (`types/event.ts`)
```typescript
export type EventType = 'creature' | 'board_wipe' | 'removal' | 'tax' | 'disruption' | 'lifegain';
export type EventTiming = 'turn_start' | 'combat' | 'end_step';

export interface EventCardDefinition {
  id: string;
  name: string;
  manaCost: string;
  typeLine: string; // e.g. "Creature — Zombie Token", "Sorcery", "Enchantment"
  artFile: string;  // Filename in /public/cards/ (e.g. "homing-fireball-pigeon.png")
  baseText: string; // Dynamic template: "Deals {X} damage to your highest power creature."
  flavorText?: string;
  power?: number | string;
  toughness?: number | string;
  category: EventType;
  isPermanent: boolean;
  minTurn?: number; // Scaling filter
  scaleFormula?: (turn: number, difficultyMultiplier: number) => { [key: string]: number | string };
}
```

### 4.3 Playtest Card Frame Design
- Authentic MTG card ratio (63 x 88mm aspect ratio, rounded corners, card border).
- Header: Card Name + Mana Cost symbols.
- Art Window: Loads user-drawn PNG from `/public/cards/<name>.png` with fallback stylish MS Paint-like SVG doodle placeholder.
- Type line: Card Type (Instant, Sorcery, Creature, Enchantment).
- Text Box: Dynamic text with scaled values computed based on turn/difficulty.
- Bottom line: Power / Toughness box (for creatures/tokens) and artist credit ("Artist: James (MS Paint)").
