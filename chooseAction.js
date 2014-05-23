// Init

var base = this;
var debug = true;
var logger = '';
function log(event) {
    logger += event + '; ';
}

if (typeof this.peonsBuilt === 'undefined') {
    this.peonsBuilt = 0;
}


// Command
var items = base.getItems();
var peons = base.getByType('peon');
debug ? log('Num peons is ' + peons.length) : null;
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
    type = 'peon';
} else {
    type = 'ogre';
} 

if (this.gold >= this.buildables[type].goldCost) {
    this.build(type);
    if (type === 'peon') {
        ++this.peonsBuilt;
    }
}

debug ? log("Peons built: " + this.peonsBuilt) : null;

this.say(logger);