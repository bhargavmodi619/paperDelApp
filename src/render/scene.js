// Composites one frame: background, depth-sorted world, effects, rider, UI.
import { ctx, DW, DH } from '../core/canvas.js';
import { yAt, ppuAt, sxAt } from '../core/projection.js';
import { label } from '../core/draw.js';
import { rnd, clamp } from '../core/math.js';
import { S } from '../game/state.js';
import { drawSky, drawSkyline, drawGround, drawHaze, Z_FAR } from './background.js';
import { drawHouse } from './houses.js';
import { drawLandmark } from './landmarks.js';
import { drawProp, drawBunting } from './props.js';
import { drawObstacle } from './obstacles.js';
import { drawCrossing } from './crossings.js';
import { drawPickup, drawDust, drawShot } from './effects.js';
import { drawRider } from './rider.js';
import { drawHUD } from './hud.js';
import { drawTitle, drawClear, drawOver } from './screens.js';

/* The visible list is rebuilt every frame; pooling the entries keeps that
   from allocating a few hundred short-lived objects a second. */
var pool = [], order = [], poolN = 0;
function visPush(o, rel){
  var e = pool[poolN];
  if(!e){ e = { o:null, rel:0 }; pool[poolN] = e; }
  poolN++;
  e.o = o; e.rel = rel;
  order.push(e);
}
function byDepth(a,b){ return b.rel-a.rel; }

/* Scenery is drawn from the far cutoff inwards; the haze goes down once the
   pass crosses this depth, so anything beyond it appears through mist instead
   of popping into existence. */
var HAZE_Z = 46;

function render(){
  ctx.save();

  /* camera: shake, bob, a little lateral lag behind the rider, and roll */
  var tx = 0, ty = S.camBob;
  if(S.shake>0){ tx += rnd(-S.shake,S.shake)*.5; ty += rnd(-S.shake,S.shake)*.35; }
  tx += (S.px - S.camX) * 26;
  ctx.translate(tx, ty);
  if(S.camRoll){
    ctx.translate(DW/2, DH);
    ctx.rotate(-S.camRoll*0.08);
    ctx.translate(-DW/2, -DH);
  }

  drawSky(); drawSkyline(); drawGround();

  poolN = 0; order.length = 0;
  var i, o, rel;
  for(i=0;i<S.objs.length;i++){
    o=S.objs[i]; rel=o.z-S.trackPos;
    if(rel<1.3 || rel>Z_FAR) continue;
    if((o.kind==='obs' || o.kind==='pickup') && rel<2.1) continue;
    if(o.kind==='pickup' && o.taken) continue;
    if(o.kind==='cross' && o.phase==='gone') continue;
    visPush(o, rel);
  }
  order.sort(byDepth);

  var hazed = false;
  for(i=0;i<order.length;i++){
    var v = order[i];
    if(!hazed && v.rel < HAZE_Z){ drawHaze(); hazed = true; }
    var k = v.o.kind;
    if(k==='house')         drawHouse(v.o, v.rel);
    else if(k==='landmark') drawLandmark(v.o, v.rel);
    else if(k==='prop')     drawProp(v.o, v.rel);
    else if(k==='obs')      drawObstacle(v.o, v.rel);
    else if(k==='cross')    drawCrossing(v.o, v.rel);
    else if(k==='pickup')   drawPickup(v.o, v.rel);
    else if(k==='bunting')  drawBunting(v.o, v.rel);
  }
  if(!hazed) drawHaze();

  for(i=0;i<S.dust.length;i++){ if(S.dust[i].active) drawDust(S.dust[i]); }

  for(i=0;i<S.pops.length;i++){
    var pp=S.pops[i], rel2=pp.z-S.trackPos;
    if(rel2<1.6 || rel2>40) continue;
    var p=ppuAt(rel2);
    ctx.globalAlpha=clamp(pp.t,0,1);
    label(pp.txt, sxAt(pp.x,rel2,S.px), yAt(rel2)-p*1.1-(1-pp.t)*44, 18, pp.col,'center','800');
    ctx.globalAlpha=1;
  }

  for(i=0;i<S.shots.length;i++) drawShot(S.shots[i]);

  drawRider();
  ctx.restore();

  if(S.mode==='title') drawTitle();
  else {
    drawHUD();
    if(S.mode==='clear') drawClear();
    if(S.mode==='over') drawOver();
  }
}

export { render };
