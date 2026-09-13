// The rider, drawn from behind: bike, basket, handlebar, mirrors and arms.
import { ctx, DW, DH } from '../core/canvas.js';
import { C } from '../core/palette.js';
import { fillRR, circle } from '../core/draw.js';
import { clamp } from '../core/math.js';
import { S } from '../game/state.js';

function drawRider(){
  var lean=clamp(S.lean,-.9,.9);
  var wob=Math.sin(S.t*10)*1.2 + (S.stun>0?Math.sin(S.t*40)*7:0);
  ctx.save();
  ctx.translate(DW/2 + lean*34 + wob, DH);
  ctx.rotate(lean*0.05);

  ctx.globalAlpha=.22;
  ctx.beginPath(); ctx.ellipse(0,-4,124,22,0,0,6.2832); ctx.fillStyle='#000'; ctx.fill();
  ctx.globalAlpha=1;

  /* tank */
  ctx.beginPath();
  ctx.moveTo(-108,4); ctx.quadraticCurveTo(-94,-86,0,-106); ctx.quadraticCurveTo(94,-86,108,4);
  ctx.closePath(); ctx.fillStyle='#2c4258'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-76,4); ctx.quadraticCurveTo(-68,-74,0,-92); ctx.quadraticCurveTo(68,-74,76,4);
  ctx.closePath(); ctx.fillStyle='#3d5f7e'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-16,4); ctx.quadraticCurveTo(-10,-72,0,-90); ctx.quadraticCurveTo(10,-72,16,4);
  ctx.closePath(); ctx.fillStyle='#e8ebee'; ctx.fill();
  circle(0,-78,9,'#22303d'); circle(0,-78,5,'#8fa3b3');

  /* basket of papers */
  var bw=136, bh=58, by=-198;
  var stack = clamp(Math.ceil(S.papers/3),0,6);
  for(var i=0;i<stack;i++){
    var spread = stack>1 ? (bw*0.66/(stack-1)) : 0;
    ctx.save();
    ctx.translate(-bw*0.33 + i*spread, by+16-(i%2)*6);
    ctx.rotate(i%2?0.12:-0.10);
    fillRR(-18,-13,36,26,8, i%2?'#efe9d8':C.paper);
    ctx.fillStyle=C.paperInk; ctx.fillRect(-11,-6,22,3);
    ctx.fillStyle='rgba(0,0,0,0.14)'; ctx.fillRect(-11,1,15,3);
    ctx.restore();
  }
  ctx.strokeStyle='#3a4048'; ctx.lineWidth=5;
  ctx.beginPath(); ctx.moveTo(-bw/2,by); ctx.lineTo(-bw*.40,by+bh);
  ctx.lineTo(bw*.40,by+bh); ctx.lineTo(bw/2,by); ctx.stroke();
  ctx.lineWidth=3;
  for(var k=1;k<6;k++){ var fx=-bw/2+k*(bw/6);
    ctx.beginPath(); ctx.moveTo(fx,by); ctx.lineTo(fx*.80,by+bh); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-bw*.455,by+bh*.5); ctx.lineTo(bw*.455,by+bh*.5); ctx.stroke();
  ctx.lineWidth=5;
  ctx.beginPath(); ctx.moveTo(-bw*.40,by+bh); ctx.lineTo(bw*.40,by+bh); ctx.stroke();

  /* handlebar */
  ctx.strokeStyle='#242a31'; ctx.lineWidth=12; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-128,-106); ctx.quadraticCurveTo(0,-148,128,-106); ctx.stroke();
  ctx.lineWidth=18; ctx.strokeStyle='#15181c';
  ctx.beginPath(); ctx.moveTo(-134,-104); ctx.lineTo(-106,-112); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(134,-104); ctx.lineTo(106,-112); ctx.stroke();
  ctx.lineCap='butt';

  mirror(-152,-182,-1); mirror(152,-182,1);

  /* hands — the throwing one lifts off the grip and swings out */
  var throwT = S.arm>0 ? 1 - (S.arm/0.34) : 0;
  drawArm(-1, S.arm>0 && S.armSide===-1 ? throwT : 0);
  drawArm( 1, S.arm>0 && S.armSide=== 1 ? throwT : 0);

  ctx.restore();
}
function drawArm(side, t){
  /* t: 0 resting on the grip, 1 full follow-through */
  var swing = Math.sin(t*Math.PI);
  var gx = side*120, gy = -110;
  var x = gx + side*swing*58;
  var y = gy - swing*66;
  var shx = side*74, shy = 34;                    // shoulder, just off the bottom edge
  /* upper arm + forearm as one tapered limb */
  ctx.strokeStyle='#42607d'; ctx.lineWidth=27; ctx.lineCap='round';
  ctx.beginPath();
  ctx.moveTo(shx, shy);
  ctx.quadraticCurveTo(shx + side*26, (shy+y)/2 + 18 - swing*20, x, y+10);
  ctx.stroke();
  /* cuff */
  ctx.strokeStyle='#33506b'; ctx.lineWidth=27;
  ctx.beginPath();
  ctx.moveTo(x - side*4, y+22); ctx.lineTo(x, y+12); ctx.stroke();
  ctx.lineCap='butt';
  /* fist */
  ctx.save(); ctx.translate(x,y); ctx.rotate(side*(0.12+swing*0.7));
  fillRR(-19,-15,38,27,12,'#c98a5e');
  ctx.fillStyle='rgba(0,0,0,0.10)'; ctx.fillRect(-19,-2,38,4);
  ctx.restore();
}
function mirror(x,y,dir){
  ctx.strokeStyle='#242a31'; ctx.lineWidth=5; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(x-dir*16,y+72); ctx.lineTo(x,y+18); ctx.stroke();
  ctx.lineCap='butt';
  ctx.save(); ctx.translate(x,y); ctx.rotate(dir*.20);
  fillRR(-19,-15,38,30,9,'#242a31');
  fillRR(-14,-10,28,20,6,'#9dc2d4');
  ctx.fillStyle='rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.moveTo(-14,4); ctx.lineTo(2,-10); ctx.lineTo(10,-10); ctx.lineTo(-8,8);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

export { drawRider };
