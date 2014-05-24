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
var MAX_DISTANCE_PER_FRAME = SPEED / FRAMES_PER_SECOND;
var MAX_P = 5;

var DISTANCE_WEIGHT = 1;
var PI2 = Math.PI / 2.0;

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
if (typeof this.frames === 'undefined') {
    this.frames = 0;
}
if (typeof this.buildQueue === 'undefined') {
    this.buildQueue = [];
}
if (typeof this.queuedCount === 'undefined') {
    this.queuedCount = [0, 0, 0, 0, 0, 0]; // not including enemies
}

// 4 ranges, with index 0 being [0, Pi/2], usual positive direction.
function binHeading(vec) {
    var heading = vec.heading();
    return Math.floor(heading / PI2);
}

debug ? log("D: " + ((this.now() * FRAMES_PER_SECOND) - this.frames)) : null;

// Command
var items = base.getItems();
var peons = base.getByType(P);
var peasants = base.getByType(E);

for (var peonIndex = 0; peonIndex < peons.length; peonIndex++) {
    var peon = peons[peonIndex];
    var item;
    var pos;
    
    // Both small lists, should be quick.
    var peasant = peon.getNearest(peasants);
    var friend = peasant.getNearest(peons);
    
    var stealTarget = peasant.targetPos;
    var stealDistance = peon.distanceSquared(stealTarget);
    if (stealDistance <= peasant.distanceSquared(stealTarget) && stealDistance <= friend.distanceSquared(stealTarget)) {
        // Attept to deny their grab unless another peon is closer.
        pos = stealTarget;
        debug ? log(peon.id[0] + "=S") : null;
    } else {
        
        var bestScore = -1;
        for(var i = 0; i < items.length; ++i) {
            var possibleItem = items[i];
            
            var distance = peon.distance(possibleItem);
            var score = possibleItem.bountyGold / (distance*DISTANCE_WEIGHT);
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


// Build
var expectedPeons = peons.length + this.queuedCount[Pid];
debug ? log('E: ' + peasants.length) : null;
debug ? log("EP: " + expectedPeons) : null;
if (expectedPeons <= peasants.length && expectedPeons <= MAX_P) {
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
debug ? log("P: " + peons.length) : null;
debug ? log("Q: " + this.buildQueue) : null;

this.say(logger);
++this.frames;