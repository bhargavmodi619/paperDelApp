// Hazards that move into your lane.
//
// The telegraph is the whole design (claude.md section 4.2): the dog waits on
// the verge, then freezes with its ears up and a marker over it for a beat,
// and only then bolts. If you can be hit without warning, the hazard is a bug.
import { ctx } from '../core/canvas.js';
import { C } from '../core/palette.js';
import { yAt, ppuAt, sxAt } from '../core/projection.js';
import { fillRR, circle, poly } from '../core/draw.js';
import { S } from '../game/state.js';

function drawCrossing(o, rel){
  if(o.phase==='gone') return;
  var p=ppuAt(rel), y=yAt(rel), cx=sxAt(o.x,rel,S.px);

  /* shadow */
  ctx.globalAlpha=.22;
  ctx.beginPath(); ctx.ellipse(cx,y,p*.22,Math.max(1.5,p*.05),0,0,6.2832); ctx.fillStyle='#000'; ctx.fill();
  ctx.globalAlpha=1;

  var alert = (o.phase==='alert');
  var running = (o.phase==='run');
  dog(o, cx, y, p, alert, running);

  /* the tell: a pulsing warning over the dog while it is about to bolt */
  if(alert){
    var pulse = .5+.5*Math.sin(S.t*14);
    var wy = y - p*.62;
    ctx.globalAlpha = 0.55+0.45*pulse;
    poly([[cx, wy-p*.22],[cx+p*.17, wy+p*.06],[cx-p*.17, wy+p*.06]], C.bad);
    ctx.globalAlpha = 1;
    ctx.fillStyle='#fff';
    ctx.fillRect(cx-Math.max(1,p*.014), wy-p*.13, Math.max(2,p*.028), p*.11);
    ctx.fillRect(cx-Math.max(1,p*.014), wy+p*.005, Math.max(2,p*.028), Math.max(1.5,p*.024));
    /* a low arc showing which way it is about to go */
    ctx.strokeStyle='rgba(232,80,58,'+(0.35+0.35*pulse)+')';
    ctx.lineWidth=Math.max(1.5,p*.018);
    ctx.beginPath();
    ctx.moveTo(cx, y+p*.02);
    ctx.lineTo(cx - o.from*p*.55, y+p*.02);
    ctx.stroke();
  }
}

function dog(o, cx, y, p, alert, running){
  var trot = running ? Math.sin(S.t*22+o.seed) : Math.sin(S.t*5+o.seed)*0.4;
  var dw=0.46*p, dh=0.28*p, dy=y-dh;
  var facing = running ? (o.x1>o.x0 ? 1 : -1) : -Math.sign(o.x || 1);

  /* body */
  fillRR(cx-dw/2, dy, dw, dh*.72, p*.03, '#c99a63');
  /* haunches */
  fillRR(cx-facing*dw*.34, dy+dh*.04, dw*.30, dh*.60, p*.025, '#bf8e58');
  /* head */
  fillRR(cx+facing*dw*.26, dy-dh*.44, dw*.30, dh*.48, p*.02, '#c99a63');
  /* snout */
  fillRR(cx+facing*dw*.46, dy-dh*.22, dw*.16, dh*.16, p*.015, '#b1834f');

  /* ears — flat when dozing, up when it has seen you */
  ctx.fillStyle='#a87a48';
  var ex = cx+facing*dw*.30, ey = dy-dh*.44;
  if(alert || running){
    poly([[ex, ey],[ex-facing*p*.02, ey-p*.11],[ex+facing*p*.06, ey-p*.02]], '#a87a48');
    poly([[ex+facing*p*.10, ey],[ex+facing*p*.10, ey-p*.10],[ex+facing*p*.16, ey-p*.01]], '#a87a48');
  } else {
    fillRR(ex-p*.01, ey+p*.01, p*.08, p*.035, p*.01, '#a87a48');
  }

  /* legs */
  ctx.fillStyle='#b1834f';
  var lift = running ? p*.05 : p*.012;
  ctx.fillRect(cx-dw*.36, dy+dh*.60, dw*.11, dh*.46+trot*lift);
  ctx.fillRect(cx-dw*.18, dy+dh*.60, dw*.11, dh*.46-trot*lift);
  ctx.fillRect(cx+dw*.10, dy+dh*.60, dw*.11, dh*.46-trot*lift);
  ctx.fillRect(cx+dw*.26, dy+dh*.60, dw*.11, dh*.46+trot*lift);

  /* tail */
  ctx.strokeStyle='#c99a63'; ctx.lineWidth=Math.max(1.5,p*.022); ctx.lineCap='round';
  var tw = running ? Math.sin(S.t*26+o.seed)*p*.05 : Math.sin(S.t*3+o.seed)*p*.03;
  ctx.beginPath();
  ctx.moveTo(cx-facing*dw*.48, dy+dh*.16);
  ctx.quadraticCurveTo(cx-facing*dw*.70, dy-dh*.20+tw, cx-facing*dw*.62, dy-dh*.52);
  ctx.stroke(); ctx.lineCap='butt';

  /* eye */
  circle(cx+facing*dw*.40, dy-dh*.30, Math.max(1,p*.018), C.ink);

  /* speed streaks while it is crossing */
  if(running){
    ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=Math.max(1,p*.012);
    for(var i=0;i<3;i++){
      var sy2 = dy+dh*(0.1+i*0.28);
      ctx.beginPath();
      ctx.moveTo(cx-facing*(dw*.55+p*.06), sy2);
      ctx.lineTo(cx-facing*(dw*.55+p*.24+i*p*.04), sy2);
      ctx.stroke();
    }
  }
}

export { drawCrossing };
