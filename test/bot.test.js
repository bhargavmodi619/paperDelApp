/* The playability bot claude.md section 6 asks for.
 *
 * "If a bot with perfect timing cannot clear a level, the generator is
 *  producing unfair streets."
 *
 * This is the guard on "harder every level, but still playable". It plays each
 * level several times and asserts on averages, because a single unlucky street
 * proves nothing and a flaky test is worse than no test. Run with `npm test`. */
import assert from 'node:assert/strict';
import { installDom } from './stub-dom.js';
import { drive } from './bot-brain.js';

installDom();

let api = null;
globalThis.__HOOK__ = a => { api = a; };
await import('../src/main.js');

const { S, update, buildLevel, toss, setLane, findTarget, landZ } = api;
const fns = { setLane, toss, findTarget, landZ };

const RUNS = 6;
const TOP_LEVEL = 12;

function playOnce(lv){
  buildLevel(lv);
  S.mode = 'play';
  S.lives = 99;                     // measure crashes, don't race the life counter
  const stats = { ranDry: 0 };
  let frames = 0;
  while (S.mode === 'play' && frames++ < 300000){
    drive(S, fns, stats);
    update(1/60);
  }
  return {
    crashes: 99 - S.lives, ranDry: stats.ranDry, seconds: frames/60,
    delivered: S.delivered, need: S.need, targets: S.targets,
    speed: S.speed, quotaMet: S.delivered >= S.need
  };
}

const table = [];
for (let lv = 1; lv <= TOP_LEVEL; lv++){
  const runs = [];
  for (let i = 0; i < RUNS; i++) runs.push(playOnce(lv));
  const avg = k => runs.reduce((a,r) => a + r[k], 0) / runs.length;
  table.push({
    lv, speed: runs[0].speed, need: runs[0].need, targets: runs[0].targets,
    crashes: avg('crashes'), seconds: avg('seconds'), delivered: avg('delivered'),
    allQuota: runs.every(r => r.quotaMet),
    worstCrashes: Math.max(...runs.map(r => r.crashes))
  });
}

let passed = 0;
function test(name, fn){ fn(); console.log('  ok  ' + name); passed++; }

test('a competent rider always makes the quota, levels 1-' + TOP_LEVEL, () => {
  for (const r of table){
    assert.ok(r.allQuota,
      'level ' + r.lv + ' failed the quota (delivered ' + r.delivered.toFixed(1) +
      ' of ' + r.need + ')');
  }
});

test('the early levels are near-flawless', () => {
  for (const r of table.filter(r => r.lv <= 4)){
    assert.ok(r.crashes <= 0.35,
      'level ' + r.lv + ' averages ' + r.crashes.toFixed(2) +
      ' crashes; the first levels should barely scratch a good rider');
  }
});

test('later levels get harder without becoming unfair', () => {
  for (const r of table){
    assert.ok(r.crashes <= 1.5,
      'level ' + r.lv + ' averages ' + r.crashes.toFixed(2) +
      ' crashes for a bot with perfect timing — the generator is making unfair streets');
    assert.ok(r.worstCrashes <= 3,
      'level ' + r.lv + ' had a run costing ' + r.worstCrashes + ' lives');
  }
});

test('difficulty actually climbs across the range', () => {
  const early = table.slice(0,3).reduce((a,r)=>a+r.crashes,0)/3;
  const late  = table.slice(-3).reduce((a,r)=>a+r.crashes,0)/3;
  assert.ok(table[table.length-1].speed > table[0].speed + 2, 'speed climbs meaningfully');
  assert.ok(table[table.length-1].targets > table[0].targets + 8, 'the round gets much longer');
  assert.ok(late >= early, 'late levels should not be easier than early ones');
});

test('no street drags on', () => {
  for (const r of table){
    assert.ok(r.seconds < 95,
      'level ' + r.lv + ' takes ' + r.seconds.toFixed(0) + 's, too long for one street');
  }
});

console.log('\n  lv  speed  round  quota  delivered  crashes  secs');
for (const r of table){
  console.log('  ' + String(r.lv).padStart(2) + '  ' +
    r.speed.toFixed(1).padStart(5) + '  ' +
    String(r.targets).padStart(5) + '  ' +
    String(r.need).padStart(5) + '  ' +
    r.delivered.toFixed(1).padStart(9) + '  ' +
    r.crashes.toFixed(2).padStart(7) + '  ' +
    r.seconds.toFixed(0).padStart(4));
}

console.log('\n' + passed + ' passing');
