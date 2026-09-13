/* Headless smoke test: boots the modular game and plays it without a browser.
   Run with `npm test`. */
import assert from 'node:assert/strict';
import { installDom } from './stub-dom.js';

installDom();

let api = null;
globalThis.__HOOK__ = a => { api = a; };
await import('../src/main.js');

assert.ok(api, 'main.js should hand the test hook its API');
const { S, update, render, startGame, toss, setLane, findTarget, landZ, buildLevel } = api;

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
});

test('every street has landmarks, hawkers, dogs and a crossroads', () => {
  buildLevel(3);
  const kinds = k => S.objs.filter(o => o.kind === k);
  const types = new Set(kinds('landmark').map(o => o.type));
  assert.ok(kinds('landmark').length > 0, 'landmarks are placed');
  assert.ok([...types].every(t => ['temple','school','govt'].includes(t)));
  assert.ok(S.objs.some(o => o.kind === 'prop' && o.type === 'hawker'), 'hawkers on the verge');
  assert.ok(S.objs.some(o => o.kind === 'prop' && o.type === 'dog'), 'dogs still sit on the verge');
  assert.ok(kinds('cross').length > 0, 'and dogs that cross the road');
  assert.ok(S.junctions.length > 0, 'at least one crossroads');
  assert.ok(S.curve && S.curve.length > 0, 'the curve table is built');
  assert.ok(S.curve.some(v => Math.abs(v) > 0.5), 'the road actually bends somewhere');
});

test('a landmark is never on the delivery round', () => {
  for (let lv = 1; lv <= 12; lv++){
    buildLevel(lv);
    assert.ok(!S.objs.some(o => o.kind === 'landmark' && o.target),
      'level ' + lv + ' put a pin on a landmark');
  }
});

test('difficulty rises every level and never stops rising', () => {
  let prevSpeed = 0, prevQuota = 0, prevTargets = 0;
  for (let lv = 1; lv <= 20; lv++){
    buildLevel(lv);
    assert.ok(S.speed > prevSpeed, 'speed rises at level ' + lv);
    assert.ok(S.targets > prevTargets, 'the round gets longer at level ' + lv);
    assert.ok(S.need >= prevQuota, 'the quota never drops at level ' + lv);
    prevSpeed = S.speed; prevQuota = S.need; prevTargets = S.targets;
  }
  assert.ok(S.speed < 14, 'but speed stays inside something a human can ride');
});

test('papers are scarce: the quota plus two, and no more', () => {
  for (let lv = 1; lv <= 10; lv++){
    buildLevel(lv);
    assert.equal(S.papers, S.need + 2, 'level ' + lv + ' hands out exactly quota+2');
    assert.ok(S.papers < S.targets + 2, 'never enough to spray at every house');
    const bundles = S.objs.filter(o => o.kind === 'pickup');
    assert.ok(bundles.every(b => b.amount === 3), 'bundles top you up by 3');
  }
});

test('setLane steers and clamps to the three lanes', () => {
  startGame();
  S.lane = 1;
  setLane(-1); assert.equal(S.lane, 0);
  setLane(-1); assert.equal(S.lane, 0, 'cannot steer off the left edge');
  setLane(1); setLane(1); assert.equal(S.lane, 2);
  setLane(1); assert.equal(S.lane, 2, 'cannot steer off the right edge');
  S.lane = 1;
});

test('a crossing dog always telegraphs before it moves', () => {
  buildLevel(4);
  S.mode = 'play'; S.lives = 999;
  const seen = new Map();          // dog -> was it ever seen in 'alert' before 'run'
  const dogs = S.objs.filter(o => o.kind === 'cross');
  assert.ok(dogs.length > 0);
  dogs.forEach(d => seen.set(d, { alertFrames: 0, movedEarly: false, startX: d.x }));

  for (let i = 0; i < 20000 && S.trackPos < S.trackLen; i++){
    update(1/60);
    for (const d of dogs){
      const rec = seen.get(d);
      if (d.phase === 'alert') rec.alertFrames++;
      if (d.phase !== 'run' && d.phase !== 'gone' && d.x !== rec.startX) rec.movedEarly = true;
    }
  }
  for (const d of dogs){
    const rec = seen.get(d);
    assert.ok(!rec.movedEarly, 'a dog moved before it entered the run phase');
    if (d.phase === 'run' || d.phase === 'gone'){
      assert.ok(rec.alertFrames >= 40,
        'a dog bolted after only ' + rec.alertFrames + ' frames of warning (need ~45)');
    }
  }
});

test('a well-timed throw delivers the paper and scores', () => {
  startGame();
  S.lives = 999;
  let delivered = false;
  for (let i = 0; i < 40000 && !delivered; i++){
    for (const side of [-1, 1]){
      const h = findTarget(side);
      if (h && Math.abs(h.z - landZ()) <= 0.5 && S.arm <= 0 && S.stun <= 0 && S.papers > 0){
        const before = S.delivered, score = S.score;
        toss(side);
        step(Math.ceil(0.45 * 60) + 2);
        if (S.delivered > before){
          assert.ok(S.score > score, 'a delivery scores points');
          assert.ok(S.combo >= 1, 'a delivery starts a combo');
          delivered = true;
        }
        break;
      }
    }
    if (!delivered) step(1);
    if (S.mode !== 'play'){ startGame(); S.lives = 999; }
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
  S.lives = 999;
  for (let i = 0; i < 90000 && S.mode === 'play'; i++) step(1);
  assert.ok(S.mode === 'clear' || S.mode === 'over', 'the street ends, one way or the other');
  assert.equal(typeof S.failed, 'boolean');
});

console.log('\n' + passed + ' passing');
