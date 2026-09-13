// Pointer (swipe to steer, tap a side to throw) and keyboard controls.
import { cv, DW, DH } from '../core/canvas.js';
import { S } from './state.js';
import { setLane } from './actions.js';
import { toss } from './throwing.js';
import { press } from './flow.js';
import { toggleMute } from '../core/audio.js';

function attachInput(){
  if (typeof window!=='undefined' && window.addEventListener){
    var down=null;
    cv.addEventListener('pointerdown',function(e){
      e.preventDefault();
      var r=cv.getBoundingClientRect();
      down={ x:(e.clientX-r.left)/r.width*DW, y:(e.clientY-r.top)/r.height*DH, moved:false };
    });
    cv.addEventListener('pointermove',function(e){
      if(!down||down.moved) return;
      var r=cv.getBoundingClientRect();
      var dx=(e.clientX-r.left)/r.width*DW - down.x;
      if(Math.abs(dx)>26){ down.moved=true; setLane(dx>0?1:-1); }
    });
    cv.addEventListener('pointerup',function(){
      if(!down) return;
      var swipe=down.moved, x=down.x; down=null;
      if(S.mode!=='play'){ press(); return; }
      if(!swipe) toss(x<DW/2?-1:1);
    });
    cv.addEventListener('pointercancel',function(){ down=null; });

    window.addEventListener('keydown',function(e){
      var k=e.key.toLowerCase();
      if(['arrowleft','arrowright',' '].indexOf(k)>=0) e.preventDefault();
      if(e.repeat) return;
      if(S.mode!=='play'){ if(k===' '||k==='enter') press(); return; }
      if(k==='arrowleft') setLane(-1);
      if(k==='arrowright') setLane(1);
      if(k==='q'||k==='a'||k==='z') toss(-1);
      if(k==='e'||k==='d'||k==='m') toss(1);
      if(k==='p') toggleMute();
    },{passive:false});
  }
}

export { attachInput };
