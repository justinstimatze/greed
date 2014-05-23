// This code runs once per frame. Build units and command peons!
// Destroy the human base within 180 seconds.
// Run over 4000 statements per call and chooseAction will run less often.
// Check out the green Guide button at the top for more info.

var base = this;
var debug = true;
var logger = '';

function log(event) {
    logger += event + '; ';
}

/////// 1. Command peons to grab coins and gems. ///////
// You can only command peons, not fighting units.
// You win by gathering gold more efficiently to make a larger army.
// Click on a unit to see its API.
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


/////// 2. Decide which unit to build this frame. ///////
// Peons can gather gold; other units auto-attack the enemy base.
// You can only build one unit per frame, if you have enough gold.
if (typeof this.peonsBuilt === 'undefined') {
    this.peonsBuilt = 0;
}
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

// 'peon': Peons gather gold and do not fight.
// 'munchkin': Light melee unit.
// 'ogre': Heavy melee unit.
// 'shaman': Support spellcaster.
// 'fangrider': High damage ranged attacker.
// 'brawler': Mythically expensive super melee unit.
// See the buildables documentation below for costs and the guide for more info.