// Init

var debug = false;
var logger = '';
function log(event) {
    logger += event + '; ';
}
function logVec(name, vec) {
    log(name + " = (" + Math.round(vec.x) + "," + Math.round(vec.y) + ")");
}

// http://discourse.codecombat.com/t/greed-tournament-game-specification-parameters-and-simulation/722
var FRAMES_PER_SECOND = 4.0; // As provided.
var SPEED = 10.0; // As provided.
var MAX_DISTANCE_PER_FRAME = SPEED / FRAMES_PER_SECOND;

// Shorthand variables
var TYPES = ['peasant', 'soldier', 'knight', 'librarian', 'griffin-rider', 'captain', 'peon'];
//          [ gatherer,  light,     medium,   wizard,      sniper,          heavy,     enemy]
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
}

debug ? log("D: " + ((this.now() * FRAMES_PER_SECOND) - this.frames)) : null;

// Command

var gatherers = this.getByType(G);
if (typeof gatherers === 'undefined') {
    gatherers = [];
}
var enemies = this.getByType(E);
if (typeof enemies === 'undefined') {
    enemies = [];
}
var items = this.getItems();
if (typeof items === 'undefined') {
    items = [];
}

var SNAG_DIST = 8;
var CUTOFF = 28;
var ITEM_WEIGHT = 2450;
var ENEMY_WEIGHT = -2100 + 455.0*enemies.length;
var GATHERER_WEIGHT = Math.min(-800 + 106.49*gatherers.length, 0);

for (var gathererIndex = 0; gathererIndex < gatherers.length && items.length !== 0 && enemies.length !== 0; ++gathererIndex) {
    var gatherer = gatherers[gathererIndex];
    var pos = new Vector(0, 0); // Avoid read-only transfer.
    
    var closestItem = gatherer.getNearest(items);
    if (gatherer.distanceSquared(closestItem) < SNAG_DIST) {
        pos.x = closestItem.pos.x;
        pos.y = closestItem.pos.y;
    } else {
        var x = gatherer.pos.x;
        var y = gatherer.pos.y;
     
        var netForce = new Vector(0, 0);
        var index;
        var object;
        var dSq;
        var d;
        var force;
        var forcex;
        var forcey;
          
        for (index = 0; index < items.length; ++index) {
            object = items[index];
            dSq = gatherer.distanceSquared(object);
            if (dSq > CUTOFF) {
                d = Math.sqrt(dSq);             
                force = ITEM_WEIGHT*object.bountyGold/(dSq*d);
                netForce.x += force * (object.pos.x - x);
                netForce.y += force * (object.pos.y - y);
            }
        }
        
        for (index = 0; index < enemies.length; ++index) {
            object = enemies[index];
            dSq = gatherer.distanceSquared(object);
            if (dSq > CUTOFF) {     
                d = Math.sqrt(dSq);
                force = ENEMY_WEIGHT/(dSq*d);
                netForce.x += force * (object.pos.x - x);
                netForce.y += force * (object.pos.y - y);
            }
        }   
        
        for (index = 0; index < gatherers.length; ++index) {
            if (index !== gathererIndex) {
                object = gatherers[index];
                dSq = gatherer.distanceSquared(object);
                if (dSq > CUTOFF) {              
                    d = Math.sqrt(dSq);
                    force = GATHERER_WEIGHT/dSq; 
                    netForce.x += force * (object.pos.x - x);
                    netForce.y += force * (object.pos.y - y);
                }
            }
        }
        
        var unitStep = Vector.normalize(netForce);
        var actualStep = Vector.multiply(unitStep, MAX_DISTANCE_PER_FRAME);
            
        // Avoid read-only transfer?
        var posTemp = Vector.add(gatherer.pos, actualStep);    
        pos.x = posTemp.x;
        pos.y = posTemp.y;
        
        // 5 unit buffer (pick up radius) around the border.
        if (pos.x < 5) {pos.x = 5;}
        if (pos.x > 80) {pos.x = 80;}
        if (pos.y < 5) {pos.y = 5;}
        if (pos.y > 65) {pos.y = 65;}
    }
                  
    this.command(gatherer, 'move', pos);
}


// Build
var expectedGatherers = gatherers.length + this.queuedCount[Gid];
var numEnemies = this.getEnemies().length - enemies.length - 1;
var gathererBuffer = 50;
var realGold = this.gold - gathererBuffer;
if (realGold >= 0) {
    if (enemies.length >= expectedGatherers) {
        this.buildQueue.unshift(G);
        ++this.queuedCount[Gid];
    }
    if ((numEnemies > 5 || this.health < 300 || this.now() > 110) && this.buildQueue.length < 20) {
        var randId = ((Math.random()*4) | 0) + 1; // 1-4
        this.buildQueue.push(TYPES[randId]);
        ++this.queuedCount[randId];
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

this.say(logger);
++this.frames;
