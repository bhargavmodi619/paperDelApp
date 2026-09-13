// One simulation step: camera, movement, crossings, papers in flight,
// collisions, end of street.
import { S } from './state.js';
import { rnd, clamp } from '../core/math.js';
import { LANES, FLIGHT, FOCAL_BASE, setFocal, setCamZ } from '../core/projection.js';
import { C } from '../core/palette.js';
import { blip, setEngine, stopEngine } from '../core/audio.js';
import { callout } from './throwing.js';
import { crash } from './actions.js';
import { bendHeading } from './level.js';
import { spawnDust, updateDust } from './particles.js';
import { levelEnded, gameOver } from './analytics.js';

/* Approach a target with a time-constant instead of a per-frame fraction, so
   the feel does not change with framerate. rate is "how much of the gap is
   closed per second". */
function ease(cur, target, rate, dt){
  return cur + (target-cur)*(1 - Math.exp(-rate*dt));
}

function update(dt){
  S.t += dt;
  if(S.shake>0) S.shake = Math.max(0, S.shake-dt*30);
  if(S.tutorial>0) S.tutorial -= dt;
  if(S.arm>0) S.arm -= dt;
  if(S.calloutT>0) S.calloutT -= dt;
  if(S.turnT>0) S.turnT -= dt;

  setCamZ(S.trackPos);

  /* hidden tab or locked phone: the world holds still, nothing advances */
  if(S.paused) return;

  if(S.mode==='title'){
    S.trackPos += S.speed*0.5*dt;
    camera(dt, 0);
    updateDust(dt);
    return;
  }
  if(S.mode!=='play'){ camera(dt, 0); stopEngine(); return; }
  if(S.stun>0) S.stun -= dt;

  S.trackPos += S.speed*dt;

  /* Lane change stays as quick as it ever was — slowing it down makes dense
     streets undodgeable, which the bot caught. The smoothness comes from the
     lean, the camera lag and the roll, not from sluggish steering. */
  var tx = LANES[S.lane], d = tx - S.px;
  S.px = ease(S.px, tx, 13.0, dt);
  var road = bendHeading(S.trackPos);
  var wantLean = d*1.9 + road*3.4;
  S.lean = ease(S.lean, wantLean, 6.5, dt);

  camera(dt, road);

  /* engine note tracks speed, and dips while you are stunned */
  var load = clamp((S.speed-8.0)/5.0, 0, 1) * (S.stun>0 ? 0.55 : 1);
  setEngine(0.30 + load*0.70);

  var i,o,rel;

  for(i=0;i<S.objs.length;i++){ o=S.objs[i]; if(o.kind==='obs'&&o.vz) o.z += o.vz*dt; }

  crossings(dt);

  /* papers in flight */
  for(i=S.shots.length-1;i>=0;i--){
    var s = S.shots[i];
    s.t += dt/FLIGHT;
    s.spin += dt*10;
    if(s.t>=1){
      var puffZ = s.landZ, puffX = s.landX;
      for(var k=0;k<7;k++) spawnDust(puffX+rnd(-.15,.15), puffZ+rnd(-.15,.15), rnd(0.06,0.13));
      if(s.grade==='perfect'||s.grade==='hit'){
        if(s.house && !s.house.done){
          s.house.done = true; S.delivered++; S.combo++;
          var pts = (s.grade==='perfect'?150:100) + (S.combo-1)*25;
          S.score += pts;
          S.pops.push({ x:s.house.x, z:s.house.z, t:1, txt:'+'+pts, col:C.good });
          callout(s.grade==='perfect' ? 'PERFECT!' : 'DELIVERED', C.good);
          blip(980,.09);
        }
      } else if(s.grade==='early'){
        callout('TOO EARLY', C.bad);
        if(s.house) s.house.claimed = false;
      } else if(s.grade==='late'){
        callout('TOO LATE', C.bad);
        if(s.house) s.house.claimed = false;
      } else {
        callout('NO HOUSE THERE', C.bad);
      }
      S.shots.splice(i,1);
    }
  }

  for(i=S.pops.length-1;i>=0;i--){ S.pops[i].t -= dt*1.2; if(S.pops[i].t<=0) S.pops.splice(i,1); }
  updateDust(dt);

  /* junction warning, a beat before the bend */
  for(i=0;i<S.junctions.length;i++){
    var j = S.junctions[i];
    if(!j.warned && j.z - S.trackPos < 34){
      j.warned = true; S.turnSign = j.H<0 ? -1 : 1; S.turnT = 2.0;
      blip(520,.10,'sine');
    }
  }

  /* collisions */
  for(i=0;i<S.objs.length;i++){
    o = S.objs[i]; rel = o.z - S.trackPos;
    if(o.kind==='obs' && !o.checked && rel<0.9){
      o.checked = true;
      if(S.stun<=0 && Math.abs(o.x-S.px) < 0.42) crash(o.type);
    } else if(o.kind==='pickup' && !o.checked && rel<0.9){
      o.checked = true;
      if(Math.abs(o.x-S.px) < 0.45){
        o.taken = true; S.papers += (o.amount||3); S.score += 40;
        S.pops.push({ x:o.x, z:o.z, t:1, txt:'+'+(o.amount||3), col:C.hud });
        blip(600,.08,'sine');
      }
    } else if(o.kind==='house' && o.target && !o.done && !o.tried && rel < -3){
      o.tried = true; S.combo = 0;
    }
  }

  if(S.trackPos >= S.trackLen){
    if(S.delivered >= S.need){
      S.perfect = (S.delivered === S.targets);
      S.score += 250 + S.delivered*30 + S.papers*5;
      if(S.perfect && S.lives<5) S.lives++;
      S.failed = false; S.mode='clear'; blip(700,.12);
      levelEnded(true);
    } else {
      S.lives--; S.failed = true;
      levelEnded(false);
      if(S.lives<=0){ S.mode='over'; if(S.score>S.best) S.best=S.score; gameOver(); }
      else S.mode='clear';
      blip(170,.3,'sawtooth');
    }
  }
}

/* ---- camera ---------------------------------------------------------------
   Three small things that together stop the view feeling nailed down: a bob
   at engine frequency, a lateral lag so the world slides a beat behind a lane
   change, and a roll into the bend. The projection still uses the rider's
   true position — the lag is applied in screen space only, so throwing stays
   honest. */
function camera(dt, road){
  var moving = (S.mode==='play' || S.mode==='title');
  var bobAmp = moving ? 1.5 + S.speed*0.10 : 0;
  S.camBob = Math.sin(S.t*S.speed*1.15)*bobAmp + Math.sin(S.t*S.speed*2.3)*bobAmp*0.30;
  S.camX  = ease(S.camX, S.px, 7.0, dt);
  S.camRoll = ease(S.camRoll, (road||0)*0.55 + (S.px - S.camX)*0.10, 8.0, dt);
  var f = FOCAL_BASE * (1 + clamp((S.speed-8.5)*0.016, 0, 0.11));
  S.focal = f;
  setFocal(f);
}

/* ---- crossing hazards -----------------------------------------------------
   The one rule that matters (claude.md section 4.2): it must telegraph. The
   dog sits on the verge, then puts its ears up and freezes for a beat, and
   only then bolts. Anything that crosses without warning is unfair. */
function crossings(dt){
  for(var i=0;i<S.objs.length;i++){
    var o = S.objs[i];
    if(o.kind!=='cross') continue;
    var rel = o.z - S.trackPos;

    if(o.phase==='wait'){
      if(rel < 26 && rel > 0){ o.phase='alert'; o.t=0; }
    } else if(o.phase==='alert'){
      o.t += dt;
      if(o.t > 0.75){ o.phase='run'; o.t=0; blip(1150,.06,'square'); }
    } else if(o.phase==='run'){
      o.t += dt;
      var dir = o.x1 - o.x0;
      o.x += (dir>0?1:-1) * o.speed * dt;
      if((dir>0 && o.x>=o.x1) || (dir<0 && o.x<=o.x1)){ o.x = o.x1; o.phase='gone'; }
    }

    if(!o.checked && rel < 0.9){
      o.checked = true;
      if(S.stun<=0 && o.phase!=='gone' && Math.abs(o.x-S.px) < 0.44) crash('dog');
    }
  }
}

export { update };
