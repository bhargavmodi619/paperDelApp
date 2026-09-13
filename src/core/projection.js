// The pinhole camera that turns world (x, z) into screen (x, y).
//
// Note the convention: callers pass RELATIVE depth (o.z - S.trackPos), not
// absolute z. The camera keeps its own copy of where the rider is so it can
// look the road curvature up without importing game state.
import { DW } from './canvas.js';

var HORIZON = 250;
var CAMH = 1.6;
var FOCAL_BASE = 330;              // wide lens: the street reads wide
var ROAD_HALF = 1.35;
var LANES = [-0.80, 0, 0.80];
var HOUSE_X = 2.70;
var FLIGHT = 0.45;                 // seconds a paper spends in the air
var LEAD   = 1.6;                  // how far ahead of you it lands

/* Focal length breathes with speed: the faster you ride, the wider the lens
   pulls. Subtle and clamped — it also shifts where papers appear to land. */
var focal = FOCAL_BASE;
function setFocal(f){ focal = f; }

/* ---- road curvature -------------------------------------------------------
   The street is still a straight z axis; a curve is a lateral offset applied
   to the road centre at each depth. Sampled into a table when the level is
   built, so a lookup is a lerp rather than an integration. Everything drawn
   through sxAt() bends with the road for free — houses, obstacles, papers in
   flight, all of it. */
var curveTable = null, curveStep = 1, camZ = 0;

function setCurveTable(table, step){ curveTable = table; curveStep = step || 1; }
function setCamZ(z){ camZ = z; }

function curveAt(z){
  if(!curveTable) return 0;
  var f = z/curveStep;
  if(f <= 0) return curveTable[0];
  var i = f|0;
  if(i >= curveTable.length-1) return curveTable[curveTable.length-1];
  var frac = f-i;
  return curveTable[i]*(1-frac) + curveTable[i+1]*frac;
}

/* How far the road has slid sideways, `rel` units ahead of the rider. */
function bendAt(rel){ return curveAt(camZ+rel) - curveAt(camZ); }

/* Heading of the road right under the rider — used to lean the bike. */
function headingAt(rel){
  var a = curveAt(camZ+rel), b = curveAt(camZ+rel+2);
  return (b-a)/2;
}

function yAt(rel){ return HORIZON + CAMH*focal/rel; }
function ppuAt(rel){ return focal/rel; }
function sxAt(x,rel,px){ return DW/2 + (x - px + bendAt(rel))*ppuAt(rel); }

export { HORIZON, CAMH, FOCAL_BASE, ROAD_HALF, LANES, HOUSE_X, FLIGHT, LEAD,
         yAt, ppuAt, sxAt, setFocal, setCurveTable, setCamZ, curveAt, bendAt, headingAt };
