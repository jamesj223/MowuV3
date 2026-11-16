# gemini.md

## Overview

The purpose of this project/repo is to make a newer/prettier/fancier version of
my old MTG Goldfishing app. I included copies of V1 and V2, but have since removed the V2 folder.

V1 has a readme.md that describes the app as well as docs/todo.md that lists
some of the ideas I had for it. 

The general idea is that this is a web app you can bring up on your computer,
and use to playtest your MTG commander decks. Something of a middle ground 
between just plain goldfishing on your own, and playing against bots using
something like Forge. 

It needs to track life total(s), turns, and support the "opponent" playing
"cards". They can't necessarily be real cards though - the app doesn't know when
you play a spell, so it can't do event based stuff like countering, and same
for stuff like targeted removal. So the idea was to create fake cards/events,
that lean into this fact. "Destroy your biggest creature" instead of targetted 
removal, "spells cost 1 more" instead of countering, create tokens with poison,
deathtouch, "must block" or "must be blocked". 

My plan was to create a fake card template, generate new images with the text
and DIY the art myself using MS Paint. I think that will add a kind of charming
home made look to it (a la playtest or mystery booster cards).

## Initial instructions

Read through both V1 and V2. Analyse what is there. And then build V3 from 
scratch. Use modern web design tools/frameworks etc. I want it to look and feel
good. 

Plan first, ask questions, document design decisions - we're operating with 
Gemnini free model usage limits, so I will likely have to spread this work out 
across different models to get the most of their different daily usage limits, 
and this means that the model that starts a task, might not be the one that 
finishes it. We need to account for this in our design and planning.

## Next steps — pick up from docs/FEEDBACK-PLAN.md

The user provided detailed UI/UX feedback covering 8 items. A full implementation plan
with tiered priorities, specific file references, and design proposals is saved in 
`docs/FEEDBACK-PLAN.md`. **Start there.** Items 1-6 are ready to implement immediately.
Items 7-8 (opponent turn system + Mowu commander variants) need user confirmation on
the proposed designs before building.

### Quick reference of what needs doing (see FEEDBACK-PLAN.md for full details):
1. Swap left/right panels (Turn+Player on left, Opponent Life on right)
2. Long press +10 repeat is too fast — increase holdDelay and repeatInterval
3. Opponent life controls should use consistent compact +/- style (not verbose buttons)
4. Add Biohazard/Crown icons to player poison/cmdr toggles, align opponent toggles to header
5. All creatures need haste or defender keyword
6. Card counter system for +1/+1 and token counts
7. Opponent turn system with combat phases and idle flavour text
8. Random Mowu commander variants per bracket level