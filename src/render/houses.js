// The frontage: houses, shops, compound walls, and the pin over a house on the round.
import { ctx, DW } from '../core/canvas.js';
import { C } from '../core/palette.js';
import { yAt, ppuAt, sxAt } from '../core/projection.js';
import { fillRR, circle } from '../core/draw.js';
import { clamp, shade, pick2 } from '../core/math.js';
import { S } from '../game/state.js';

function drawHouse(o, rel){
  var p=ppuAt(rel), y=yAt(rel), cx=sxAt(o.x,rel,S.px);
  var w=o.w*p, h=o.h*p*(o.storey===2?1.38:1);
  if(cx+w< -60 || cx-w > DW+60) return;
  var x0=cx-w/2, y0=y-h;

  ctx.globalAlpha=.16;
  ctx.beginPath(); ctx.ellipse(cx,y,w*.6,Math.max(2,p*.05),0,0,6.2832); ctx.fillStyle='#000'; ctx.fill();
  ctx.globalAlpha=1;

  var wall = o.target ? o.wall : shade(o.wall,-0.06);
  fillRR(x0,y0,w,h,p*.02,wall);
  ctx.fillStyle='rgba(0,0,0,0.09)';
  ctx.fillRect(o.side>0?x0:x0+w*.74, y0, w*.26, h);

  /* roof slab with a small parapet */
  var rh=Math.max(3,h*.09);
  fillRR(x0-w*.05,y0-rh,w*1.10,rh*1.3,p*.012,o.roof);
  fillRR(x0-w*.02,y0-rh*1.9,w*.10,rh*1.0,p*.01,shade(o.roof,-.08));
  fillRR(x0+w*.92,y0-rh*1.9,w*.10,rh*1.0,p*.01,shade(o.roof,-.08));
  /* water tank on the roof */
  if(o.seed>5){
    fillRR(cx+w*.22, y0-rh*2.6, w*.20, rh*1.6, p*.012, '#2f6ea8');
  }

  if(o.shop){
    /* shuttered shop with a painted board */
    var by0=y-h*.52;
    fillRR(x0+w*.06, y0+h*.10, w*.88, h*.16, p*.01, pick2(o.seed,['#e8b93a','#3f8f6b','#c9553c']));
    ctx.fillStyle='rgba(255,255,255,0.75)';
    for(var q=0;q<4;q++) ctx.fillRect(x0+w*.14+q*w*.19, y0+h*.155, w*.11, Math.max(1.5,h*.022));
    fillRR(x0+w*.10, by0, w*.80, h*.50, p*.01, '#8b949a');
    ctx.fillStyle='rgba(0,0,0,0.12)';
    for(var r2=0;r2<7;r2++) ctx.fillRect(x0+w*.10, by0+r2*h*.07, w*.80, Math.max(1,h*.02));
  } else {
    var wy=y0+h*.22, ww=w*.16, wh=h*.16;
    var win = o.target ? '#a9dcef' : '#a9b7bd';
    fillRR(cx-w*.30,wy,ww,wh,p*.008,win);
    fillRR(cx+w*.14,wy,ww,wh,p*.008,win);
    if(o.storey===2){
      fillRR(cx-w*.30,wy+h*.30,ww,wh,p*.008,win);
      fillRR(cx+w*.14,wy+h*.30,ww,wh,p*.008,win);
      /* balcony rail */
      ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=Math.max(1,p*.012);
      ctx.beginPath(); ctx.moveTo(cx-w*.36,wy+h*.50); ctx.lineTo(cx+w*.36,wy+h*.50); ctx.stroke();
    }
    fillRR(cx-w*.11, y-h*.30, w*.22, h*.30, p*.012, '#7a5336');
  }

  /* compound wall + gate */
  var bw=w*1.04, bh=h*.24, bx=cx-bw/2, by=y-bh*.62;
  fillRR(bx,by,bw,bh,p*.008, shade(wall,-.16));
  ctx.fillStyle='rgba(0,0,0,0.07)'; ctx.fillRect(bx,by,bw,bh*.16);
  var gw=bw*.30, gx=cx-gw/2;
  if(o.target && !o.done){
    fillRR(gx-gw*.14,by,gw*.16,bh,p*.008,'#93a0a8');
    fillRR(gx+gw*.98,by,gw*.16,bh,p*.008,'#93a0a8');
  } else {
    fillRR(gx,by,gw,bh,p*.008,'#93a0a8');
    ctx.fillStyle='rgba(0,0,0,0.16)';
    for(var i=1;i<4;i++) ctx.fillRect(gx+gw*i/4, by, Math.max(.7,p*.006), bh);
  }

  /* delivered paper sitting at the gate */
  if(o.done){
    fillRR(cx-p*.07, y-p*.05, p*.14, p*.07, p*.015, C.paper);
  }

  if(o.target){
    var pulse = .5+.5*Math.sin(S.t*4 + o.seed);
    if(!o.done){
      ctx.strokeStyle='rgba(255,138,21,'+(0.30+0.40*pulse)+')';
      ctx.lineWidth=Math.max(2,p*.022);
      ctx.beginPath();
      ctx.ellipse(cx, y+p*.04, w*.36*(.88+.12*pulse), Math.max(3,p*.06*(.88+.12*pulse)),0,0,6.2832);
      ctx.stroke();
      /* soft glow on the facade */
      ctx.globalAlpha = 0.10+0.10*pulse;
      fillRR(x0,y0,w,h,p*.02,C.pin);
      ctx.globalAlpha = 1;
    }
    drawPin(cx, y0 - rh*2 - p*.26 - Math.sin(S.t*3.4+o.seed)*p*.035, p, o.done);
  }
}

function drawPin(x,y,p,done){
  var s = clamp(p*.34, 16, 54);
  var col = done?C.pinDone:C.pin;
  ctx.beginPath();
  ctx.arc(x, y-s*.62, s*.62, Math.PI*.86, Math.PI*.14);
  ctx.lineTo(x, y+s*.32); ctx.closePath();
  ctx.fillStyle=col; ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.20)'; ctx.lineWidth=Math.max(1,s*.05); ctx.stroke();
  if(done){
    ctx.strokeStyle='#fff'; ctx.lineWidth=Math.max(2,s*.14); ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(x-s*.26,y-s*.62); ctx.lineTo(x-s*.06,y-s*.42); ctx.lineTo(x+s*.28,y-s*.88);
    ctx.stroke(); ctx.lineCap='butt';
  } else {
    fillRR(x-s*.30,y-s*.84,s*.60,s*.42,s*.10,'#fff');
    ctx.fillStyle=col;
    ctx.fillRect(x-s*.20,y-s*.74,s*.40,Math.max(1.5,s*.07));
    ctx.fillRect(x-s*.20,y-s*.60,s*.26,Math.max(1.5,s*.07));
  }
}

export { drawHouse, drawPin };
