// Things in the road: cows, autos, thelas, potholes, scooters, tempos.
import { ctx } from '../core/canvas.js';
import { C } from '../core/palette.js';
import { yAt, ppuAt, sxAt } from '../core/projection.js';
import { fillRR, circle } from '../core/draw.js';
import { S } from '../game/state.js';

function drawObstacle(o,rel){
  var p=ppuAt(rel), y=yAt(rel), cx=sxAt(o.x,rel,S.px), s=p;

  if(o.type!=='pothole'){
    ctx.globalAlpha=.22;
    ctx.beginPath(); ctx.ellipse(cx,y,s*.34,Math.max(1.5,s*.07),0,0,6.2832); ctx.fillStyle='#000'; ctx.fill();
    ctx.globalAlpha=1;
  }

  if(o.type==='pothole'){
    ctx.beginPath(); ctx.ellipse(cx,y,s*.34,Math.max(2,s*.11),0,0,6.2832); ctx.fillStyle='#41403a'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx,y-s*.02,s*.26,Math.max(1.5,s*.075),0,0,6.2832); ctx.fillStyle='#2a2925'; ctx.fill();
    ctx.globalAlpha=.5;
    ctx.beginPath(); ctx.ellipse(cx-s*.06,y+s*.01,s*.12,Math.max(1,s*.03),0,0,6.2832); ctx.fillStyle='#6f8fa0'; ctx.fill();
    ctx.globalAlpha=1;
    return;
  }

  if(o.type==='cow'){
    var chew = Math.sin(S.t*3+o.seed)*s*.012;
    var bh=s*.62, bw=s*.54;
    fillRR(cx-bw/2, y-bh, bw, bh*.70, s*.07, '#f4eee2');
    ctx.fillStyle='#7a5b41';
    ctx.beginPath(); ctx.ellipse(cx-bw*.16,y-bh*.60,bw*.17,bh*.15,0,0,6.2832); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+bw*.20,y-bh*.38,bw*.14,bh*.13,0,0,6.2832); ctx.fill();
    ctx.fillStyle='#ddd6c8';
    ctx.fillRect(cx-bw*.36,y-bh*.30,bw*.15,bh*.30);
    ctx.fillRect(cx+bw*.21,y-bh*.30,bw*.15,bh*.30);
    /* hump */
    ctx.beginPath(); ctx.arc(cx, y-bh*.72, bw*.20, Math.PI, 0); ctx.fillStyle='#f4eee2'; ctx.fill();
    /* head */
    fillRR(cx-bw*.23, y-bh*1.20+chew, bw*.46, bh*.48, s*.05, '#f8f3e9');
    fillRR(cx-bw*.12, y-bh*.88+chew, bw*.24, bh*.17, s*.04, '#e3c2bb');
    ctx.strokeStyle='#cbb79a'; ctx.lineWidth=Math.max(1.6,s*.032); ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(cx-bw*.19,y-bh*1.18+chew); ctx.quadraticCurveTo(cx-bw*.36,y-bh*1.38+chew,cx-bw*.27,y-bh*1.47+chew);
    ctx.moveTo(cx+bw*.19,y-bh*1.18+chew); ctx.quadraticCurveTo(cx+bw*.36,y-bh*1.38+chew,cx+bw*.27,y-bh*1.47+chew);
    ctx.stroke(); ctx.lineCap='butt';
    circle(cx-bw*.11,y-bh*1.03+chew,Math.max(1,s*.022),C.ink);
    circle(cx+bw*.11,y-bh*1.03+chew,Math.max(1,s*.022),C.ink);
    return;
  }

  if(o.type==='auto'){
    var aw=s*.62, ah=s*.70;
    ctx.beginPath();
    ctx.moveTo(cx-aw/2,y-ah*.56); ctx.quadraticCurveTo(cx,y-ah*1.10,cx+aw/2,y-ah*.56);
    ctx.closePath(); ctx.fillStyle='#1f6f4f'; ctx.fill();
    fillRR(cx-aw/2,y-ah*.58,aw,ah*.44,s*.04,'#f3c51e');
    fillRR(cx-aw*.30,y-ah*.54,aw*.60,ah*.22,s*.03,'#2c3b44');
    fillRR(cx-aw*.42,y-ah*.18,aw*.84,ah*.10,s*.02,'#2c2c2c');
    fillRR(cx-aw*.17,y-ah*.35,aw*.34,ah*.12,s*.02,C.paper);
    circle(cx-aw*.36,y-ah*.08,s*.075,'#25272b');
    circle(cx+aw*.36,y-ah*.08,s*.075,'#25272b');
    return;
  }

  if(o.type==='thela'){
    var cw=s*.72, ch=s*.38;
    circle(cx-cw*.28,y-ch*.16,s*.10,'#3a3a3a');
    circle(cx+cw*.28,y-ch*.16,s*.10,'#3a3a3a');
    fillRR(cx-cw/2,y-ch-s*.10,cw,ch,s*.03,'#b5793f');
    ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fillRect(cx-cw/2,y-ch*.44-s*.10,cw,ch*.12);
    var cols=['#e2483d','#f6a723','#6cbf46','#e2483d','#f6a723','#8e5fb0'];
    for(var i=0;i<6;i++) circle(cx-cw*.36+i*cw*.145, y-ch-s*.17, s*.06, cols[i]);
    /* umbrella */
    ctx.fillStyle='#7b7268'; ctx.fillRect(cx+cw*.30, y-ch-s*.72, s*.02, s*.6);
    ctx.beginPath(); ctx.arc(cx+cw*.31, y-ch-s*.70, s*.26, Math.PI, 0);
    ctx.fillStyle='#d24d3e'; ctx.fill();
    return;
  }

  if(o.type==='scooter'){
    var sw=s*.40, sh=s*.48;
    circle(cx-sw*.42,y-s*.075,s*.08,'#2b2b2b');
    circle(cx+sw*.42,y-s*.075,s*.08,'#2b2b2b');
    fillRR(cx-sw*.5,y-sh*.62,sw,sh*.36,s*.04,'#3f79b8');
    fillRR(cx-sw*.16,y-sh*.98,sw*.44,sh*.38,s*.03,'#2f5f95');
    ctx.fillStyle='#2b2b2b'; ctx.fillRect(cx-sw*.5,y-sh*1.04,sw*.11,sh*.44);
    return;
  }

  /* tempo / Horn OK truck coming the other way */
  var tw=s*.86, th=s*1.0;
  fillRR(cx-tw/2,y-th,tw,th*.60,s*.05,'#2f6db5');
  fillRR(cx-tw*.46,y-th*1.18,tw*.92,th*.24,s*.04,'#e94f37');
  ctx.fillStyle='rgba(255,255,255,0.9)';
  ctx.fillRect(cx-tw*.30,y-th*1.10,tw*.60,Math.max(2,th*.05));
  fillRR(cx-tw*.34,y-th*.92,tw*.68,th*.26,s*.03,'#cfe4ef');
  fillRR(cx-tw*.40,y-th*.44,tw*.80,th*.16,s*.02,'#20344f');
  fillRR(cx-tw/2,y-th*.26,tw,th*.13,s*.02,'#e9c84f');
  circle(cx-tw*.34,y-th*.34,s*.05,'#fff3c4');
  circle(cx+tw*.34,y-th*.34,s*.05,'#fff3c4');
  circle(cx-tw*.38,y-th*.10,s*.095,'#25272b');
  circle(cx+tw*.38,y-th*.10,s*.095,'#25272b');
  return;
}

export { drawObstacle };
