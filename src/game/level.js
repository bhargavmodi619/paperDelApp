// Procedurally lays out one street: houses, landmarks, the round, verge
// dressing, crossroads, obstacles and bundles.
import { S } from './state.js';
import { rnd, pick } from '../core/math.js';
import { HOUSE_X, LANES } from '../core/projection.js';
import { setCurveTable } from '../core/projection.js';
import { WALLS, ROOFS } from '../core/palette.js';
import { resetDust } from './particles.js';

var CURVE_STEP = 2;

/* ---- difficulty ----------------------------------------------------------
   Every one of these rises with the level and none of them ever stops rising,
   but speed and obstacle density approach a ceiling rather than climbing in a
   straight line — a linear ramp is unplayable by level 12 and the whole point
   is that it stays playable. The quota and the street length keep growing
   linearly, so later levels are longer and denser rather than merely faster. */
function speedFor(n){ return 8.5 + 3.4*(1 - Math.pow(0.86, n)) + Math.min(n,30)*0.03; }
function targetsFor(n){ return 5 + n; }
/* Spacing is a reaction time, not a distance: as speed climbs, the gap in
   metres has to climb with it or the street stops being dodgeable. Floors at
   about 1.25s between decisions. */
function gapTimeFor(n){ return 2.00 - 0.72*(1 - Math.pow(0.87, n)); }
function twoLaneChance(n){ return Math.min(0.32, 0.08 + n*0.026); }

function buildLevel(n){
  S.level = n;
  S.speed    = speedFor(n);
  S.targets  = targetsFor(n);
  S.trackLen = 170 + S.targets*22;
  S.trackPos = 0; S.lane = 1; S.px = 0; S.lean = 0;
  S.camX = 0; S.camBob = 0; S.camRoll = 0;
  S.delivered = 0; S.combo = 0; S.stun = 0; S.shake = 0; S.arm = 0;
  S.objs = []; S.shots = []; S.pops = []; resetDust();
  S.perfect = false; S.turnSign = 0; S.turnT = 0;

  var z, side, i;

  /* ---- crossroads, and the bend the rider takes through each one ----------
     A junction is a side street crossing the round. Just past it the road
     swings hard one way and straightens again: heading rises to a peak and
     returns to zero, so the world stays on a single z axis while the ride
     reads as turning a corner. */
  S.junctions = [];
  var jz = rnd(78, 116);
  while(jz < S.trackLen - 55){
    S.junctions.push({
      z: jz,
      turnZ: jz + 6,
      turnLen: 38,
      /* peak heading, in world-x per world-z */
      H: (Math.random()<0.5?-1:1) * rnd(0.17, 0.27),
      seed: Math.random()*10
    });
    jz += rnd(118, 168);
  }
  buildCurve();

  function nearJunction(zz, pad){
    for(var k=0;k<S.junctions.length;k++)
      if(Math.abs(S.junctions[k].z - zz) < pad) return true;
    return false;
  }

  /* ---- landmarks: temple, school, government office ----------------------
     Placed first so houses can give way to them. They are never on the round;
     they are there so the street has civic landmarks, not just frontage. */
  var landmarkTypes = ['temple','school','govt'];
  var lz = rnd(46, 72);
  var usedTypes = [];
  while(lz < S.trackLen - 30){
    var lt = pick(landmarkTypes);
    if(usedTypes.length && usedTypes[usedTypes.length-1]===lt) lt = pick(landmarkTypes);
    usedTypes.push(lt);
    var lside = (Math.random()<0.5?-1:1);
    S.objs.push({
      kind:'landmark', type:lt, side:lside, x:lside*(HOUSE_X+0.34), z:lz,
      w: lt==='school' ? rnd(3.4,4.0) : lt==='govt' ? rnd(2.9,3.3) : rnd(2.1,2.5),
      h: lt==='temple' ? rnd(2.2,2.6) : rnd(1.7,2.0),
      seed: Math.random()*10
    });
    lz += rnd(88, 132);
  }
  function nearLandmark(zz, sd){
    for(var k=0;k<S.objs.length;k++){
      var o = S.objs[k];
      if(o.kind==='landmark' && o.side===sd && Math.abs(o.z-zz) < o.w*1.5+2.2) return true;
    }
    return false;
  }

  /* ---- frontage both sides ---- */
  for(side=-1; side<=1; side+=2){
    z = rnd(14,20);
    while(z < S.trackLen + 80){
      if(!nearJunction(z, 9) && !nearLandmark(z, side)){
        S.objs.push({
          kind:'house', side:side, x:side*HOUSE_X, z:z,
          w:rnd(1.75,2.05), h:rnd(1.6,2.0),
          wall:pick(WALLS), roof:pick(ROOFS),
          storey:(Math.random()<0.30?2:1),
          shop:(Math.random()<0.28),
          target:false, done:false, claimed:false, tried:false,
          seed:Math.random()*10
        });
      }
      z += rnd(3.4,5.0);
    }
  }

  /* ---- the round ---- */
  var cand = S.objs.filter(function(o){
    return o.kind==='house' && o.z>26 && o.z<S.trackLen-8;
  });
  cand.sort(function(a,b){ return a.z-b.z; });
  var step = cand.length/S.targets, placed = 0;
  for(i=0;i<S.targets;i++){
    var idx = Math.min(cand.length-1, Math.round(i*step + rnd(0, step*0.5)));
    if(cand[idx] && !cand[idx].target){ cand[idx].target=true; cand[idx].shop=false; placed++; }
  }
  S.targets = placed;
  S.need = Math.max(3, Math.ceil(S.targets*0.65));

  /* Papers are scarce on purpose: the quota plus two. Every wasted throw is
     felt, and bundles on the road are the only way back. */
  S.papers = S.need + 2;

  /* ---- verge dressing ---- */
  for(z=12; z<S.trackLen+70; z+=rnd(5,9)){
    if(nearJunction(z,7)) continue;
    S.objs.push({ kind:'prop', type:pick(['pole','tree','tree','hoarding','handpump']),
                  x:(Math.random()<0.5?-1:1)*rnd(1.55,1.95), z:z, seed:Math.random()*10 });
  }
  /* chai stalls, hawkers, dozing dogs — the street waking up */
  for(z=30; z<S.trackLen; z+=rnd(38,64)){
    S.objs.push({ kind:'prop', type:'chai', x:(Math.random()<0.5?-1:1)*1.75, z:z, seed:Math.random()*10 });
  }
  for(z=52; z<S.trackLen; z+=rnd(42,70)){
    S.objs.push({ kind:'prop', type:'hawker', hawker:pick(['sabzi','fruit','milk','broom']),
                  x:(Math.random()<0.5?-1:1)*rnd(1.6,1.9), z:z, seed:Math.random()*10 });
  }
  for(z=45; z<S.trackLen; z+=rnd(46,74)){
    S.objs.push({ kind:'prop', type:'dog', x:(Math.random()<0.5?-1:1)*rnd(1.5,1.8), z:z, seed:Math.random()*10 });
  }
  /* bunting across the street */
  for(z=55; z<S.trackLen; z+=rnd(55,90)){
    if(nearJunction(z,10)) continue;
    S.objs.push({ kind:'bunting', x:0, z:z, seed:Math.random()*10 });
  }

  /* ---- crossing dogs -------------------------------------------------------
     These are the only hazard that can move into your lane, so they always
     telegraph: the dog is on the verge with its ears up for a beat before it
     bolts. None at all on level 1 — the first street is where players decide
     whether to keep going, so it teaches the throw and nothing else. */
  var dogGap = Math.max(54, 128 - n*6);
  for(z=(n<2 ? 1e9 : 68); z<S.trackLen-24; z+=rnd(dogGap, dogGap+50)){
    if(nearJunction(z,12)) continue;
    var from = (Math.random()<0.5?-1:1);
    S.objs.push({
      kind:'cross', type:'dog', z:z,
      from:from, x:from*1.85, x0:from*1.85, x1:-from*1.85,
      phase:'wait', t:0, checked:false,
      speed:rnd(1.5,2.1) + n*0.05,
      seed:Math.random()*10
    });
  }

  /* ---- obstacles: sparse, one free lane always reachable ---- */
  var types = ['cow','auto','thela','pothole','scooter','tempo'];
  var freeLane = 1;
  var gap = S.speed * gapTimeFor(n);
  for(z=34; z<S.trackLen-12; z+=rnd(gap, gap+6)){
    if(nearJunction(z,8)) continue;
    var opts = [freeLane-1, freeLane, freeLane+1].filter(function(l){ return l>=0&&l<=2; });
    freeLane = opts[(Math.random()*opts.length)|0];
    var others = [0,1,2].filter(function(l){ return l!==freeLane; });
    var two = Math.random() < twoLaneChance(n);
    if(!two) others = [others[(Math.random()*others.length)|0]];
    for(i=0;i<others.length;i++){
      var lane = others[i];
      var t = pick(types);
      if(t==='tempo' && lane===1) t = 'thela';
      if((t==='tempo'||t==='auto') && others.length>1) t = 'pothole';
      S.objs.push({ kind:'obs', type:t, lane:lane, x:LANES[lane], z:z+rnd(-0.4,0.4),
                    checked:false, seed:Math.random()*10,
                    vz:(t==='auto'? rnd(2.5,4) : t==='tempo'? -rnd(3,4.5) : 0) });
    }
  }

  /* ---- bundles: rarer and smaller than they were ---- */
  for(z=48; z<S.trackLen-20; z+=rnd(56,86)){
    if(nearJunction(z,7)) continue;
    var ln = (Math.random()*3)|0;
    S.objs.push({ kind:'pickup', lane:ln, x:LANES[ln], z:z, amount:3, taken:false, checked:false });
  }

  S.objs.sort(function(a,b){ return a.z-b.z; });
}

/* Integrate the junction bends into a lookup table of lateral road offset.
   heading rises to H at the middle of the bend and returns to zero, so the
   road ends up shifted sideways but pointing straight again. */
function buildCurve(){
  var len = Math.ceil((S.trackLen + 160)/CURVE_STEP) + 2;
  var table = new Float64Array(len);
  var offset = 0;
  for(var i=0;i<len;i++){
    var z = i*CURVE_STEP;
    var heading = 0;
    for(var k=0;k<S.junctions.length;k++){
      var j = S.junctions[k];
      var t = (z - j.turnZ)/j.turnLen;
      if(t>0 && t<1) heading += j.H*Math.sin(Math.PI*t);
    }
    offset += heading*CURVE_STEP;
    table[i] = offset;
  }
  S.curve = table;
  setCurveTable(table, CURVE_STEP);
}

/* How hard the road is bending where the rider is, for lean and camera roll. */
function bendHeading(z){
  var heading = 0;
  for(var k=0;k<S.junctions.length;k++){
    var j = S.junctions[k];
    var t = (z - j.turnZ)/j.turnLen;
    if(t>0 && t<1) heading += j.H*Math.sin(Math.PI*t);
  }
  return heading;
}

export { buildLevel, bendHeading, speedFor, targetsFor, gapTimeFor, CURVE_STEP };
