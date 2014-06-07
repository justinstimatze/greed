// Init

var base = this;
var debug = true;
var logger = '';
function log(event) {
    logger += event + '; ';
}
function logVec(vec, name) {
    log(name + " = (" + Math.round(vec.x) + "," + Math.round(vec.y) + ")");
}

var FRAMES_PER_SECOND = 4.0;
var SPEED = 10.0; // As provided.
var MAX_DISTANCE_PER_FRAME = 2 * SPEED / FRAMES_PER_SECOND;
var MAX_P = 3;

var DISTANCE_WEIGHT = 1;
var FRIENDLY_FACTOR = 0.0;
var ENEMY_FACTOR = 0.0;

// Shorthand variables
var TYPES = ['peon', 'munchkin', 'ogre', 'shaman', 'fangrider', 'brawler', 'peasant'];
var P = 'peon';
var Pid = 0;
var M = 'munchkin';
var Mid = 1;
var O = 'ogre';
var Oid = 2;
var S = 'shaman';
var Sid = 3;
var F = 'fangrider';
var Fid = 4;
var B = 'brawler';
var Bid = 5;
var E = 'peasant';
var Eid = 6;

// Persistent values.
if (this.now() < 0.25) {
    if (typeof this.frames === 'undefined') {
        this.frames = 0;
    }
    if (typeof this.buildQueue === 'undefined') {
        this.buildQueue = [];
    }
    if (typeof this.queuedCount === 'undefined') {
        this.queuedCount = [0, 0, 0, 0, 0, 0]; // not including enemies
    }
    if (typeof this.grid === 'undefined') {
        this.grid = [];
    }
    if (typeof this.peons === 'undefined') {
        this.peons = [];
    }
    if (typeof this.peasants === 'undefined') {
        this.peasants = [];
    }
}

var MAX_COL = 6;
var MAX_ROW = 5;
var TILE = 14;
var MAX_ITEM = 60; // Only process this many items to build heatmap.

function byValue (a,b) { return (b.bountyGold - a.bountyGold); }

// Should be a maximum of three comparisons to get an index,
// avoiding the division/floor cost.
function getCell(testX, testY) {
    var gridCol, gridRow;
    
    if (testX < 42) {
        if (testX < 28) {
             if (testX < 14) {
                 gridCol = 0;
             } else {
                 gridCol = 1;
             }
        } else {
           gridCol = 2;
        }
    } else {
        if (testX > 56) {
            if (testX > 70) {
                gridCol = 5;
            } else {
                gridCol = 4;
            }
        } else {
            gridCol = 3;
        }
    }
    if (testY > 28) {
        if (testY > 42) {
            if (testY > 56) {
                gridRow = 4;
            } else {
                gridRow = 3;
            }
        } else {
            gridRow = 2;
        }
    } else {
        if (testY > 14) {
            gridRow = 1;
        } else {
            gridRow = 0;
        }
    }
    
    return [gridRow*MAX_ROW + gridCol, gridRow, gridCol];
}

debug ? log("D: " + ((this.now() * FRAMES_PER_SECOND) - this.frames)) : null;

// Command
if (this.frames % 2 === 0) {
    var items = base.getItems();
    
    // We want all the expensive items to be processed if possible.
    // Unbounded sort, risky.
    items.sort(byValue);
    
    // Item: Grid center point (x,y), value accumulator, empty item list.
    this.grid = [
    [[0.5,4.5], 0, []], [[1.5,4.5], 0, []], [[2.5,4.5], 0, []], [[3.5,4.5], 0, []], [[4.5,4.5], 0, []],[[5.5,4.5], 0, []],
    [[0.5,3.5], 0, []], [[1.5,3.5], 0, []], [[2.5,3.5], 0, []], [[3.5,3.5], 0, []], [[4.5,3.5], 0, []],[[5.5,3.5], 0, []],
    [[0.5,2.5], 0, []], [[1.5,2.5], 0, []], [[2.5,2.5], 0, []], [[3.5,2.5], 0, []], [[4.5,2.5], 0, []],[[5.5,2.5], 0, []],
    [[0.5,1.5], 0, []], [[1.5,1.5], 0, []], [[2.5,1.5], 0, []], [[3.5,1.5], 0, []], [[4.5,1.5], 0, []],[[5.5,1.5], 0, []],
    [[0.5,0.5], 0, []], [[1.5,0.5], 0, []], [[2.5,0.5], 0, []], [[3.5,0.5], 0, []], [[4.5,0.5], 0, []],[[5.5,0.5], 0, []],
    ];
                
    // Critical loop.
    for(var itemIndex = 0; itemIndex < items.length && itemIndex < MAX_ITEM; ++itemIndex) {
        
        var testX = items[itemIndex].pos.x;
        var testY = items[itemIndex].pos.y;

        var gridIndex = getCell(testX, testY)[0];
        
        this.grid[gridIndex][1] += items[itemIndex].bountyGold;
        this.grid[gridIndex][2].push(items[itemIndex]);
    }
    
} else {
    this.peons = base.getByType(P);
    for (var peonIndex = 0; peonIndex < this.peons.length; ++peonIndex) {
        var peonPos = this.peons[peonIndex].pos;
        var peonGridIndex = getCell(peonPos.x, peonPos.y)[0];
        
        this.grid[peonGridIndex][1] *= FRIENDLY_FACTOR;
    }
    
    this.peasants = base.getByType(E);
    for (var peasantIndex = 0; peasantIndex < this.peasants.length; ++peasantIndex) {
        var peasantPos = this.peasants[peasantIndex].pos;
        var peasantGridIndex = getCell(peasantPos.x, peasantPos.y)[0];
        
        this.grid[peasantGridIndex][1] *= ENEMY_FACTOR;
    }
    
    
}
/* 
for (var peonIndex = 0; peonIndex < peons.length; peonIndex++) {
    var peon = peons[peonIndex];
    var item;
    var pos;
    
    var friendsWeight = [0, 0, 0, 0]; // Right, Up, Left, Down.
    
    // Both small lists, should be quick.
    var peasant = peon.getNearest(peasants);
    var accomplice = peasant.getNearest(peons);
    
    var stealTarget = peasant.targetPos;
    var stealDistance = peon.distanceSquared(stealTarget);
    if (stealDistance <= peasant.distanceSquared(stealTarget) && stealDistance <= accomplice.distanceSquared(stealTarget)) {
        // Attept to deny their grab unless another peon is closer.
        pos = stealTarget;
        debug ? log(peon.id[0] + "=S") : null;
    } else {
        
        // Avoid ourselves
        for (var friendIndex = 0; friendIndex < peons.length; ++friendIndex) {
            if (friendIndex === peonIndex) {
                continue; // Ignore ourselves.
            }
            var friend = peons[friendIndex];
            var friendDistance = peon.distance(friend);
            var friendWeight = -1.0/friendDistance;
            if (friend.pos.x > peon.pos.x) {
                friendsWeight[0] += friendWeight;
            }
            if (friend.pos.y > peon.pos.y) {
                friendsWeight[1] += friendWeight;
            }
            if (friend.pos.x <= peon.pos.x) {
                friendsWeight[2] += friendWeight;
            }
            if (friend.pos.y <= peon.pos.y) {
                friendsWeight[3] += friendWeight;
            }
        }
        
        var bestScore = -1;
        var bestScore2 = 0;
        

            
            var vecToPossible = Vector.subtract(possibleItem.pos, peon.pos);
            var distance = vecToPossible.magnitude();

            // Add weights. 
            var score = possibleItem.bountyGold / (distance*DISTANCE_WEIGHT);
            if (possibleItem.pos.x > peon.pos.x) {
                score += friendsWeight[0];
            }
            if (possibleItem.pos.y > peon.pos.y) {
                score += friendsWeight[1];
            }
            if (possibleItem.pos.x <= peon.pos.x) {
                score += friendsWeight[2];
            }
            if (possibleItem.pos.y <= peon.pos.y) {
                score += friendsWeight[3];
            }
            
            if (score > bestScore) {
                // Assume E will get it before we do, if closer.
                if (peon.distanceSquared(possibleItem) <= peasant.distanceSquared(possibleItem)) {
                    item = possibleItem;
                    bestScore = score;
                }
            }
        }
        if (item) {
            pos = item.pos;
            debug ? log(peon.id[0] + "=W") : null;
        } else {
            // No item passed the bestScore criteria.
            item = peon.getNearest(items); // Without regard to value.  
            pos = item.pos;
            debug ?  log(peon.id[0] + "=N") : null;
        }
    }
    
    if (pos) {
        var step = Vector.subtract(pos, peon.pos);
        
        // Protect my targetPos from multi turn spying.
        // Also, take the smallest step possible (grab distance is 4.8ish)
        step = Vector.limit(step, MAX_DISTANCE_PER_FRAME);
        
        pos = Vector.add(peon.pos, step);
        base.command(peon, 'move', pos);
    }
}
*/

// Build
var expectedPeons = this.peons.length + this.queuedCount[Pid];
debug ? log('E: ' + this.peasants.length) : null;
debug ? log("EP: " + expectedPeons) : null;
if (expectedPeons <= this.peasants.length && expectedPeons <= MAX_P) {
    this.buildQueue.unshift(P);
    ++this.queuedCount[Pid];
} else if (this.queuedCount[Oid] < 1) {
    this.buildQueue.push(O);
    ++this.queuedCount[Oid];
}

if (this.buildQueue.length !== 0) {
    var nextType = this.buildQueue[0];
    if (this.gold >= this.buildables[nextType].goldCost) {
        var typeId = TYPES.indexOf(nextType);
        this.buildQueue.shift();
        --this.queuedCount[typeId];
        
        this.build(nextType);
    }
}
debug ? log("P: " + this.peons.length) : null;
debug ? log("Q: " + this.buildQueue) : null;

this.say(logger);
++this.frames;