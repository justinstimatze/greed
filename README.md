greed
=====

Entries to Codecombat.com's Greed.

* Introduction post: http://blog.codecombat.com/multiplayer-programming-tournament
* Post-mortem post: http://blog.codecombat.com/a-31-trillion-390-billion-statement-programming-war-between-545-wizards

Final ranking: #98 (221 wins, 27 ties, 129 losses)

Summary of methods in order of creation (and strength).

## Initial impressions

Given the 4000 statement per frame limit, I decided to avoid A* and similar approaches that evaluated many options before arriving at a complete solution.
It seemed important to make the simplest reasonable local pathfinding decision given the quickly changing coins list, but this was probably a premature optimization error.

## Weighted item decisions

I attempted to rank nearby coins by their value and inverse square distance, choosing the highest ranking coin for my next destination.
This included checking to see if we were closer to the closest enemy gatherer's closest coin, which mean we should steal it from them (regardless of value) so they waste time in repathing.
This code got unweildy fairly quickly and wasn't performing well, so I began thinking of other approaches.

## Cell based decisions (https://github.com/justinstimatze/greed/blob/master/cells.js, Ogre)

This approach filled a 2D array of cells (6x5, 14 units square) with information about each coin within the cell.
Doing so took enough of the 4000 allowed statements that I had to alternate this process with acting on the information every other frame. This meant I was always working with slightly old information but I hoped the cells would enable me to to make better "long range" decisions without considering the individual items when evaluating options.

## Stalking every enemy, staying next to them. (https://github.com/justinstimatze/greed/blob/master/stalk.js, Human)

## Gravitational Search Algorithm (https://github.com/justinstimatze/greed/blob/master/best_gravity.js, Human)




