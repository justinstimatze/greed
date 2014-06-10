// Init

var debug = true;
var logger = '';
function log(event) {
    logger += event + '; ';
}
function logVec(vec, name) {
    log(name + " = (" + Math.round(vec.x) + "," + Math.round(vec.y) + ")");
}

// http://discourse.codecombat.com/t/greed-tournament-game-specification-parameters-and-simulation/722
var FRAMES_PER_SECOND = 4.0; // As provided.
var SPEED = 10.0; // As provided.
var MAX_DISTANCE_PER_FRAME = SPEED / FRAMES_PER_SECOND;
var MAX_HEALTH = 300;

// Shorthand variables
//          [ gatherer,  light,     medium,   wizard,      sniper,          heavy,     enemy]
var TYPES = ['peasant', 'soldier', 'knight', 'librarian', 'griffin-rider', 'captain', 'peon'];
//var TYPES = ['peon', 'munchkin', 'ogre', 'shaman', 'fangrider', 'brawler', 'peasant'];
var Gid = 0;
var G = TYPES[Gid];
var Lid = 1;
var L = TYPES[Lid];
var Mid = 2;
var M = TYPES[Mid];
var WSid = 3;
var W = TYPES[Wid];
var Sid = 4;
var S = TYPES[Sid];
var Hid = 5;
var H = TYPES[Hid];
var Eid = 6;
var E = TYPES[Eid];

var NUM_BINS = 4;
var TWO_PI = 2*Math.PI;
var BIN_SIZE = TWO_PI/NUM_BINS;

var OFFSET = 4;
var LEADS = [[OFFSET, OFFSET],
             [-OFFSET, OFFSET],
             [-OFFSET, -OFFSET],
             [OFFSET, -OFFSET]];
             
// Persistent values.
if (this.now() < 0.25) {
    if (typeof this.frames === 'undefined') {
        this.frames = 0;
    }
    if (typeof this.buildQueue === 'undefined') {
        this.buildQueue = [G];
    }
    if (typeof this.queuedCount === 'undefined') {
        this.queuedCount = [1, 0, 0, 0, 0, 0]; // not including most enemies
    }
    if (typeof this.next === 'undefined') {
        this.queuedCount = [1, 0, 0, 0, 0, 0]; // not including most enemies
    }
    
}

//debug ? log("D: " + ((this.now() * FRAMES_PER_SECOND) - this.frames)) : null;

// Command
// Steal/starve strategy may depend on turn evaluation:
// http://discourse.codecombat.com/t/what-is-the-turn-order-in-greed/748

// Assume these lists are in consistent order between turns for now, otherwise we have to sort them by id.
// Reverse because new units seem to appear at the front.
gatherers = this.getByType(G);
gatherers.reverse();
enemies = this.getByType(E);
enemies.reverse();

items = this.getItems();

var values = [];
for (var enemyIndex = 0; enemyIndex < enemies.length; ++enemyIndex) {
    var enemyVector = new Vector(enemies[enemyIndex].pos.x, enemies[enemyIndex].pos.y);
    values.push([[0, 0],
                 [1, 0],
                 [2, 0],
                 [3, 0]]);

    for (var itemIndex = 0; itemIndex < items.length; ++itemIndex) {
        var item = items[itemIndex];
        var itemVector = new Vector(item.pos.x, item.pos.y);
        var vecToItem = Vector.subtract(itemVector, enemyVector);
        var heading = vecToItem.heading();
        if (heading < 0) {
            heading += TWO_PI;
        }
        var bin = (heading / BIN_SIZE) | 0;
        var score = item.bountyGold / vecToItem.magnitude();
        values[enemyIndex][bin][1] += score;
    }
}

// Result: smallest to largest, since we pop off the end.
function byScore(a, b) {
    return (a[1] - b[1]);
}
for (enemyIndex = 0; enemyIndex < enemies.length; ++enemyIndex) {
    values[enemyIndex].sort(byScore);
}

for (var gathererIndex = 0; gathererIndex < gatherers.length; ++gathererIndex) {
    var gatherer = gatherers[gathererIndex];
  
    enemyIndex = gathererIndex % enemies.length;
    if (enemyIndex < enemies.length) { // Avoid first frame problem.
        var enemy = enemies[enemyIndex];
        
        // targetPos is too jittery to use directly.
        var pos = new Vector(enemy.pos.x, enemy.pos.y);
        var bestHeading = values[enemyIndex].pop()[0];
        pos.x += LEADS[bestHeading][0];
        pos.y += LEADS[bestHeading][1];
           
        this.command(gatherer, 'move', pos);
    }
}

// Build
var expectedGatherers = gatherers.length + this.queuedCount[Gid];
//debug ? log('E: ' + enemies.length) : null;
//debug ? log("EG: " + expectedGatherers) : null;

// Mixed force burst
if (this.health < MAX_HEALTH || this.now() > 120) {
    if (this.gold >= 30) {
        this.buildQueue.unshift(L);
        ++this.queuedCount[Lid];
        this.buildQueue.unshift(L);
        ++this.queuedCount[Lid];
        this.buildQueue.unshift(L);
        ++this.queuedCount[Lid];
    }
} else {
    if (this.gold >= 50) {
        this.buildQueue.unshift(G);
        ++this.queuedCount[Gid];
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
//debug ? log("G: " + gatherers.length) : null;
//debug ? log("Q: " + this.buildQueue) : null;

this.say(logger);
++this.frames;