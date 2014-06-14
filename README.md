greed
=====

Entries to Codecombat.com's Greed.
Official [introduction post](http://blog.codecombat.com/multiplayer-programming-tournament) and [post-mortem post](http://blog.codecombat.com/a-31-trillion-390-billion-statement-programming-war-between-545-wizards).

Final ranking: [#98 (221 wins, 27 ties, 129 losses)](http://codecombat.com/play/ladder/greed#winners) and [sample match](http://codecombat.com/play/spectate/greed?session-one=537ed4db14bb1d38053b5b72&session-two=537dde5d933d99860613a256).

Summary of methods in order of decreasing strength.

## Gravitational Search Algorithm

([best_gravity.js](https://github.com/justinstimatze/greed/blob/master/best_gravity.js), Human)

I explored some of the research literature on swarm algorithms and cooperative resource collection.
I felt that the [gravitational search algorithm](http://en.wikipedia.org/wiki/Swarm_intelligence#Gravitational_search_algorithm) seemed like the most promising and implemented it on the final day of the competition.
I considered electric charges to be a better model, since negative/repulsive mass was a useful refinement.
I also allowed the charges to change linearly with the number of friendly and enemy gatherers, causing a shift in behavior over the simulation from avoiding enemies to stalking them.
I then used the top enemy player to tune the parameters but found them to be brittle and difficult to generalize to other players.

The unit production strategy was to always retain a buffer of gold sufficient to build a gatherer if we had fallen behind, but to otherwise hoard gold until we were being attacked or time was about to run out. 
At that point, a random queue of units would be built as quickly as possible to overwhelm the enemy with a large rush. 

I was very pleased to note the actual winning solution uses a [very similar system](https://gist.github.com/schmatz/4d216782b46d73c45813#file-greed_human-js-L144-L221) but is obviously superior in every way. I was especially impressed by his unit production strategy.

## Stalking every enemy, staying next to them.

([stalk.js](https://github.com/justinstimatze/greed/blob/master/stalk.js), Human)

I had noticed that enemy gatherers' current destinations were also available to me.
To defend against this, I made sure to never move more than the minimum possible per frame so that my long distance destinations would not be revealed.
I attempted to use the destinations to always be "one step ahead" in denying enemy gatherers their coins, but there is enough of a delay in the destination that they will be about one frame ahead of you still (or so it seemed).
I then attempted to place my gatherer near each enemy gatherer but on the side where I felt they would be more likely (by angle) to move next.
Many strong solutions tend to avoid enemy gatherers in the early part of the game, so this lead to many matches where I would simply chase the enemies and they would run away from my gatherers while still collecting coins ahead of them.

However, simply forcing each gatherer to remain about five units to the right (arbitrarily) of each enemy gatherer produced the highest number of coins.
In fact, this was my strongest solution before adopting the gravitational search!

## Cell based decisions 

([cells.js](https://github.com/justinstimatze/greed/blob/master/cells.js), Ogre)

This approach populated a 2D array of cells (5x6, 14 units square) with information about each coin within a given cell.
Doing so took enough of the 4000 allowed statements that I had to alternate this process with actually acting on the information every other frame. 
I would be working with slightly old information when moving gatherers but I hoped the cells would enable me to to make better "long range" decisions without considering the individual items when evaluating those options.
I wasn't sure how much various operations would count against the statement limit, so binning the coins into cells uses a maximum of six comparison operations per coin but this was probably also a premature optimization.

After the cells are populated, each gatherer selects the best (value and inverse square distance) cell and decides to move there. Before doing so, it lowers the value of both its current cell and destination cell (and cells containing enemy gatherers) so that all gatherers avoid both each other and do not compete for the same destination.
Since a cell is fairly large compared to a coin, the actual destination is the "gold center of mass" of the cell.
I had noticed that gatherers only needed to be within about 5 units to pick up a coin, so moving to the center of mass seemed like a reasonable way to pick up clusters of nearby coins.
If the destination cell is far away, we choose an actual coin (from the coins within the current and destination cells) that is closest to our trajectory to the destination center of mass, so that we are able to pick up coins enroute if possible.

The unit production strategy was simply to release small bursts of three light attackers when possible.

## Weighted item decisions

Given the 4000 statement per frame limit, I decided to avoid A* and approaches that evaluated many options before arriving at a complete solution.
It seemed important to make the simplest local pathfinding decision given the quickly changing coins list, but this was probably a premature optimization error.
I attempted to rank nearby coins by their value and inverse square distance, choosing the highest ranking coin for the gatherer's next destination.
This included checking to see if we were closer to the closest enemy gatherer's closest coin, which meant we should steal it from them (regardless of value) so they waste time in re-navigating.
This code got unwieldy quickly and wasn't performing well, so I began thinking of other approaches.


Thanks for reading!
