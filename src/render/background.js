// Sky, distant skyline, and the road surface under the rider.
//
// The road is drawn as a single filled path sampled down the depth axis
// rather than one flat quad, because it has to follow the bend through a
// junction. Gradients are built once and cached — creating them per frame was
// the biggest avoidable cost in the loop (claude.md section 7).
import { ctx, DW, DH } from '../core/canvas.js';
import { C } from '../core/palette.js';
import { HORIZON, ROAD_HALF, yAt, ppuAt, sxAt } from '../core/projection.js';
import { circle, poly } from '../core/draw.js';
import { S } from '../game/state.js';

/* ---- cached gradients ---- */
var gSky=null, gGround=null, gHaze=null, gHud=null;
function gradients(){
  if(gSky) return;
  gSky = ctx.createLinearGradient(0,0,0,HORIZON);
  gSky.addColorStop(0,C.skyTop); gSky.addColorStop(.55,C.skyMid);
  gSky.addColorStop(.85,C.skyLow); gSky.addColorStop(1,C.skyGlow);

  gGround = ctx.createLinearGradient(0,HORIZON,0,DH);
  gGround.addColorStop(0,C.field2); gGround.addColorStop(1,C.field);

  gHaze = ctx.createLinearGradient(0,HORIZON-6,0,HORIZON+96);
  gHaze.addColorStop(0,C.haze); gHaze.addColorStop(.45,'rgba(232,220,196,0.62)');
  gHaze.addColorStop(1,'rgba(232,220,196,0)');

  gHud = ctx.createLinearGradient(0,0,0,96);
  gHud.addColorStop(0,'rgba(10,16,26,0.55)'); gHud.addColorStop(1,'rgba(10,16,26,0)');
}
function invalidateGradients(){ gSky=gGround=gHaze=gHud=null; }
function hudGradient(){ gradients(); return gHud; }
function hazeGradient(){ gradients(); return gHaze; }

/* ---- sky ---- */
function drawSky(){
  gradients();
  ctx.fillStyle=gSky; ctx.fillRect(0,0,DW,HORIZON);

  /* low morning sun, sitting just above the haze */
  var sy = HORIZON-46;
  circle(300,sy,62,C.sunHalo);
  circle(300,sy,34,'rgba(255,222,150,0.55)');
  circle(300,sy,21,C.sun);

  ctx.globalAlpha=.7; cloud(70,56,34); cloud(196,38,26); cloud(340,86,20); ctx.globalAlpha=1;

  /* birds out early */
  ctx.strokeStyle='rgba(50,54,62,0.40)'; ctx.lineWidth=1.6;
  for(var i=0;i<4;i++){
    var bx = 96+i*32 + Math.sin(S.t*0.5+i)*9, by = 92+i*8;
    ctx.beginPath();
    ctx.moveTo(bx-6,by); ctx.quadraticCurveTo(bx-3,by-4,bx,by);
    ctx.quadraticCurveTo(bx+3,by-4,bx+6,by); ctx.stroke();
  }
}
function cloud(x,y,r){
  circle(x,y,r*.62,'rgba(255,246,232,0.92)');
  circle(x+r*.6,y+r*.12,r*.46,'rgba(255,242,222,0.92)');
  circle(x-r*.6,y+r*.16,r*.4,'rgba(255,238,214,0.92)');
  ctx.fillStyle='rgba(255,244,228,0.92)'; ctx.fillRect(x-r*.6,y,r*1.2,r*.5);
}

/* ---- distant skyline ---- */
function drawSkyline(){
  var off = -(S.trackPos*1.4)%440;
  for(var pass=0;pass<2;pass++){
    ctx.save(); ctx.translate(off+pass*440,0); ctx.globalAlpha=.42;
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
    /* chimney with a thread of morning smoke */
    ctx.fillRect(60,HORIZON-46,7,46);
    ctx.globalAlpha=.18;
    circle(64,HORIZON-54,7,'#fff'); circle(69,HORIZON-66,9,'#fff'); circle(62,HORIZON-80,11,'#fff');
    ctx.globalAlpha=.42;
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

/* ---- the road -------------------------------------------------------------
   Sampled geometrically so the slices bunch up near the rider where the
   perspective changes fastest. Everything goes through sxAt(), which folds in
   the road's curvature, so the strip bends through a junction on its own. */
var Z_NEAR = 1.25, Z_FAR = 96, SLICES = 34;
var zs = (function(){
  var a = new Float64Array(SLICES+1), r = Math.pow(Z_FAR/Z_NEAR, 1/SLICES);
  for(var i=0;i<=SLICES;i++) a[i] = Z_NEAR*Math.pow(r,i);
  return a;
})();

function ribbon(half){
  ctx.beginPath();
  var i, z;
  for(i=0;i<=SLICES;i++){ z=zs[i]; ctx.lineTo(sxAt(-half,z,S.px), yAt(z)); }
  for(i=SLICES;i>=0;i--){ z=zs[i]; ctx.lineTo(sxAt( half,z,S.px), yAt(z)); }
  ctx.closePath();
}

function drawGround(){
  gradients();
  ctx.fillStyle=gGround; ctx.fillRect(0,HORIZON,DW,DH-HORIZON);

  ribbon(ROAD_HALF+0.55); ctx.fillStyle=C.shoulder; ctx.fill();
  ribbon(ROAD_HALF);      ctx.fillStyle=C.road;     ctx.fill();

  drawJunctions();

  /* tar patches, clipped to the road */
  ctx.save();
  ribbon(ROAD_HALF); ctx.clip();
  var phase=S.trackPos%9;
  for(var k=0;k<10;k++){
    var z=2+k*9-phase; if(z<1.4) continue;
    var y=yAt(z), p=ppuAt(z), c=sxAt(0,z,S.px);
    ctx.globalAlpha=.42; ctx.fillStyle=(k%2)?C.roadLite:C.patch;
    ctx.beginPath(); ctx.ellipse(c+Math.sin(k*2.3)*p*.5, y, p*.6, Math.max(2,p*.08),0,0,6.2832); ctx.fill();
  }
  ctx.globalAlpha=1; ctx.restore();

  dashes(-0.40); dashes(0.40);
  edge(-ROAD_HALF+0.06); edge(ROAD_HALF-0.06);
}

/* A side street crossing the round, with the tarmac worn pale where the two
   meet. Drawn on the ground, under everything else. */
function drawJunctions(){
  for(var i=0;i<S.junctions.length;i++){
    var j = S.junctions[i];
    var z0 = j.z - S.trackPos - 2.2, z1 = j.z - S.trackPos + 2.2;
    if(z1 < 1.4 || z0 > Z_FAR) continue;
    z0 = Math.max(z0, 1.4);
    var W = 7.5;
    poly([[sxAt(-W,z0,S.px), yAt(z0)], [sxAt(W,z0,S.px), yAt(z0)],
          [sxAt(W,z1,S.px), yAt(z1)], [sxAt(-W,z1,S.px), yAt(z1)]], C.road);
    /* pale wear where traffic turns */
    var zm = (z0+z1)/2, p = ppuAt(zm);
    ctx.globalAlpha=.22; ctx.fillStyle=C.roadLite;
    ctx.beginPath();
    ctx.ellipse(sxAt(0,zm,S.px), yAt(zm), p*2.4, Math.max(2,p*0.5), 0, 0, 6.2832);
    ctx.fill(); ctx.globalAlpha=1;
  }
}

function dashes(xo){
  var phase=S.trackPos%7;
  for(var k=0;k<14;k++){
    var z0=1.8+k*7-phase, z1=z0+3.4;
    if(z1<1.4) continue; if(z0>Z_FAR*0.72) break;
    z0=Math.max(z0,1.4);
    var y0=yAt(z0),y1=yAt(z1),p0=ppuAt(z0),p1=ppuAt(z1);
    var c0=sxAt(xo,z0,S.px), c1=sxAt(xo,z1,S.px);
    var w0=Math.max(.7,p0*.016), w1=Math.max(.4,p1*.016);
    poly([[c0-w0,y0],[c0+w0,y0],[c1+w1,y1],[c1-w1,y1]],'rgba(239,226,173,0.55)');
  }
}

function edge(x){
  ctx.beginPath();
  for(var i=0;i<=SLICES;i++){
    var z=zs[i]; if(z>Z_FAR*0.70) break;
    ctx.lineTo(sxAt(x,z,S.px), yAt(z));
  }
  ctx.strokeStyle='rgba(255,255,255,0.30)';
  ctx.lineWidth=2.2; ctx.lineJoin='round';
  ctx.stroke();
}

/* Warm mist over everything past mid-distance. Painted by scene.js partway
   through the depth-sorted pass, so far scenery emerges from it instead of
   popping in at the draw distance. */
function drawHaze(){
  gradients();
  ctx.fillStyle=gHaze; ctx.fillRect(0,HORIZON-6,DW,102);
}

export { drawSky, drawSkyline, drawGround, drawHaze, hudGradient, hazeGradient,
         invalidateGradients, Z_FAR };
