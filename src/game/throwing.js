// Throw timing: which house you are aiming at, and how well you timed it.
import { S } from './state.js';
import { clamp } from '../core/math.js';
import { HOUSE_X, FLIGHT, LEAD } from '../core/projection.js';
import { C } from '../core/palette.js';
import { blip } from '../core/audio.js';
import { countThrow } from './analytics.js';

/* the paper lands here, in world z, if thrown right now */
function landZ(){ return S.trackPos + S.speed*FLIGHT + LEAD; }
var PERFECT_TOL = 1.5, HIT_TOL = 3.4;

function findTarget(side){
  var best=null, bd=1e9;
  for(var i=0;i<S.objs.length;i++){
    var o = S.objs[i];
    if(o.kind!=='house' || !o.target || o.done || o.claimed) continue;
    if(o.side!==side) continue;
    var rel = o.z - S.trackPos;
    if(rel < -2 || rel > 30) continue;
    if(rel < bd){ bd=rel; best=o; }
  }
  return best;
}
/* 0 when the house is far, 1 when the paper would land past it */
function aimProgress(house){
  var span = 30;
  var err = house.z - landZ();          // +ve: house still ahead of the landing point
  return clamp(1 - (err/span + 0.5) + 0.5, 0, 1);
}

function toss(side){
  if(S.mode!=='play' || S.stun>0 || S.arm>0 || S.paused) return;
  if(S.papers<=0){ callout('NO PAPERS LEFT', C.bad); return; }
  var tgt = findTarget(side);
  S.papers--;
  S.arm = 0.34; S.armSide = side;

  var lz = landZ();
  var err = tgt ? (tgt.z - lz) : 0;
  var grade = 'miss';
  if(tgt){
    if(Math.abs(err) <= PERFECT_TOL) grade = 'perfect';
    else if(Math.abs(err) <= HIT_TOL) grade = 'hit';
    else grade = (err > 0) ? 'early' : 'late';
  }
  countThrow(grade);
  if(grade === 'miss') { S.combo = 0; S.score = Math.max(0, S.score-15); }
  if(grade === 'early' || grade === 'late'){ S.combo = 0; }
  if(tgt && (grade==='perfect'||grade==='hit')) tgt.claimed = true;

  S.shots.push({
    side:side, t:0, house:tgt, grade:grade,
    landZ: lz, landX: side*(HOUSE_X - (grade==='perfect'||grade==='hit' ? 0.72 : 1.25)),
    spin:0
  });
  blip(grade==='perfect'?900:grade==='hit'?760:300, .07);
}
function callout(txt,col){ S.callout=txt; S.calloutCol=col; S.calloutT=1.1; }

export { landZ, PERFECT_TOL, HIT_TOL, findTarget, aimProgress, toss, callout };
