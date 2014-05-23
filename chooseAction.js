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

var P = 'peon';
var M = 'munchkin';
var O = 'ogre';
var S = 'shaman';
var F = 'fangrider';
var B = 'brawler';
var E = 'peasant';

// Persistent values.
if (typeof this.peonsBuilt === 'undefined') {
    this.peonsBuilt = 0;
}
if (typeof this.frames === 'undefined') {
    this.frames = 0;
}

debug ? log("D: " + ((this.now() * FRAMES_PER_SECOND) - this.frames)) : null;

// Command
var items = base.getItems();
var peons = base.getByType(P);
var peasants = base.getByType(E);
debug ? log('Num peasants is ' + peasants.length) : null;
var distanceWeight = 1;
var mode = 'thief';
for (var peonIndex = 0; peonIndex < peons.length; peonIndex++) {
    var peon = peons[peonIndex];
    var item;
    var pos;
    
    var peasant = peon.getNearest(peasants);
    var stealTarget = peasant.targetPos;
    if (peon.distanceSquared(stealTarget) <= peasant.distanceSquared(stealTarget)) {
        // Attept to deny their grab.
        pos = stealTarget;
        debug ? log(peon.id[0] + "=S") : null;
    } else {
        var bestScore = -1;
        for(var i = 0; i < items.length; ++i) {
            var possibleItem = items[i];
            var distance = peon.distance(possibleItem);
            var score = possibleItem.bountyGold / (distance*distanceWeight);
            if (score > bestScore) {
                // Assume E is just as smart and will get it before we do if closer.
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
var type;
if (this.peonsBuilt <= peasants.length && this.peonsBuilt <= MAX_P) {
    type = P;
} else {
    type = O;
} 

if (this.gold >= this.buildables[type].goldCost) {
    this.build(type);
    if (type === P) {
        ++this.peonsBuilt;
    }
}

debug ? log("Peons built: " + this.peonsBuilt) : null;

this.say(logger);
++this.frames;