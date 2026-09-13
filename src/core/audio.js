// WebAudio, synthesised. Nothing is loaded from disk, so there are no sample
// licences to track (claude.md section 4.7) and the build stays dependency-free.
// Silent if the browser has no AudioContext.
var actx=null, muted=false;

function ctxOrNull(){
  if(typeof window==='undefined') return null;
  try{
    if(!actx){
      var A = window.AudioContext||window.webkitAudioContext;
      if(!A) return null;
      actx = new A();
    }
    if(actx.state==='suspended') actx.resume();
    return actx;
  }catch(e){ return null; }
}

function blip(f,d,type){
  if(muted) return;
  var a = ctxOrNull(); if(!a) return;
  try{
    var o=a.createOscillator(), g=a.createGain();
    o.type=type||'triangle'; o.frequency.value=f; g.gain.value=0.05;
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime+d);
    o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime+d);
  }catch(e){}
}

/* ---- the scooter ----------------------------------------------------------
   A Bajaj two-stroke single: a buzzy ring-ding, not a smooth hum. Built from
   a sawtooth at the firing frequency, a detuned octave above it for the rasp,
   a square an octave below for the thump, and a little filtered noise for
   intake roar. A lowpass opens as the revs climb. */
var eng = null;

function startEngine(){
  if(eng) return;
  var a = ctxOrNull(); if(!a) return;
  try{
    var out = a.createGain();       out.gain.value = 0;
    var lp  = a.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=520; lp.Q.value=6;

    var saw  = a.createOscillator(); saw.type='sawtooth';
    var rasp = a.createOscillator(); rasp.type='sawtooth'; rasp.detune.value = 14;
    var sub  = a.createOscillator(); sub.type='square';

    var gSaw = a.createGain();  gSaw.gain.value  = 0.55;
    var gRasp= a.createGain();  gRasp.gain.value = 0.22;
    var gSub = a.createGain();  gSub.gain.value  = 0.30;

    /* two seconds of white noise, looped, for the intake */
    var frames = a.sampleRate*2;
    var buf = a.createBuffer(1, frames, a.sampleRate);
    var d = buf.getChannelData(0);
    for(var i=0;i<frames;i++) d[i] = Math.random()*2-1;
    var noise = a.createBufferSource(); noise.buffer=buf; noise.loop=true;
    var bp = a.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=760; bp.Q.value=0.7;
    var gN = a.createGain(); gN.gain.value = 0.06;

    saw.connect(gSaw).connect(lp);
    rasp.connect(gRasp).connect(lp);
    sub.connect(gSub).connect(lp);
    noise.connect(bp).connect(gN).connect(lp);
    lp.connect(out).connect(a.destination);

    saw.start(); rasp.start(); sub.start(); noise.start();
    eng = { a:a, out:out, lp:lp, saw:saw, rasp:rasp, sub:sub, noise:noise, level:0 };
    setEngine(0.35);
  }catch(e){ eng = null; }
}

/* load: 0 idling, 1 flat out. Ramped, never stepped, or it clicks. */
function setEngine(load){
  if(!eng) return;
  try{
    var a = eng.a, now = a.currentTime, k = clamp01(load);
    var f = 46 + k*58;                        // firing frequency, Hz
    var vol = muted ? 0 : 0.030 + k*0.028;
    eng.saw .frequency.setTargetAtTime(f,      now, 0.08);
    eng.rasp.frequency.setTargetAtTime(f*2.01, now, 0.08);
    eng.sub .frequency.setTargetAtTime(f*0.5,  now, 0.08);
    eng.lp  .frequency.setTargetAtTime(380 + k*900, now, 0.10);
    eng.out .gain     .setTargetAtTime(vol,    now, 0.10);
    eng.level = k;
  }catch(e){}
}

function stopEngine(){
  if(!eng) return;
  try{
    eng.out.gain.setTargetAtTime(0, eng.a.currentTime, 0.08);
    var e = eng; eng = null;
    setTimeout(function(){
      try{ e.saw.stop(); e.rasp.stop(); e.sub.stop(); e.noise.stop(); }catch(x){}
    }, 400);
  }catch(e){ eng = null; }
}

function clamp01(v){ return v<0?0:v>1?1:v; }

function toggleMute(){
  muted = !muted;
  if(eng) setEngine(eng.level);      // re-apply, which folds the mute into the gain
  return muted;
}
/* Browsers start the context suspended until the first gesture. */
function resumeAudio(){ ctxOrNull(); }
/* Silence everything, engine included, without tearing the nodes down. */
function suspendAudio(){ try{ if(actx && actx.state==='running') actx.suspend(); }catch(e){} }

export { blip, toggleMute, resumeAudio, suspendAudio, startEngine, setEngine, stopEngine };
