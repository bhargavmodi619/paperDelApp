// Pointer (swipe to steer, tap a side to throw), keyboard, and the page
// visibility hook that pauses the game when the phone locks.
import { cv, DW, DH } from '../core/canvas.js';
import { S } from './state.js';
import { setLane } from './actions.js';
import { toss } from './throwing.js';
import { press, unpause, visibility } from './flow.js';
import { toggleMute } from '../core/audio.js';
import { sessionStarted } from './analytics.js';

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
      /* first tap after coming back only resumes — never throws */
      if(S.paused){ unpause(); return; }
      if(S.mode!=='play'){ press(); return; }
      if(!swipe) toss(x<DW/2?-1:1);
    });
    cv.addEventListener('pointercancel',function(){ down=null; });

    window.addEventListener('keydown',function(e){
      var k=e.key.toLowerCase();
      if(['arrowleft','arrowright',' '].indexOf(k)>=0) e.preventDefault();
      if(e.repeat) return;
      if(S.paused){ unpause(); return; }
      if(S.mode!=='play'){ if(k===' '||k==='enter') press(); return; }
      if(k==='arrowleft') setLane(-1);
      if(k==='arrowright') setLane(1);
      if(k==='q'||k==='a'||k==='z') toss(-1);
      if(k==='e'||k==='d'||k==='m') toss(1);
      if(k==='p') toggleMute();
    },{passive:false});

    /* phone locked, app switched, tab hidden -> freeze and go quiet.
       pagehide covers iOS Safari, which does not always fire visibilitychange. */
    if (typeof document!=='undefined' && document.addEventListener){
      document.addEventListener('visibilitychange', function(){ visibility(document.hidden); });
      window.addEventListener('pagehide', function(){ visibility(true); });
      window.addEventListener('blur', function(){ if(S.mode==='play') visibility(true); });
    }

    sessionStarted();
  }
}

export { attachInput };
