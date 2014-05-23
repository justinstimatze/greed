// Init

var base = this;
var debug = true;
var logger = '';
function log(event) {
    logger += event + '; ';
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
        pos = stealTarget;
    } else {
        var bestScore = -1;
        for(var i = 0; i < items.length; ++i) {
            var possibleItem = items[i];
            var distance = peon.distance(possibleItem);
            var score = possibleItem.bountyGold / (distance*distanceWeight);
            if (score > bestScore) {
                item = possibleItem;
                bestScore = score;
            }
        }
        if (item) {
            pos = item.pos;
        } else {
            // No item passed the bestScore criteria.
            item = peon.getNearest(items); // Without regard to value.  
            pos = item.pos;
        }
    }
    
    if (pos) {
        // Protect my targetPos from long term spying.
        var minStep = Vector.limit(Vector.subtract(pos, peon.pos), MAX_DISTANCE_PER_FRAME);
        base.command(peon, 'move', Vector.add(peon.pos, minStep));
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