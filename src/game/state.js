// The single mutable game state object. Every module reads and writes this one.
var S = {
  mode:'title', level:1, score:0, lives:3, best:0,
  trackPos:0, trackLen:0, speed:8.5,
  lane:1, px:0, lean:0,

  /* camera: bob and a little lateral lag behind the rider, so lane changes
     have weight instead of snapping */
  camX:0, camBob:0, camRoll:0, focal:330,

  papers:0, delivered:0, need:0, targets:0,
  objs:[], shots:[], pops:[], dust:[],

  /* road curvature, sampled every CURVE_STEP units by buildLevel */
  curve:null, junctions:[], turnSign:0, turnT:0,

  t:0, stun:0, shake:0, combo:0,
  arm:0, armSide:1,
  tutorial:0, perfect:false, failed:false,
  callout:'', calloutT:0, calloutCol:'#fff'
};

export { S };
