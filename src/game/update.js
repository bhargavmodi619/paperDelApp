// One simulation step: movement, papers in flight, collisions, end of street.
import { S } from './state.js';
import { rnd } from '../core/math.js';
import { LANES, FLIGHT } from '../core/projection.js';
import { C } from '../core/palette.js';
import { blip } from '../core/audio.js';
import { callout } from './throwing.js';
import { crash } from './actions.js';

function update(dt){
  S.t += dt;
  if(S.shake>0) S.shake = Math.max(0, S.shake-dt*30);
  if(S.tutorial>0) S.tutorial -= dt;
  if(S.arm>0) S.arm -= dt;
  if(S.calloutT>0) S.calloutT -= dt;

  if(S.mode==='title'){ S.trackPos += S.speed*0.5*dt; return; }
  if(S.mode!=='play') return;
  if(S.stun>0) S.stun -= dt;

  S.trackPos += S.speed*dt;

  var tx = LANES[S.lane], d = tx - S.px;
  S.px += d*Math.min(1, dt*12);
  S.lean += (d*2.0 - S.lean)*Math.min(1, dt*8);

  var i,o,rel;

  for(i=0;i<S.objs.length;i++){ o=S.objs[i]; if(o.kind==='obs'&&o.vz) o.z += o.vz*dt; }

  /* papers in flight */
  for(i=S.shots.length-1;i>=0;i--){
    var s = S.shots[i];
    s.t += dt/FLIGHT;
    s.spin += dt*10;
    if(s.t>=1){
      var puffZ = s.landZ, puffX = s.landX;
      for(var k=0;k<7;k++) S.dust.push({ x:puffX+rnd(-.15,.15), z:puffZ+rnd(-.15,.15), t:1, r:rnd(0.06,0.13) });
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
  for(i=S.dust.length-1;i>=0;i--){ S.dust[i].t -= dt*1.6; if(S.dust[i].t<=0) S.dust.splice(i,1); }

  /* collisions */
  for(i=0;i<S.objs.length;i++){
    o = S.objs[i]; rel = o.z - S.trackPos;
    if(o.kind==='obs' && !o.checked && rel<0.9){
      o.checked = true;
      if(S.stun<=0 && Math.abs(o.x-S.px) < 0.42) crash();
    } else if(o.kind==='pickup' && !o.checked && rel<0.9){
      o.checked = true;
      if(Math.abs(o.x-S.px) < 0.45){
        o.taken = true; S.papers += 6; S.score += 40;
        S.pops.push({ x:o.x, z:o.z, t:1, txt:'+6', col:C.hud });
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
    } else {
      S.lives--; S.failed = true;
      if(S.lives<=0){ S.mode='over'; if(S.score>S.best) S.best=S.score; }
      else S.mode='clear';
      blip(170,.3,'sawtooth');
    }
  }
}

export { update };
