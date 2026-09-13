// One oscillator per sound effect. Silent if the browser has no AudioContext.
var actx=null, muted=false;
function blip(f,d,type){
  if(muted || typeof window==='undefined') return;
  try{
    if(!actx){ var A=window.AudioContext||window.webkitAudioContext; if(!A) return; actx=new A(); }
    if(actx.state==='suspended') actx.resume();
    var o=actx.createOscillator(), g=actx.createGain();
    o.type=type||'triangle'; o.frequency.value=f; g.gain.value=0.05;
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime+d);
    o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime+d);
  }catch(e){}
}

function toggleMute(){ muted = !muted; return muted; }
/* Browsers start the context suspended until the first gesture. */
function resumeAudio(){ if(actx && actx.state==='suspended') actx.resume(); }

export { blip, toggleMute, resumeAudio };
