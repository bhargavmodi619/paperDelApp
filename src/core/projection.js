// The pinhole camera that turns world (x, z) into screen (x, y).
import { DW } from './canvas.js';

var HORIZON = 250;
var CAMH = 1.6, FOCAL = 330;       // wide lens: the street reads wide
var ROAD_HALF = 1.35;
var LANES = [-0.80, 0, 0.80];
var HOUSE_X = 2.70;
var FLIGHT = 0.45;                 // seconds a paper spends in the air
var LEAD   = 1.6;                  // how far ahead of you it lands

function yAt(z){ return HORIZON + CAMH*FOCAL/z; }
function ppuAt(z){ return FOCAL/z; }
function sxAt(x,z,px){ return DW/2 + (x-px)*ppuAt(z); }

export { HORIZON, CAMH, FOCAL, ROAD_HALF, LANES, HOUSE_X, FLIGHT, LEAD, yAt, ppuAt, sxAt };
