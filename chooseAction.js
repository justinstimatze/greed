// Init

var base = this;
var debug = true;
var logger = '';
function log(event) {
    logger += event + '; ';
}

var FRAMES_PER_SECOND = 4.0;

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
for (var peonIndex = 0; peonIndex < peons.length; peonIndex++) {
    var peon = peons[peonIndex];
    var item = peon.getNearest(items); // Without regard to value.
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
    if (item)
        base.command(peon, 'move', item.pos);
}


// Build
var type;
if (this.peonsBuilt < 2) {
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