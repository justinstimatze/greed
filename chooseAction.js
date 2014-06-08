// Init

var base = this;
var debug = false;
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
var MAX_P = 5;

// Trial and error.
var ANGLE_FACTOR = 1.1;
var DISTANCE_FACTOR = 1.0;
var FRIEND_FACTOR = 0.0;
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
        this.buildQueue = [P, M, P, O, P];
    }
    if (typeof this.queuedCount === 'undefined') {
        this.queuedCount = [3, 1, 1, 0, 0, 0]; // not including enemies
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

var GRID_ROWS = 5;
var GRID_COLS = 6;
var GRID_MAX = 29;
var TOP_ROW = (GRID_ROWS - 1);
var RIGHT_COL = (GRID_COLS - 1);
var TILE = 14;

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

    // Item: Grid center point (x,y), value accumulator, empty item list.
	this.grid = [
	[[0.5,0.5], 0, [], 0], [[1.5,0.5], 0, [], 0], [[2.5,0.5], 0, [], 0], [[3.5,0.5], 0, [], 0], [[4.5,0.5], 0, [], 0],[[5.5,0.5], 0, [], 0],
	[[0.5,1.5], 0, [], 0], [[1.5,1.5], 0, [], 0], [[2.5,1.5], 0, [], 0], [[3.5,1.5], 0, [], 0], [[4.5,1.5], 0, [], 0],[[5.5,1.5], 0, [], 0],
	[[0.5,2.5], 0, [], 0], [[1.5,2.5], 0, [], 0], [[2.5,2.5], 0, [], 0], [[3.5,2.5], 0, [], 0], [[4.5,2.5], 0, [], 0],[[5.5,2.5], 0, [], 0],
	[[0.5,3.5], 0, [], 0], [[1.5,3.5], 0, [], 0], [[2.5,3.5], 0, [], 0], [[3.5,3.5], 0, [], 0], [[4.5,3.5], 0, [], 0],[[5.5,3.5], 0, [], 0],
	[[0.5,4.5], 0, [], 0], [[1.5,4.5], 0, [], 0], [[2.5,4.5], 0, [], 0], [[3.5,4.5], 0, [], 0], [[4.5,4.5], 0, [], 0],[[5.5,4.5], 0, [], 0],    
	];
    // Cheatsheet:
    // 24,25,26,27,28,29
    // 18,19,20,21,22,23
    // 12,13,14,15,16,17
    // 06,07,08,09,10,11
    // 00,01,02,03,04,05
    
    // Critical loop.
    for(var itemIndex = 0; itemIndex < items.length; ++itemIndex) {
        
        var testX = items[itemIndex].pos.x;
        var testY = items[itemIndex].pos.y;

        var gridIndex = getCell(testX, testY)[0];
        
        this.grid[gridIndex][1] += items[itemIndex].bountyGold;
        this.grid[gridIndex][2].push(items[itemIndex]);
    }
    
    this.peasants = base.getByType(E);
    for (var peasantIndex = 0; peasantIndex < this.peasants.length; ++peasantIndex) {
        var peasantPos = this.peasants[peasantIndex].pos;
        var peasantGridIndex = getCell(peasantPos.x, peasantPos.y)[0];
        
        this.grid[peasantGridIndex][1] *= ENEMY_FACTOR;
    }
    
} else {
    var peonIndexCache = [];
    this.peons = base.getByType(P);
    for (var peonIndex = 0; peonIndex < this.peons.length; ++peonIndex) {
        var peonPos = this.peons[peonIndex].pos;
        var peonGridIndex = getCell(peonPos.x, peonPos.y);
        peonIndexCache[peonIndex] = peonGridIndex;
        ++this.grid[peonGridIndex[0]][3];
    }
    
    for (peonIndex = 0; peonIndex < this.peons.length; ++peonIndex) {
        var peon = this.peons[peonIndex];
        peonGridIndex = peonIndexCache[peonIndex][0];
        peonGridRow = peonIndexCache[peonIndex][1];
        peonGridCol = peonIndexCache[peonIndex][2];
        var bestScore = -1;
        var bestCellIndex;

        for (var testCellRow = 0; testCellRow < 5; ++testCellRow) {
            var rowDiffSq = (peonGridRow - testCellRow);
            rowDiffSq *= rowDiffSq;
            
            for (var testCellCol = 0; testCellCol < 6; ++testCellCol) {
                var colDiffSq = (peonGridCol - testCellCol);
                colDiffSq *= colDiffSq;
                
                var testCellDistance = Math.sqrt(rowDiffSq + colDiffSq);
                
                var testCellIndex = testCellRow*GRID_COLS + testCellCol;
                var testCellValue = this.grid[testCellIndex][1];
                
                var testCellScore = testCellValue / testCellDistance;
                
                if (testIndex > 0 && this.grid[testCellIndex][3] > 0) {
                    testCellScore *= FRIEND_FACTOR;
                }
                if (testCellScore > bestScore) {
                    bestScore = this.grid[testCellIndex][1];
                    bestCellIndex = testCellIndex;
                }
            }
        }
        
        var pos;
        if (bestScore > 0) {
            var bestCell = this.grid[bestCellIndex];
            
            if (bestCellIndex === peonGridIndex) {
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
            } else {
                pos = new Vector(bestCell[0][0], bestCell[0][1]);
            }
            
            var roughStep = Vector.subtract(pos, peon.pos);
            
            var score = -1; // Invalid
            var bestItem = peon.getNearest(base.getItems()); // Fallback
            var itemsEnroute = this.grid[peonGridIndex][2].concat(bestCell[2]);
            for (var enrouteIndex = 0; enrouteIndex < itemsEnroute.length; ++enrouteIndex) {
                var enrouteItem = itemsEnroute[enrouteIndex];
                var enrouteStep = Vector.subtract(enrouteItem.pos, peon.pos);
                var enrouteProduct = roughStep.dot(enrouteStep);
                enrouteProduct /= (roughStep.magnitude()*enrouteStep.magnitude());
                if (enrouteProduct > 1) { enrouteProduct = 1; } 
                else if (enrouteProduct < -1) { enrouteProduct = -1; }
                var enrouteAngle = ANGLE_FACTOR*Math.acos(enrouteProduct) / Math.PI; // Scales 0 to 1
                var enrouteDistance = DISTANCE_FACTOR*enrouteStep.magnitude()/roughStep.magnitude(); // Scales 0 to ~1
                var enrouteValue = enrouteItem.bountyGold / 5.0;
                var enrouteScore = enrouteValue/(enrouteAngle*enrouteDistance);
                if (enrouteScore > bestScore) {
                    bestScore = enrouteScore;
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
        
        // Protect my targetPos from multi turn spying.
        // Also, take the smallest step possible (grab distance is 4.8ish)
        var step = Vector.subtract(pos, peon.pos);
        step = Vector.limit(step, MAX_DISTANCE_PER_FRAME);
        pos = Vector.add(peon.pos, step);
        
        base.command(peon, 'move', pos);
        
    }
}

// Build
var expectedPeons = this.peons.length + this.queuedCount[Pid];
debug ? log('E: ' + this.peasants.length) : null;
debug ? log("EP: " + expectedPeons) : null;
// Burst
if (this.gold >= 50 && this.buildQueue.length === 0) {
        var randomUnit = Math.floor(Math.random()*4);
        if (randomUnit === Pid && expectedPeons <= MAX_P) {
            this.buildQueue.push(P);
            this.queuedCount[Pid] += 1;
        }
        else if (randomUnit === Mid) {
            this.buildQueue.push(M);
            this.buildQueue.push(M);
            this.buildQueue.push(M);
            this.buildQueue.push(M);
            this.buildQueue.push(M);
            this.queuedCount[Mid] += 5;
        } else if (randomUnit === Oid) {
            this.buildQueue.push(O);
            this.buildQueue.push(O);
            this.queuedCount[Oid] += 2;
        } else if (randomUnit === Sid) {
            this.buildQueue.push(S);
            this.queuedCount[Sid] += 1;
        }
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