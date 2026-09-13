// The single mutable game state object. Every module reads and writes this one.
var S = {
  mode:'title', level:1, score:0, lives:3, best:0,
  trackPos:0, trackLen:0, speed:8.5,
  lane:1, px:0, lean:0,
  papers:0, delivered:0, need:0, targets:0,
  objs:[], shots:[], pops:[], dust:[],
  t:0, stun:0, shake:0, combo:0,
  arm:0, armSide:1,
  tutorial:0, perfect:false, failed:false,
  callout:'', calloutT:0, calloutCol:'#fff'
};

export { S };
