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
var GRAB_DISTANCE = 4.8; // Emperical, from trial and error.
var MAX_P = 5;

var P = 'peon';
var M = 'munchkin';
var O = 'ogre';
var S = 'shaman';
var F = 'fangrider';
var B = 'brawler';
var E = 'peasant';

function realDistance(a, b) {
    var distance = a.distance(b);
    if (distance > GRAB_DISTANCE) {
        //distance -= GRAB_DISTANCE;
    }
    return distance;
}

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
    if (realDistance(peon.pos, stealTarget) <= realDistance(peasant.pos, stealTarget)) {
        // Attept to deny their grab.
        pos = stealTarget;
    } else {
        var bestScore = -1;
        for(var i = 0; i < items.length; ++i) {
            var possibleItem = items[i];
            var distance = realDistance(peon.pos, possibleItem.pos);
            var score = possibleItem.bountyGold / (distance*distanceWeight);
            if (score > bestScore) {
                // Assume E is just as smart and will get it before we do if closer.
                if (realDistance(peon.pos, possibleItem.pos) <= realDistance(peasant.pos, possibleItem.pos)) {
                    item = possibleItem;
                    bestScore = score;
                }
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
        
        var step = Vector.subtract(pos, peon.pos);

        // Don't have to get there exacctly
        var stepMagnitude = step.magnitude();
        if (stepMagnitude > GRAB_DISTANCE) {
            step = Vector.limit(step, (stepMagnitude - GRAB_DISTANCE));
        }
        
        // Protect my targetPos from long term spying.
        //var minStep = Vector.limit(, MAX_DISTANCE_PER_FRAME);
        
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