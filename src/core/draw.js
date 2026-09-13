// Thin wrappers over the 2D context so the draw code stays readable.
import { ctx } from './canvas.js';
import { C } from './palette.js';

function rr(x,y,w,h,r){
  r = Math.min(r, Math.abs(w)/2, Math.abs(h)/2);
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function fillRR(x,y,w,h,r,col){ rr(x,y,w,h,r); ctx.fillStyle=col; ctx.fill(); }
function poly(pts,col){ ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
  for(var i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]);
  ctx.closePath(); ctx.fillStyle=col; ctx.fill(); }
function circle(x,y,r,col){ ctx.beginPath(); ctx.arc(x,y,r,0,6.2832); ctx.fillStyle=col; ctx.fill(); }
function label(s,x,y,size,col,align,weight){
  ctx.font=(weight||'600')+' '+size+'px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
  ctx.textAlign=align||'left'; ctx.textBaseline='alphabetic';
  ctx.fillStyle=col||C.hud; ctx.fillText(s,x,y);
}

export { rr, fillRR, poly, circle, label };
