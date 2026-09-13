// Paper bundles on the road, dust puffs, and a paper in flight.
import { ctx, DW, DH } from '../core/canvas.js';
import { C } from '../core/palette.js';
import { yAt, ppuAt, sxAt } from '../core/projection.js';
import { fillRR, circle } from '../core/draw.js';
import { clamp } from '../core/math.js';
import { S } from '../game/state.js';

function drawPickup(o,rel){
  var p=ppuAt(rel), y=yAt(rel), cx=sxAt(o.x,rel,S.px);
  var bob=Math.sin(S.t*4+o.z)*p*.04;
  var w=p*.30,h=p*.22;
  ctx.globalAlpha=.2;
  ctx.beginPath(); ctx.ellipse(cx,y,w*.7,Math.max(1.5,p*.04),0,0,6.2832); ctx.fillStyle='#000'; ctx.fill();
  ctx.globalAlpha=1;
  var yy=y-h-p*.10+bob;
  fillRR(cx-w/2,yy,w,h,p*.02,C.paper);
  ctx.fillStyle='rgba(0,0,0,0.10)';
  ctx.fillRect(cx-w/2,yy+h*.36,w,h*.10); ctx.fillRect(cx-w/2,yy+h*.64,w,h*.10);
  ctx.fillStyle=C.paperInk; ctx.fillRect(cx-w*.30,yy+h*.14,w*.60,Math.max(1,h*.11));
  ctx.strokeStyle='#c6a86f'; ctx.lineWidth=Math.max(1,p*.012);
  ctx.beginPath(); ctx.moveTo(cx,yy); ctx.lineTo(cx,yy+h); ctx.stroke();
}
function drawDust(d){
  var rel = d.z - S.trackPos;
  if(rel<1.2 || rel>40) return;
  var p=ppuAt(rel);
  ctx.globalAlpha = clamp(d.t,0,1)*0.42;
  circle(sxAt(d.x,rel,S.px), yAt(rel) - (1-d.t)*p*0.16,
         Math.min(46, d.r*(0.6+(1-d.t)*0.8)*p), '#e5d6b4');
  ctx.globalAlpha=1;
}
function drawShot(s){
  /* start at the rider's hand, end where the paper actually lands */
  var relEnd = Math.max(1.4, s.landZ - S.trackPos);
  var pEnd = ppuAt(relEnd);
  var ex = sxAt(s.landX, relEnd, S.px);
  var ey = yAt(relEnd) - pEnd*0.06;
  var sx0 = DW/2 + s.side*104, sy0 = DH-190;
  var t = s.t;
  var x = sx0 + (ex-sx0)*t;
  var y = sy0 + (ey-sy0)*t - Math.sin(t*Math.PI)*82;
  var size = 44*(1-t) + Math.max(12, pEnd*0.17)*t;

  /* motion trail */
  ctx.globalAlpha=0.22;
  for(var k=1;k<=3;k++){
    var tt=Math.max(0,t-k*0.05);
    var tx2=sx0+(ex-sx0)*tt, ty2=sy0+(ey-sy0)*tt-Math.sin(tt*Math.PI)*82;
    circle(tx2,ty2,size*0.30,C.paper);
  }
  ctx.globalAlpha=1;

  ctx.save(); ctx.translate(x,y); ctx.rotate(s.spin*s.side);
  fillRR(-size*.5,-size*.30,size,size*.60,size*.14,C.paper);
  ctx.fillStyle=C.paperInk; ctx.fillRect(-size*.30,-size*.14,size*.60,Math.max(1.5,size*.10));
  ctx.fillStyle='rgba(0,0,0,0.14)'; ctx.fillRect(-size*.30,size*.06,size*.40,Math.max(1,size*.07));
  ctx.restore();
}

export { drawPickup, drawDust, drawShot };
