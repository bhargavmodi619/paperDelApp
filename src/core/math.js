// Small numeric helpers. No canvas, no state.
function rnd(a,b){ return a+Math.random()*(b-a); }
function pick(a){ return a[(Math.random()*a.length)|0]; }
function clamp(v,a,b){ return v<a?a:v>b?b:v; }
function shade(hex,amt){
  var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  r=clamp(Math.round(r+255*amt),0,255); g=clamp(Math.round(g+255*amt),0,255); b=clamp(Math.round(b+255*amt),0,255);
  return 'rgb('+r+','+g+','+b+')';
}

function pick2(seed, arr){ return arr[Math.floor(seed)%arr.length]; }

export { rnd, pick, clamp, shade, pick2 };
