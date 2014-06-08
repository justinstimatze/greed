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

var GRID_COLS = 6;
var GRID_MAX = 29;
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
    
    return [gridRow*GRID_COLS + gridCol, gridRow, gridCol];
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
	[[0.5,0.5], 0, []], [[1.5,0.5], 0, []], [[2.5,0.5], 0, []], [[3.5,0.5], 0, []], [[4.5,0.5], 0, []],[[5.5,0.5], 0, []],
	[[0.5,1.5], 0, []], [[1.5,1.5], 0, []], [[2.5,1.5], 0, []], [[3.5,1.5], 0, []], [[4.5,1.5], 0, []],[[5.5,1.5], 0, []],
	[[0.5,2.5], 0, []], [[1.5,2.5], 0, []], [[2.5,2.5], 0, []], [[3.5,2.5], 0, []], [[4.5,2.5], 0, []],[[5.5,2.5], 0, []],
	[[0.5,3.5], 0, []], [[1.5,3.5], 0, []], [[2.5,3.5], 0, []], [[3.5,3.5], 0, []], [[4.5,3.5], 0, []],[[5.5,3.5], 0, []],
    [[0.5,4.5], 0, []], [[1.5,4.5], 0, []], [[2.5,4.5], 0, []], [[3.5,4.5], 0, []], [[4.5,4.5], 0, []],[[5.5,4.5], 0, []],    
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
    var peonIndexCache = [];
    this.peons = base.getByType(P);
    for (var peonIndex = 0; peonIndex < this.peons.length; ++peonIndex) {
        var peonPos = this.peons[peonIndex].pos;
        var peonGridIndex = getCell(peonPos.x, peonPos.y)[0];
        peonIndexCache[peonIndex] = peonGridIndex;
    }
    
    this.peasants = base.getByType(E);
    for (var peasantIndex = 0; peasantIndex < this.peasants.length; ++peasantIndex) {
        var peasantPos = this.peasants[peasantIndex].pos;
        var peasantGridIndex = getCell(peasantPos.x, peasantPos.y)[0];
        
        this.grid[peasantGridIndex][1] *= ENEMY_FACTOR;
    }
    
    for (peonIndex = 0; peonIndex < this.peons.length; ++peonIndex) {
        var peon = this.peons[peonIndex];
        peonGridIndex = peonIndexCache[peonIndex];
        var bestScore = -1;
        var bestCellIndex;
        // Ensure "don't move" is first because we use > in score comparison.
        // It will remain the best case with sparse-equal cells.
        var testCells = [peonGridIndex, // Don't move.
                         peonGridIndex + GRID_COLS, // N
                         peonGridIndex + GRID_COLS + 1, // NE
                         peonGridIndex + GRID_COLS - 1, // NW
                         peonGridIndex + 1, // E
                         peonGridIndex - 1, // W
                         peonGridIndex - GRID_COLS, // S
                         peonGridIndex - GRID_COLS + 1, // SE
                         peonGridIndex - GRID_COLS - 1 // SW
                        ];
        
        // Look in each nearest cell, if it exists.    
        for (var testIndex in testCells) {
            var testCellIndex = testCells[testIndex];
            if (testCellIndex > 0 && testCellIndex <= GRID_MAX) {
                //log(testCellIndex + "=" + this.grid[testCellIndex][1]);
                if (this.grid[testCellIndex][1] > bestScore) {
                    var peonCheck = peonIndexCache.indexOf(testCellIndex);
                    // Not found OR Self
                    if (peonCheck === -1 || peonCheck === peonIndex) {
                        bestScore = this.grid[testCellIndex][1];
                        bestCellIndex = testCellIndex;
                    }
                }
            }
        }
        
        var pos;
        if (bestScore > 0) {
            var bestCell = this.grid[bestCellIndex];
            var cellItems = bestCell[2];
            var xcm = 0;
            var ycm = 0;
            for(var cellItemIndex = 0; cellItemIndex < cellItems.length; ++cellItemIndex) {
                var itemInCell = cellItems[cellItemIndex];
                xcm += itemInCell.bountyGold*itemInCell.pos.x;
                ycm += itemInCell.bountyGold*itemInCell.pos.y;
            }
            xcm /= bestCell[1];
            ycm /= bestCell[1];
 
            pos = new Vector(xcm, ycm);
            
            var roughStep = Vector.subtract(pos, peon.pos);
            
            var bestAngle = 9999; // Invalid
            var bestItem;
            var itemsEnroute = this.grid[peonGridIndex][2].concat(bestCell[2]);
            for (var enrouteIndex = 0; enrouteIndex < itemsEnroute.length; ++enrouteIndex) {
                var enrouteItem = itemsEnroute[enrouteIndex];
                var enrouteStep = Vector.subtract(enrouteItem.pos, peon.pos);
                var enrouteProduct = roughStep.dot(enrouteStep);
                enrouteProduct /= (roughStep.magnitude()*enrouteStep.magnitude());
                if (enrouteProduct > 1) { enrouteProduct = 1; } 
                else if (enrouteProduct < -1) { enrouteProduct = -1; }
                var enrouteAngle = Math.acos(enrouteProduct);
                if (enrouteAngle < bestAngle) {
                    bestAngle = enrouteAngle;
                    bestItem = enrouteItem;
                }
            }
            
            pos = bestItem.pos;

            bestCell[1] *= FRIENDLY_FACTOR; // For the next peon to avoid.
        } else {
            // Fallback, assume there's at least one item.
            var nearestItem = peon.getNearest(base.getItems());
            pos = nearestItem.pos;
        }
        
        //var step = Vector.subtract(pos, peon.pos);
        
        // Protect my targetPos from multi turn spying.
        // Also, take the smallest step possible (grab distance is 4.8ish)
        //step = Vector.limit(step, MAX_DISTANCE_PER_FRAME);
        
        //pos = Vector.add(peon.pos, step);
        base.command(peon, 'move', pos);
        
    }
}

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