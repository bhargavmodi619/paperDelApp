// Civic buildings along the round: a temple, a school, a government office.
// None of them are ever on the delivery round — they are there so the street
// has landmarks and the ride stops feeling like one repeating house.
import { ctx, DW } from '../core/canvas.js';
import { C } from '../core/palette.js';
import { yAt, ppuAt, sxAt } from '../core/projection.js';
import { fillRR, poly, circle } from '../core/draw.js';
import { S } from '../game/state.js';

function drawLandmark(o, rel){
  var p=ppuAt(rel), y=yAt(rel), cx=sxAt(o.x,rel,S.px);
  var w=o.w*p, h=o.h*p;
  if(cx+w < -80 || cx-w > DW+80) return;

  /* ground shadow */
  ctx.globalAlpha=.16;
  ctx.beginPath(); ctx.ellipse(cx,y,w*.55,Math.max(2,p*.05),0,0,6.2832); ctx.fillStyle='#000'; ctx.fill();
  ctx.globalAlpha=1;

  if(o.type==='temple')      temple(o,cx,y,w,h,p);
  else if(o.type==='school') school(o,cx,y,w,h,p);
  else                       govt(o,cx,y,w,h,p);

  /* the low sun catches the east face of everything */
  ctx.globalAlpha=.18;
  ctx.fillStyle=C.warm;
  ctx.fillRect(o.side>0?cx-w/2:cx+w*.14, y-h, w*.36, h);
  ctx.globalAlpha=1;
}

/* ---- temple: plinth, steps, shikhara, kalash, saffron flag ---- */
function temple(o,cx,y,w,h,p){
  var x0=cx-w/2, y0=y-h;

  /* plinth and steps */
  fillRR(x0-w*.10, y-h*.16, w*1.20, h*.16, p*.01, '#d8cbb0');
  ctx.fillStyle='rgba(0,0,0,0.10)';
  for(var s=0;s<3;s++) ctx.fillRect(cx-w*.24+s*w*.02, y-h*.05+s*h*.02, w*.48-s*w*.04, Math.max(1,h*.02));

  /* body */
  fillRR(x0, y0+h*.34, w, h*.50, p*.012, C.temple);
  ctx.fillStyle='rgba(0,0,0,0.08)';
  ctx.fillRect(o.side>0?x0:x0+w*.76, y0+h*.34, w*.24, h*.50);

  /* shikhara — the stepped tower */
  var tw=w*.62, tx=cx-tw/2, ty=y0+h*.34;
  for(var i=0;i<5;i++){
    var f=i/5, ww=tw*(1-f*0.62), hh=h*.075;
    fillRR(cx-ww/2, ty-h*.075*(i+1), ww, hh, p*.008, i%2 ? C.temple : '#e6d3b0');
  }
  /* kalash finial */
  var ky = ty-h*.375;
  circle(cx, ky-p*.05, Math.max(2,p*.045), C.templeGold);
  ctx.fillStyle=C.templeGold; ctx.fillRect(cx-Math.max(1,p*.008), ky-p*.14, Math.max(2,p*.016), p*.10);

  /* saffron pennant */
  var flut=Math.sin(S.t*3+o.seed)*p*.03;
  poly([[cx+p*.012,ky-p*.14],[cx+p*.20+flut,ky-p*.10],[cx+p*.012,ky-p*.05]], C.saffron);

  /* doorway and trim band */
  fillRR(cx-w*.12, y-h*.34, w*.24, h*.34, p*.012, C.templeTrim);
  fillRR(cx-w*.08, y-h*.28, w*.16, h*.28, p*.010, '#5a3524');
  ctx.fillStyle=C.templeTrim;
  ctx.fillRect(x0, y0+h*.34, w, Math.max(1.5,h*.035));

  /* bell hanging in the porch */
  var bx=cx-w*.30, by=y-h*.46;
  ctx.strokeStyle='#8d8577'; ctx.lineWidth=Math.max(1,p*.008);
  ctx.beginPath(); ctx.moveTo(bx,by-p*.10); ctx.lineTo(bx,by); ctx.stroke();
  ctx.beginPath(); ctx.arc(bx,by,Math.max(2,p*.05),Math.PI,0); ctx.fillStyle=C.templeGold; ctx.fill();
}

/* ---- school: long block, tricolour on a pole, painted board, boundary wall ---- */
function school(o,cx,y,w,h,p){
  var x0=cx-w/2, y0=y-h;

  fillRR(x0, y0, w, h, p*.012, C.school);
  ctx.fillStyle='rgba(0,0,0,0.08)';
  ctx.fillRect(o.side>0?x0:x0+w*.80, y0, w*.20, h);

  /* flat roof with a parapet */
  fillRR(x0-w*.03, y0-h*.07, w*1.06, h*.08, p*.008, C.schoolTrim);

  /* a row of classroom windows */
  var n=6, wy=y0+h*.26, ww=w*.10, wh=h*.24;
  for(var i=0;i<n;i++){
    var wx = x0 + w*.08 + i*(w*.84/n);
    fillRR(wx, wy, ww, wh, p*.006, '#a9c4d0');
    ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=Math.max(1,p*.006);
    ctx.beginPath(); ctx.moveTo(wx+ww/2,wy); ctx.lineTo(wx+ww/2,wy+wh); ctx.stroke();
  }

  /* verandah posts */
  ctx.fillStyle='#d8cdb4';
  for(var q=0;q<4;q++) ctx.fillRect(x0+w*.10+q*w*.26, y-h*.28, Math.max(1.5,w*.022), h*.28);

  /* painted name board */
  fillRR(x0+w*.20, y0+h*.60, w*.60, h*.14, p*.008, C.schoolTrim);
  ctx.fillStyle='rgba(255,255,255,0.85)';
  ctx.fillRect(x0+w*.25, y0+h*.645, w*.50, Math.max(1.5,h*.030));

  /* flagpole with the tricolour */
  var fx = cx + w*.40*(o.side>0?-1:1), fh=h*1.05;
  ctx.fillStyle='#b9b2a4'; ctx.fillRect(fx-Math.max(1,p*.008), y-fh, Math.max(2,p*.016), fh);
  var fw=p*.30, fhh=p*.20, wave=Math.sin(S.t*2.6+o.seed)*p*.02;
  fillRR(fx, y-fh, fw, fhh/3, 0, C.saffron);
  fillRR(fx, y-fh+fhh/3+wave*0, fw, fhh/3, 0, '#ffffff');
  fillRR(fx, y-fh+fhh*2/3, fw, fhh/3, 0, C.green);
  circle(fx+fw*.5, y-fh+fhh*.5, Math.max(1,fhh*.10), C.chakra);

  /* boundary wall and gate */
  fillRR(cx-w*.56, y-h*.18, w*1.12, h*.18, p*.006, '#ddd2ba');
  ctx.fillStyle='rgba(0,0,0,0.14)';
  for(var g=0;g<5;g++) ctx.fillRect(cx-w*.14+g*w*.07, y-h*.18, Math.max(.8,p*.006), h*.18);
}

/* ---- government office: plain sarkari block, tricolour band, board ---- */
function govt(o,cx,y,w,h,p){
  var x0=cx-w/2, y0=y-h;

  fillRR(x0, y0, w, h, p*.008, C.govt);
  ctx.fillStyle='rgba(0,0,0,0.09)';
  ctx.fillRect(o.side>0?x0:x0+w*.78, y0, w*.22, h);

  /* deep roof slab */
  fillRR(x0-w*.05, y0-h*.09, w*1.10, h*.10, p*.006, '#c4bba6');

  /* two storeys of identical windows, because it is a government office */
  for(var row=0; row<2; row++){
    for(var i=0;i<5;i++){
      var wx = x0 + w*.09 + i*(w*.82/5), wy = y0 + h*(0.20 + row*0.34);
      fillRR(wx, wy, w*.09, h*.20, p*.005, '#9fb3bc');
      ctx.fillStyle='rgba(255,255,255,0.30)';
      ctx.fillRect(wx, wy, w*.09, Math.max(1,h*.03));
    }
  }

  /* tricolour band over the entrance */
  var bw=w*.52, bx=cx-bw/2, by=y0+h*.80;
  fillRR(bx, by, bw, h*.035, 0, C.saffron);
  fillRR(bx, by+h*.035, bw, h*.035, 0, '#ffffff');
  fillRR(bx, by+h*.070, bw, h*.035, 0, C.green);

  /* board and doorway */
  fillRR(bx, y0+h*.62, bw, h*.13, p*.006, C.govtTrim);
  ctx.fillStyle='rgba(255,255,255,0.80)';
  ctx.fillRect(bx+bw*.08, y0+h*.665, bw*.84, Math.max(1.5,h*.028));
  fillRR(cx-w*.10, y-h*.30, w*.20, h*.30, p*.008, '#6d5a44');

  /* a couple of parked cycles and a notice board */
  circle(cx-w*.34, y-p*.05, p*.055, '#3a3a3a');
  circle(cx-w*.26, y-p*.05, p*.055, '#3a3a3a');
  fillRR(cx+w*.28, y-h*.22, w*.12, h*.16, p*.006, '#8d8577');
}

export { drawLandmark };
