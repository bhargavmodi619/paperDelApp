/* Paper Round — entry point.
   Wires the modules together: build the first street, attach controls,
   then run a fixed update/render loop off requestAnimationFrame. */
"use strict";

import { S } from './game/state.js';
import { buildLevel } from './game/level.js';
import { initDust } from './game/particles.js';
import { update } from './game/update.js';
import { attachInput } from './game/input.js';
import { startGame, nextStreet, press } from './game/flow.js';
import { toss, findTarget, landZ } from './game/throwing.js';
import { setLane } from './game/actions.js';
import { render } from './render/scene.js';

initDust();
buildLevel(1);
attachInput();

if (typeof window!=='undefined' && window.requestAnimationFrame){
  var last=performance.now();
  (function frame(now){
    var dt=Math.min(.05,(now-last)/1000); last=now;
    update(dt); render(); requestAnimationFrame(frame);
  })(last);
}

/* Test seam: harnesses set globalThis.__HOOK__ before loading this module. */
if (typeof globalThis!=='undefined' && globalThis.__HOOK__){
  globalThis.__HOOK__({ S:S, update:update, render:render, buildLevel:buildLevel,
    startGame:startGame, toss:toss, setLane:setLane, findTarget:findTarget, landZ:landZ,
    nextStreet:nextStreet, press:press });
}
