// Pooled dust. The old code pushed and spliced a fresh object every puff,
// which is a steady drip of garbage on the hot path; this reuses a fixed
// pool so a long run allocates nothing (claude.md section 7).
import { S } from './state.js';

var MAX = 140;
var cursor = 0;

function initDust(){
  if(S.dust.length === MAX) { resetDust(); return; }
  S.dust.length = 0;
  for(var i=0;i<MAX;i++) S.dust.push({ x:0, z:0, t:0, r:0, active:false });
  cursor = 0;
}

function resetDust(){
  for(var i=0;i<S.dust.length;i++) S.dust[i].active = false;
  cursor = 0;
}

/* Oldest puff is recycled once the pool is full — dust is the least
   important thing on screen, so dropping one is invisible. */
function spawnDust(x,z,r){
  var d = S.dust[cursor];
  cursor = (cursor+1) % S.dust.length;
  d.x = x; d.z = z; d.r = r; d.t = 1; d.active = true;
}

function updateDust(dt){
  var arr = S.dust;
  for(var i=0;i<arr.length;i++){
    var d = arr[i];
    if(!d.active) continue;
    d.t -= dt*1.6;
    if(d.t <= 0) d.active = false;
  }
}

export { initDust, resetDust, spawnDust, updateDust };
