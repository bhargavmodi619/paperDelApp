// Sky, distant skyline, and the road surface under the rider.
import { ctx, DW, DH } from '../core/canvas.js';
import { C } from '../core/palette.js';
import { HORIZON, ROAD_HALF, yAt, ppuAt } from '../core/projection.js';
import { circle, poly } from '../core/draw.js';
import { S } from '../game/state.js';

function drawSky(){
  var g = ctx.createLinearGradient(0,0,0,HORIZON);
  g.addColorStop(0,C.skyTop); g.addColorStop(.6,C.skyMid); g.addColorStop(1,C.skyLow);
  ctx.fillStyle=g; ctx.fillRect(0,0,DW,HORIZON);
  circle(298,150,40,'rgba(255,243,198,0.45)'); circle(298,150,25,C.sun);
  ctx.globalAlpha=.8; cloud(70,56,34); cloud(196,36,26); cloud(340,78,22); ctx.globalAlpha=1;
  /* a couple of birds */
  ctx.strokeStyle='rgba(40,60,75,0.45)'; ctx.lineWidth=1.6;
  for(var i=0;i<3;i++){
    var bx = 110+i*34 + Math.sin(S.t*0.5+i)*8, by = 96+i*9;
    ctx.beginPath();
    ctx.moveTo(bx-6,by); ctx.quadraticCurveTo(bx-3,by-4,bx,by);
    ctx.quadraticCurveTo(bx+3,by-4,bx+6,by); ctx.stroke();
  }
}
function cloud(x,y,r){
  circle(x,y,r*.62,'#fff'); circle(x+r*.6,y+r*.12,r*.46,'#fff'); circle(x-r*.6,y+r*.16,r*.4,'#fff');
  ctx.fillStyle='#fff'; ctx.fillRect(x-r*.6,y,r*1.2,r*.5);
}
function drawSkyline(){
  var off = -(S.trackPos*1.4)%440;
  for(var pass=0;pass<2;pass++){
    ctx.save(); ctx.translate(off+pass*440,0); ctx.globalAlpha=.45;
    ctx.fillStyle=C.far2;
    ctx.fillRect(14,HORIZON-30,52,30); ctx.fillRect(74,HORIZON-19,34,19);
    ctx.fillRect(256,HORIZON-26,58,26); ctx.fillRect(372,HORIZON-18,44,18);
    /* temple */
    poly([[118,HORIZON],[118,HORIZON-24],[132,HORIZON-58],[146,HORIZON-24],[146,HORIZON]],C.far);
    circle(132,HORIZON-62,4,C.far);
    /* mosque */
    ctx.beginPath(); ctx.arc(192,HORIZON-28,15,Math.PI,0); ctx.fillStyle=C.far; ctx.fill();
    ctx.fillRect(177,HORIZON-28,30,28); ctx.fillRect(210,HORIZON-50,6,50);
    /* water tank */
    ctx.fillStyle=C.far2;
    ctx.fillRect(320,HORIZON-50,28,15);
    ctx.fillRect(325,HORIZON-35,4,35); ctx.fillRect(340,HORIZON-35,4,35);
    palm(236,HORIZON,30); palm(100,HORIZON,24);
    ctx.restore();
  }
  ctx.globalAlpha=1;
}
function palm(x,ground,h){
  ctx.fillStyle=C.far2; ctx.fillRect(x-1.5,ground-h,3,h);
  ctx.strokeStyle=C.far2; ctx.lineWidth=3;
  for(var i=0;i<5;i++){
    var a=-Math.PI/2+(i-2)*.55;
    ctx.beginPath(); ctx.moveTo(x,ground-h);
    ctx.quadraticCurveTo(x+Math.cos(a)*14,ground-h+Math.sin(a)*10,x+Math.cos(a)*20,ground-h+Math.sin(a)*4);
    ctx.stroke();
  }
}
function drawGround(){
  var g = ctx.createLinearGradient(0,HORIZON,0,DH);
  g.addColorStop(0,C.field2); g.addColorStop(1,C.field);
  ctx.fillStyle=g; ctx.fillRect(0,HORIZON,DW,DH-HORIZON);

  var zF=70, zN=1.25;
  var yF=yAt(zF), yN=yAt(zN), pF=ppuAt(zF), pN=ppuAt(zN);
  var cF=DW/2-S.px*pF, cN=DW/2-S.px*pN;

  poly([[cF-(ROAD_HALF+.55)*pF,yF],[cF+(ROAD_HALF+.55)*pF,yF],
        [cN+(ROAD_HALF+.55)*pN,yN],[cN-(ROAD_HALF+.55)*pN,yN]], C.shoulder);
  poly([[cF-ROAD_HALF*pF,yF],[cF+ROAD_HALF*pF,yF],
        [cN+ROAD_HALF*pN,yN],[cN-ROAD_HALF*pN,yN]], C.road);

  /* tar patches */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cF-ROAD_HALF*pF,yF); ctx.lineTo(cF+ROAD_HALF*pF,yF);
  ctx.lineTo(cN+ROAD_HALF*pN,yN); ctx.lineTo(cN-ROAD_HALF*pN,yN); ctx.closePath(); ctx.clip();
  var phase=S.trackPos%9;
  for(var k=0;k<10;k++){
    var z=2+k*9-phase; if(z<1.4) continue;
    var y=yAt(z), p=ppuAt(z), c=DW/2-S.px*p;
    ctx.globalAlpha=.45; ctx.fillStyle=(k%2)?C.roadLite:C.patch;
    ctx.beginPath(); ctx.ellipse(c+Math.sin(k*2.3)*p*.5, y, p*.6, Math.max(2,p*.08),0,0,6.2832); ctx.fill();
  }
  ctx.globalAlpha=1; ctx.restore();

  var hz = ctx.createLinearGradient(0,HORIZON,0,HORIZON+66);
  hz.addColorStop(0,'rgba(220,239,244,0.8)'); hz.addColorStop(1,'rgba(220,239,244,0)');
  ctx.fillStyle=hz; ctx.fillRect(0,HORIZON,DW,66);

  dashes(-0.40); dashes(0.40);
  edge(-ROAD_HALF+0.06); edge(ROAD_HALF-0.06);
}
function dashes(xo){
  var phase=S.trackPos%7;
  for(var k=0;k<14;k++){
    var z0=1.8+k*7-phase, z1=z0+3.4;
    if(z1<1.4) continue; if(z0>66) break;
    z0=Math.max(z0,1.4);
    var y0=yAt(z0),y1=yAt(z1),p0=ppuAt(z0),p1=ppuAt(z1);
    var c0=DW/2-S.px*p0, c1=DW/2-S.px*p1;
    var w0=Math.max(.7,p0*.016), w1=Math.max(.4,p1*.016);
    poly([[c0+xo*p0-w0,y0],[c0+xo*p0+w0,y0],[c1+xo*p1+w1,y1],[c1+xo*p1-w1,y1]],'rgba(239,226,173,0.6)');
  }
}
function edge(x){
  var zF=64,zN=1.4, yF=yAt(zF),yN=yAt(zN),pF=ppuAt(zF),pN=ppuAt(zN);
  var cF=DW/2-S.px*pF, cN=DW/2-S.px*pN;
  poly([[cF+x*pF-.6,yF],[cF+x*pF+.6,yF],[cN+x*pN+3,yN],[cN+x*pN-3,yN]],'rgba(255,255,255,0.32)');
}

export { drawSky, drawSkyline, drawGround };
