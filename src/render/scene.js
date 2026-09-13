// Composites one frame: background, depth-sorted world, effects, rider, then UI.
import { ctx } from '../core/canvas.js';
import { yAt, ppuAt, sxAt } from '../core/projection.js';
import { label } from '../core/draw.js';
import { rnd, clamp } from '../core/math.js';
import { S } from '../game/state.js';
import { drawSky, drawSkyline, drawGround } from './background.js';
import { drawHouse } from './houses.js';
import { drawProp, drawBunting } from './props.js';
import { drawObstacle } from './obstacles.js';
import { drawPickup, drawDust, drawShot } from './effects.js';
import { drawRider } from './rider.js';
import { drawHUD } from './hud.js';
import { drawTitle, drawClear, drawOver } from './screens.js';

function render(){
  ctx.save();
  if(S.shake>0) ctx.translate(rnd(-S.shake,S.shake)*.5, rnd(-S.shake,S.shake)*.35);

  drawSky(); drawSkyline(); drawGround();

  var vis=[],i;
  for(i=0;i<S.objs.length;i++){
    var o=S.objs[i], rel=o.z-S.trackPos;
    if(rel<1.3 || rel>72) continue;
    if((o.kind==='obs' || o.kind==='pickup') && rel<2.1) continue;
    if(o.kind==='pickup' && o.taken) continue;
    vis.push({o:o,rel:rel});
  }
  vis.sort(function(a,b){ return b.rel-a.rel; });
  for(i=0;i<vis.length;i++){
    var v=vis[i];
    if(v.o.kind==='house') drawHouse(v.o,v.rel);
    else if(v.o.kind==='prop') drawProp(v.o,v.rel);
    else if(v.o.kind==='obs') drawObstacle(v.o,v.rel);
    else if(v.o.kind==='pickup') drawPickup(v.o,v.rel);
    else if(v.o.kind==='bunting') drawBunting(v.o,v.rel);
  }

  for(i=0;i<S.dust.length;i++) drawDust(S.dust[i]);

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
