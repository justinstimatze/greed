greed
=====

Entries to Codecombat.com's Greed.

* Introduction post: http://blog.codecombat.com/multiplayer-programming-tournament
* Post-mortem post: http://blog.codecombat.com/a-31-trillion-390-billion-statement-programming-war-between-545-wizards

Final ranking: #98 (221 wins, 27 ties, 129 losses)
Summary of methods in order of creation (and strength).

## Initial impressions

Given the 4000 statement per frame limit, I decided to avoid A* and similar approaches that evaluated many options before arriving at a complete solution.
It seemed important to make the simplest reasonable local path finding decision given the quickly changing coins list, but this was probably a premature optimization error.

## Weighted item decisions

I attempted to rank nearby coins by their value and inverse square distance, choosing the highest ranking coin for my next destination.
This included checking to see if we were closer to the closest enemy gatherer's closest coin, which mean we should steal it from them (regardless of value) so they waste time in repathing.
This code got unweildy fairly quickly and I began thinking of other approaches.

## Cell based decisions (cells.js, Ogre)

## Stalking every enemy, staying next to them. (stalk.js, Human)

## Gravitational Search Algorithm (best_gravity.js, Human)




