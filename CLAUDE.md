# Mowu v3: notes for agents

## What this is

A web app for playtesting (goldfishing) Magic: The Gathering Commander decks. It sits between plain solo
goldfishing and playing against bots in something like Forge or Arena. It tracks life totals and turns, and a
simulated opponent ("Mowu", a dog, in several commander variants) "plays cards" on its turns.

**The key constraint:** the app never knows what the player actually does. It can't counter a spell, target a
specific permanent, or react to events. Opponent cards are therefore *fake* cards designed around that, e.g.
"Destroy your creature with the highest power" instead of targeted removal, "Noncreature spells cost {1}
more" instead of counterspells, and tokens with Deathtouch, Toxic or "must block". Card art is hand-drawn by
the owner in MS Paint (`public/cards/*.png`) for a homemade playtest-card look.

Design intent for the opponent: **outside of Bracket 1, Mowu does *something* every turn** (not necessarily a
bomb: a cheap creature, a counter, a small tax all count), and each Mowu commander plays to its archetype.
Bracket 1 may have quiet turns. See ADR-018 and `docs/todo.md`.

## Where things are

- `README.md`: features, hotkeys, brackets, dev commands, how to add a card.
- `docs/todo.md`: the owner's backlog and feedback. Read this before proposing features.
- `docs/ROADMAP.md`: current handoff status and open questions. Update it when you finish a chunk of work.
- `docs/DECISIONS.md`: ADRs. Add one for any behaviour or design decision others would otherwise re-litigate.
- `docs/PHASE-2-PLAN.md`, `docs/archive/`: past plans, kept for history.
- Code: `src/logic/game.ts` (pure rules, unit-tested), `src/store/` (Zustand), `src/data/` (cards and
  commanders), `src/types/game.ts` (brackets).

## Rules of the road

- **Precedence:** decisions recorded from ADR-013 onward override earlier ones, which were made by other LLMs
  and are often wrong. The owner prefers well-reasoned later decisions over earlier choices.
- **Brackets** are quoted from Wizards' October 2025 Commander Brackets update (ADR-017). Don't paraphrase
  them or invent turn ranges. Event cadence and card scaling are our own tuning and are fair game to change.
- **Game rules go in `src/logic/`** as pure functions with tests, not inside components or store actions.
- **Before calling something done**, run `npm run lint`, `npm test` and `npm run build`, and for UI changes,
  check it in a browser. Earlier agents shipped a broken build and a component that crashed on first render.
- Keep docs in sync. If you change hotkeys, brackets or card behaviour, update the README and the Help modal.

## Commands

```bash
npm install
npm run dev     # dev server
npm test        # Vitest
npm run lint    # oxlint
npm run build   # type-check + production build
```
