// Full-screen overlays: title, street cleared, round over.
import { ctx, DW } from '../core/canvas.js';
import { C } from '../core/palette.js';
import { fillRR, circle, label } from '../core/draw.js';
import { S } from '../game/state.js';

function panel(y,h){ fillRR(26,y,DW-52,h,22,C.panel); }
function button(cx,cy,w,h,txt){
  var pulse=.5+.5*Math.sin(S.t*3.4);
  ctx.globalAlpha=.18+.22*pulse;
  fillRR(cx-w/2-7,cy-h/2-7,w+14,h+14,(h+14)/2,C.pin);
  ctx.globalAlpha=1;
  fillRR(cx-w/2,cy-h/2,w,h,h/2,C.pin);
  label(txt,cx,cy+6,17,'#231505','center','800');
}
function drawTitle(){
  panel(146,392);
  /* tricolour rule */
  fillRR(150,178,100,5,3,C.saffron);
  fillRR(150,186,100,5,3,'#ffffff');
  fillRR(150,194,100,5,3,C.green);
  label('PAPER ROUND',DW/2,240,40,C.hud,'center','800');
  label('The morning round, one street at a time',DW/2,266,13,C.hudDim,'center','600');
  var lx=62,y=310;
  bullet(lx,y,    'Steady speed. You only steer.');
  bullet(lx,y+38, 'Swipe or ← → to change lane.');
  bullet(lx,y+76, 'Tap a side when its bar hits green.');
  bullet(lx,y+114,'Too early lands short, too late overshoots.');
  button(DW/2,494,190,46,'START RIDE');
  if(S.best>0) label('Best  '+S.best,DW/2,528,13,C.hudDim,'center','600');
}
function bullet(x,y,t){ circle(x-14,y-5,4,C.pin); label(t,x,y,14,C.hud,'left','500'); }
function drawClear(){
  panel(196,290);
  if(S.failed){
    label('STREET MISSED',DW/2,250,26,C.bad,'center','800');
    label('Delivered '+S.delivered+' of '+S.need+' needed',DW/2,286,15,C.hud,'center','600');
    label('Lives left  '+S.lives,DW/2,314,15,C.hudDim,'center','600');
  } else {
    label('STREET CLEARED',DW/2,250,26,C.good,'center','800');
    label('Delivered '+S.delivered+' of '+S.targets,DW/2,286,16,C.hud,'center','600');
    label('Score  '+S.score,DW/2,316,20,C.gold,'center','800');
    if(S.perfect) label('Clean round — extra life',DW/2,344,14,C.good,'center','700');
  }
  button(DW/2,436,176,44,S.failed?'RETRY':'NEXT STREET');
}
function drawOver(){
  panel(214,246);
  label('ROUND OVER',DW/2,268,28,C.bad,'center','800');
  label('Score  '+S.score,DW/2,308,20,C.hud,'center','700');
  label('Best  '+S.best,DW/2,338,17,C.gold,'center','700');
  label('Reached level '+S.level,DW/2,366,14,C.hudDim,'center','600');
  button(DW/2,420,176,44,'RIDE AGAIN');
}

export { drawTitle, drawClear, drawOver };
