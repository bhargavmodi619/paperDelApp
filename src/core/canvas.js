// Backing canvas: fixed 400x700 design space, scaled to the device pixel ratio.
var DW = 400, DH = 700;
var cv = document.getElementById('game');
var ctx = cv.getContext('2d');
function resize(){
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(DW*dpr); cv.height = Math.round(DH*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
if (typeof window !== 'undefined' && window.addEventListener){ resize(); window.addEventListener('resize', resize); }

export { DW, DH, cv, ctx, resize };
