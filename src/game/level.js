// Procedurally lays out one street: houses, the round, verge dressing, obstacles, bundles.
import { S } from './state.js';
import { rnd, pick } from '../core/math.js';
import { HOUSE_X, LANES } from '../core/projection.js';
import { WALLS, ROOFS } from '../core/palette.js';

function buildLevel(n){
  var lv = Math.min(n,8);
  S.trackLen = 200 + lv*38;
  S.speed    = 8.5 + lv*0.35;
  S.targets  = 5 + Math.min(n,5);
  S.papers   = S.targets + 6;
  S.trackPos = 0; S.lane = 1; S.px = 0; S.lean = 0;
  S.delivered = 0; S.combo = 0; S.stun = 0; S.shake = 0; S.arm = 0;
  S.objs = []; S.shots = []; S.pops = []; S.dust = [];
  S.perfect = false;

  var z, side, i;

  /* frontage both sides */
  for(side=-1; side<=1; side+=2){
    z = rnd(14,20);
    while(z < S.trackLen + 80){
      S.objs.push({
        kind:'house', side:side, x:side*HOUSE_X, z:z,
        w:rnd(1.75,2.05), h:rnd(1.6,2.0),
        wall:pick(WALLS), roof:pick(ROOFS),
        storey:(Math.random()<0.30?2:1),
        shop:(Math.random()<0.28),
        target:false, done:false, claimed:false, tried:false,
        seed:Math.random()*10
      });
      z += rnd(3.4,5.0);
    }
  }

  /* the round */
  var cand = S.objs.filter(function(o){ return o.z>26 && o.z<S.trackLen-8; });
  cand.sort(function(a,b){ return a.z-b.z; });
  var step = cand.length/S.targets, placed = 0;
  for(i=0;i<S.targets;i++){
    var idx = Math.min(cand.length-1, Math.round(i*step + rnd(0, step*0.5)));
    if(cand[idx] && !cand[idx].target){ cand[idx].target=true; cand[idx].shop=false; placed++; }
  }
  S.targets = placed;
  S.need = Math.max(3, Math.ceil(S.targets*0.65));

  /* verge dressing */
  for(z=12; z<S.trackLen+70; z+=rnd(5,9)){
    S.objs.push({ kind:'prop', type:pick(['pole','tree','tree','hoarding','handpump']),
                  x:(Math.random()<0.5?-1:1)*rnd(1.55,1.95), z:z, seed:Math.random()*10 });
  }
  /* chai stalls and dogs, occasional */
  for(z=30; z<S.trackLen; z+=rnd(40,70)){
    S.objs.push({ kind:'prop', type:'chai', x:(Math.random()<0.5?-1:1)*1.75, z:z, seed:Math.random()*10 });
  }
  for(z=45; z<S.trackLen; z+=rnd(35,60)){
    S.objs.push({ kind:'prop', type:'dog', x:(Math.random()<0.5?-1:1)*rnd(1.5,1.8), z:z, seed:Math.random()*10 });
  }
  /* bunting across the street */
  for(z=55; z<S.trackLen; z+=rnd(55,90)){
    S.objs.push({ kind:'bunting', x:0, z:z, seed:Math.random()*10 });
  }

  /* obstacles: sparse, one free lane always reachable */
  var types = ['cow','auto','thela','pothole','scooter','tempo'];
  var freeLane = 1;
  var gap = Math.max(11, 17 - lv*0.6);
  for(z=34; z<S.trackLen-12; z+=rnd(gap, gap+6)){
    var opts = [freeLane-1, freeLane, freeLane+1].filter(function(l){ return l>=0&&l<=2; });
    freeLane = opts[(Math.random()*opts.length)|0];
    var others = [0,1,2].filter(function(l){ return l!==freeLane; });
    var two = Math.random() < (0.12 + lv*0.045);
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

  /* bundles */
  for(z=50; z<S.trackLen-20; z+=rnd(45,70)){
    var ln = (Math.random()*3)|0;
    S.objs.push({ kind:'pickup', lane:ln, x:LANES[ln], z:z, taken:false, checked:false });
  }

  S.objs.sort(function(a,b){ return a.z-b.z; });
}

export { buildLevel };
