// Score, lives, paper count, progress, and the two throw-timing gauges.
import { ctx, DW, DH } from '../core/canvas.js';
import { C } from '../core/palette.js';
import { rr, fillRR, circle, label } from '../core/draw.js';
import { clamp } from '../core/math.js';
import { S } from '../game/state.js';
import { findTarget, landZ, HIT_TOL, PERFECT_TOL } from '../game/throwing.js';

function drawHUD(){
  var g=ctx.createLinearGradient(0,0,0,96);
  g.addColorStop(0,'rgba(10,16,26,0.55)'); g.addColorStop(1,'rgba(10,16,26,0)');
  ctx.fillStyle=g; ctx.fillRect(0,0,DW,96);

  label('LEVEL '+S.level,16,30,15,C.hudDim,'left','700');
  label(String(S.score),16,58,26,C.hud,'left','800');
  label('DELIVERED',DW-16,30,13,C.hudDim,'right','700');
  label(S.delivered+' / '+S.need,DW-16,58,26,S.delivered>=S.need?C.good:C.hud,'right','800');

  for(var i=0;i<S.lives;i++){
    var hx=DW-24-i*24, hy=80;
    ctx.beginPath(); ctx.arc(hx,hy,10,Math.PI,0);
    ctx.lineTo(hx+10,hy+3); ctx.lineTo(hx-10,hy+3); ctx.closePath();
    ctx.fillStyle='#eef3f6'; ctx.fill();
    ctx.strokeStyle='rgba(10,16,26,0.45)'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle='#43535e'; rr(hx-9,hy-6,18,6,3); ctx.fill();
  }

  fillRR(16,80,96,30,15,'rgba(10,16,26,0.5)');
  fillRR(26,89,20,13,3,C.paper);
  ctx.fillStyle=C.paperInk; ctx.fillRect(30,93,12,2);
  label(String(S.papers),54,101,18,S.papers>0?C.hud:C.bad,'left','800');

  var prog=clamp(S.trackPos/S.trackLen,0,1);
  fillRR(16,DH-26,DW-32,8,4,'rgba(10,16,26,0.5)');
  fillRR(16,DH-26,(DW-32)*prog,8,4,C.gold);

  if(S.combo>1) label('COMBO x'+S.combo,DW/2,124,20,C.gold,'center','800');

  drawAimGauges();

  if(S.calloutT>0){
    ctx.globalAlpha=clamp(S.calloutT*1.6,0,1);
    label(S.callout,DW/2,176,26,S.calloutCol,'center','800');
    ctx.globalAlpha=1;
  }

  if(S.tutorial>0){
    ctx.globalAlpha=Math.min(1,S.tutorial/1.2);
    fillRR(24,DH-206,DW-48,96,18,C.panel);
    label('Swipe or ← → to change lane',DW/2,DH-176,15,C.hud,'center','600');
    label('Tap a side when its bar turns green',DW/2,DH-152,15,C.hud,'center','600');
    label('Only pinned houses want a paper',DW/2,DH-128,15,C.pin,'center','700');
    ctx.globalAlpha=1;
  }
}

/* the timing bar: fills as you close on the house, green = throw now */
function drawAimGauges(){
  [-1,1].forEach(function(side){
    var h = findTarget(side);
    if(!h) return;
    var rel = h.z - S.trackPos;
    if(rel > 30) return;

    var x = side<0 ? 42 : DW-42;
    var top = 236, len = 188, wBar = 20;

    /* travel of the gauge head: 30 units away at the top, landing point at the bottom */
    var err = h.z - landZ();                 // >0 too early, <0 too late
    var SPAN = 26;
    var headT = clamp((SPAN/2 - err)/SPAN, 0, 1);

    fillRR(x-wBar/2-2, top-2, wBar+4, len+4, (wBar+4)/2, 'rgba(255,255,255,0.30)');
    fillRR(x-wBar/2, top, wBar, len, wBar/2, 'rgba(10,16,26,0.72)');

    /* green band = where a throw connects */
    var tLo = clamp((SPAN/2-HIT_TOL)/SPAN,0,1), tHi = clamp((SPAN/2+HIT_TOL)/SPAN,0,1);
    var pLo = clamp((SPAN/2-PERFECT_TOL)/SPAN,0,1), pHi = clamp((SPAN/2+PERFECT_TOL)/SPAN,0,1);
    fillRR(x-wBar/2, top+len*tLo, wBar, len*(tHi-tLo), wBar/2, 'rgba(34,189,88,0.45)');
    fillRR(x-wBar/2, top+len*pLo, wBar, len*(pHi-pLo), wBar/2, 'rgba(34,189,88,0.95)');

    /* head */
    var hy = top + len*headT;
    var inZone = Math.abs(err) <= HIT_TOL;
    circle(x, hy, 11, inZone ? '#fff' : 'rgba(255,255,255,0.8)');
    circle(x, hy, 6, inZone ? C.good : C.pin);

    /* side chevron + prompt */
    var py = 208, pulse = .5+.5*Math.sin(S.t*7);
    ctx.globalAlpha = inZone ? (0.85+0.15*pulse) : 0.5;
    circle(x, py, 24, inZone ? C.good : 'rgba(255,138,21,0.85)');
    ctx.globalAlpha = 1;
    ctx.strokeStyle='#fff'; ctx.lineWidth=4; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath();
    ctx.moveTo(x-side*6,py-9); ctx.lineTo(x+side*6,py); ctx.lineTo(x-side*6,py+9);
    ctx.stroke(); ctx.lineCap='butt';
    if(inZone) label('THROW', x, top+len+22, 13, C.good, 'center','800');
  });
}

export { drawHUD, drawAimGauges };
