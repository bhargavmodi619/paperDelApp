// Verge dressing: poles, trees, hoardings, hand pumps, chai stalls, dogs, bunting.
import { ctx, DW } from '../core/canvas.js';
import { C } from '../core/palette.js';
import { yAt, ppuAt, sxAt } from '../core/projection.js';
import { fillRR, poly, circle } from '../core/draw.js';
import { pick2 } from '../core/math.js';
import { S } from '../game/state.js';

function drawProp(o,rel){
  var p=ppuAt(rel), y=yAt(rel), cx=sxAt(o.x,rel,S.px);
  if(cx < -80 || cx > DW+80) return;

  if(o.type==='pole'){
    var h=2.4*p;
    ctx.fillStyle='#8d8577';
    ctx.fillRect(cx-Math.max(1,p*.016), y-h, Math.max(2,p*.032), h);
    ctx.fillRect(cx-p*.11, y-h, p*.22, Math.max(1.5,p*.018));
    /* drooping wire */
    ctx.strokeStyle='rgba(40,40,40,0.5)'; ctx.lineWidth=Math.max(1,p*.008);
    ctx.beginPath(); ctx.moveTo(cx, y-h+p*.02);
    ctx.quadraticCurveTo(cx - o.x*p*0.9, y-h+p*.30, cx - o.x*p*1.9, y-h+p*.04);
    ctx.stroke();
    return;
  }
  if(o.type==='tree'){
    var th=1.2*p;
    ctx.fillStyle='#7d5b3a';
    ctx.fillRect(cx-Math.max(1,p*.022), y-th, Math.max(2,p*.044), th);
    var sway=Math.sin(S.t*1.4+o.seed)*p*.02;
    circle(cx+sway, y-th-p*.36, p*.46,'#5f8f43');
    circle(cx-p*.30+sway, y-th-p*.18, p*.32,'#6ea04d');
    circle(cx+p*.28+sway, y-th-p*.20, p*.30,'#4f7d38');
    circle(cx+sway, y-th-p*.62, p*.30,'#6ea04d');
    return;
  }
  if(o.type==='hoarding'){
    var hw=1.5*p, hh=0.8*p, hy=y-1.9*p;
    ctx.fillStyle='#7b7268';
    ctx.fillRect(cx-p*.03, hy+hh, p*.06, 1.1*p);
    fillRR(cx-hw/2, hy, hw, hh, p*.02, '#f0e6d2');
    var band = pick2(o.seed,['#d24d3e','#2f7fbf','#2f8f5f']);
    fillRR(cx-hw/2, hy, hw, hh*.34, p*.02, band);
    ctx.fillStyle='rgba(0,0,0,0.30)';
    ctx.fillRect(cx-hw*.38, hy+hh*.52, hw*.72, Math.max(2,hh*.10));
    ctx.fillRect(cx-hw*.38, hy+hh*.72, hw*.48, Math.max(2,hh*.09));
    return;
  }
  if(o.type==='handpump'){
    ctx.fillStyle='#5f6a72';
    ctx.fillRect(cx-p*.02, y-p*.5, p*.04, p*.5);
    ctx.fillRect(cx-p*.02, y-p*.52, p*.16, p*.05);
    fillRR(cx-p*.14, y-p*.08, p*.28, p*.08, p*.01, '#8d8577');
    return;
  }
  if(o.type==='chai'){
    var sw=1.0*p, sh=0.66*p, sy=y-sh;
    /* counter */
    fillRR(cx-sw/2, sy+sh*.42, sw, sh*.58, p*.015, '#a9713e');
    /* awning */
    poly([[cx-sw*.62,sy+sh*.42],[cx+sw*.62,sy+sh*.42],[cx+sw*.5,sy],[cx-sw*.5,sy]], '#2f7fbf');
    ctx.fillStyle='rgba(255,255,255,0.55)';
    for(var i=0;i<4;i++) ctx.fillRect(cx-sw*.5+i*sw*.26, sy, sw*.13, sh*.42);
    /* kettle + steam */
    circle(cx-sw*.18, sy+sh*.36, p*.07, '#6f7a80');
    ctx.strokeStyle='rgba(255,255,255,0.55)'; ctx.lineWidth=Math.max(1,p*.012);
    var st=(S.t*1.6+o.seed)%1;
    ctx.beginPath();
    ctx.moveTo(cx-sw*.18, sy+sh*.28);
    ctx.quadraticCurveTo(cx-sw*.10, sy+sh*.10-st*p*.2, cx-sw*.18, sy-st*p*.3);
    ctx.stroke();
    /* stools */
    circle(cx+sw*.30, y-p*.06, p*.06, '#6b5540');
    return;
  }
  if(o.type==='hawker'){
    drawHawker(o,cx,y,p);
    return;
  }
  if(o.type==='dog'){
    var trot = Math.sin(S.t*6+o.seed);
    var dw=0.42*p, dh=0.26*p, dy=y-dh;
    fillRR(cx-dw/2, dy, dw, dh*.72, p*.03, '#c99a63');
    fillRR(cx+dw*.26, dy-dh*.42, dw*.30, dh*.46, p*.02, '#c99a63');
    ctx.fillStyle='#b1834f';
    ctx.fillRect(cx-dw*.36, dy+dh*.6, dw*.12, dh*.42+trot*p*.01);
    ctx.fillRect(cx+dw*.20, dy+dh*.6, dw*.12, dh*.42-trot*p*.01);
    ctx.strokeStyle='#c99a63'; ctx.lineWidth=Math.max(1.5,p*.02); ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx-dw*.48, dy+dh*.15);
    ctx.quadraticCurveTo(cx-dw*.70, dy-dh*.2-trot*p*.03, cx-dw*.62, dy-dh*.5);
    ctx.stroke(); ctx.lineCap='butt';
    return;
  }
}

/* ---- hawkers ---------------------------------------------------------------
   The street is already awake: a sabziwala behind his cart, a fruit seller
   with a head-load basket, the milkman with his cans, and someone selling
   brooms. They sway and call out; none of them are in the road. */
function drawHawker(o,cx,y,p){
  var sway = Math.sin(S.t*1.8+o.seed)*p*.012;
  var face = o.x>0 ? -1 : 1;                 // they face the road
  var kurta = pick2(o.seed, ['#dcd3c0','#cfe0ea','#e6d2c2','#d4e0cf','#efe3c8']);
  var hh = 0.92*p;                           // person height in pixels

  if(o.hawker==='sabzi'){
    /* handcart of vegetables */
    var cw=p*.66, ch=p*.24, cy=y-ch-p*.08;
    circle(cx-cw*.30, y-p*.07, p*.075, '#3a3a3a');
    circle(cx+cw*.30, y-p*.07, p*.075, '#3a3a3a');
    fillRR(cx-cw/2, cy, cw, ch, p*.02, '#a9713e');
    var veg=['#4f8f3a','#e2483d','#6cbf46','#f0a92a','#8e5fb0','#4f8f3a'];
    for(var i=0;i<6;i++) circle(cx-cw*.36+i*cw*.145, cy-p*.03, p*.045, veg[i]);
    person(cx-cw*.62, y, hh, kurta, face, sway, o.seed);
    return;
  }
  if(o.hawker==='fruit'){
    /* basket carried on the head */
    person(cx, y, hh, kurta, face, sway, o.seed);
    var by=y-hh-p*.05;
    fillRR(cx-p*.17+sway, by-p*.09, p*.34, p*.10, p*.02, '#c8a262');
    circle(cx-p*.08+sway, by-p*.11, p*.045, '#f0a92a');
    circle(cx+p*.02+sway, by-p*.12, p*.045, '#e2483d');
    circle(cx+p*.10+sway, by-p*.10, p*.040, '#6cbf46');
    return;
  }
  if(o.hawker==='milk'){
    /* cycle with milk cans slung either side */
    var wr=p*.10;
    circle(cx-p*.24, y-wr, wr, '#2b2b2b');
    circle(cx+p*.24, y-wr, wr, '#2b2b2b');
    ctx.strokeStyle='#5a6b7a'; ctx.lineWidth=Math.max(1.5,p*.018);
    ctx.beginPath();
    ctx.moveTo(cx-p*.24,y-wr); ctx.lineTo(cx,y-p*.30); ctx.lineTo(cx+p*.24,y-wr);
    ctx.moveTo(cx,y-p*.30); ctx.lineTo(cx-p*.04,y-p*.52);
    ctx.stroke();
    fillRR(cx-p*.30, y-p*.34, p*.15, p*.22, p*.02, '#b9c3c8');
    fillRR(cx+p*.16, y-p*.34, p*.15, p*.22, p*.02, '#b9c3c8');
    person(cx-p*.02, y, hh*.92, kurta, face, sway, o.seed);
    return;
  }
  /* broom seller: a bundle over the shoulder */
  person(cx, y, hh, kurta, face, sway, o.seed);
  ctx.strokeStyle='#b08040'; ctx.lineWidth=Math.max(1.5,p*.016);
  ctx.beginPath();
  ctx.moveTo(cx-p*.20+sway, y-hh*.52); ctx.lineTo(cx+p*.24+sway, y-hh*.86);
  ctx.stroke();
  ctx.strokeStyle='#d8c489'; ctx.lineWidth=Math.max(1,p*.010);
  for(var b=0;b<5;b++){
    ctx.beginPath();
    ctx.moveTo(cx+p*.22+sway, y-hh*.84);
    ctx.lineTo(cx+p*.34+sway+b*p*.012, y-hh*.96-b*p*.008);
    ctx.stroke();
  }
}

/* A single flat-vector figure — head, torso, legs. Deliberately simple: at
   this scale anything more reads as noise. */
function person(x, ground, h, kurta, face, sway, seed){
  var skin='#c98a5e';
  /* legs */
  ctx.fillStyle='#6f7a86';
  ctx.fillRect(x-h*.10, ground-h*.42, h*.08, h*.42);
  ctx.fillRect(x+h*.02, ground-h*.42, h*.08, h*.42);
  /* torso */
  fillRR(x-h*.15+sway, ground-h*.80, h*.30, h*.42, h*.06, kurta);
  /* arm nearest the road */
  ctx.strokeStyle=skin; ctx.lineWidth=Math.max(1.5,h*.07); ctx.lineCap='round';
  ctx.beginPath();
  ctx.moveTo(x+face*h*.12+sway, ground-h*.72);
  ctx.lineTo(x+face*h*.22+sway, ground-h*.50+Math.sin(seed+ground*0.01)*h*.03);
  ctx.stroke(); ctx.lineCap='butt';
  /* head */
  circle(x+sway, ground-h*.90, h*.11, skin);
  ctx.fillStyle='#2a2320';
  ctx.beginPath(); ctx.arc(x+sway, ground-h*.93, h*.11, Math.PI, 0); ctx.fill();
}

/* bunting strung across the street */
function drawBunting(o,rel){
  var p=ppuAt(rel);
  var yTop = yAt(rel) - 2.6*p;
  var xl = sxAt(-2.0, rel, S.px), xr = sxAt(2.0, rel, S.px);
  var sag = p*0.55 + Math.sin(S.t*1.2+o.seed)*p*0.05;
  ctx.strokeStyle='rgba(60,50,40,0.55)'; ctx.lineWidth=Math.max(1,p*.008);
  ctx.beginPath(); ctx.moveTo(xl,yTop); ctx.quadraticCurveTo((xl+xr)/2, yTop+sag, xr, yTop); ctx.stroke();
  var cols=[C.saffron,'#ffffff',C.green,'#2f7fbf','#d24d3e'];
  var n=11;
  for(var i=1;i<n;i++){
    var t=i/n;
    var bx=(1-t)*(1-t)*xl + 2*(1-t)*t*((xl+xr)/2) + t*t*xr;
    var by=(1-t)*(1-t)*yTop + 2*(1-t)*t*(yTop+sag) + t*t*yTop;
    var fs=Math.max(3,p*.07);
    poly([[bx-fs*.5,by],[bx+fs*.5,by],[bx,by+fs*1.3]], cols[i%cols.length]);
  }
}

export { drawProp, drawBunting };
