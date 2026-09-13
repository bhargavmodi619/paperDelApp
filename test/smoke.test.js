/* Headless smoke test: boots the modular game and plays it without a browser.
   Run with `npm test`. */
import assert from 'node:assert/strict';
import { installDom } from './stub-dom.js';

installDom();

let api = null;
globalThis.__HOOK__ = a => { api = a; };
await import('../src/main.js');

assert.ok(api, 'main.js should hand the test hook its API');
const { S, update, render, startGame, toss, setLane, findTarget, landZ } = api;

const step = (n, dt = 1/60) => { for (let i = 0; i < n; i++){ update(dt); render(); } };

let passed = 0;
function test(name, fn){
  fn();
  console.log('  ok  ' + name);
  passed++;
}

test('boots into title mode with a street already built', () => {
  assert.equal(S.mode, 'title');
  assert.ok(S.objs.length > 0);
  assert.ok(S.objs.some(o => o.kind === 'house' && o.target), 'street has a round to deliver');
});

test('title screen renders and scrolls without throwing', () => {
  const before = S.trackPos;
  step(120);
  assert.ok(S.trackPos > before, 'the title screen idles forward');
});

test('startGame resets the run', () => {
  startGame();
  assert.equal(S.mode, 'play');
  assert.equal(S.level, 1);
  assert.equal(S.score, 0);
  assert.equal(S.lives, 3);
  assert.equal(S.delivered, 0);
  assert.ok(S.papers > S.targets, 'you start with spare papers');
});

test('setLane steers and clamps to the three lanes', () => {
  S.lane = 1;
  setLane(-1); assert.equal(S.lane, 0);
  setLane(-1); assert.equal(S.lane, 0, 'cannot steer off the left edge');
  setLane(1); setLane(1); assert.equal(S.lane, 2);
  setLane(1); assert.equal(S.lane, 2, 'cannot steer off the right edge');
  S.lane = 1;
});

test('a well-timed throw delivers the paper and scores', () => {
  S.lives = 99;                                   // stay alive through any obstacle
  let delivered = false;
  for (let i = 0; i < 40000 && !delivered; i++){
    for (const side of [-1, 1]){
      const h = findTarget(side);
      if (h && Math.abs(h.z - landZ()) <= 0.5 && S.arm <= 0 && S.stun <= 0){
        const before = S.delivered, score = S.score;
        toss(side);
        step(Math.ceil(0.45 * 60) + 2);           // let the paper finish its flight
        if (S.delivered > before){
          assert.ok(S.score > score, 'a delivery scores points');
          assert.ok(S.combo >= 1, 'a delivery starts a combo');
          delivered = true;
        }
        break;
      }
    }
    if (!delivered) step(1);
    if (S.mode !== 'play') startGame();
  }
  assert.ok(delivered, 'at least one paper should land on a house');
});

test('throwing with no papers left is refused, not crashed', () => {
  startGame();
  S.papers = 0;
  const before = S.shots.length;
  S.arm = 0;
  toss(1);
  assert.equal(S.shots.length, before, 'no paper leaves the basket');
  assert.equal(S.papers, 0);
});

test('reaching the end of the street resolves the level', () => {
  startGame();
  S.lives = 99;
  for (let i = 0; i < 60000 && S.mode === 'play'; i++) step(1);
  assert.ok(S.mode === 'clear' || S.mode === 'over', 'the street ends, one way or the other');
  assert.equal(typeof S.failed, 'boolean');
});

console.log('\n' + passed + ' passing');
