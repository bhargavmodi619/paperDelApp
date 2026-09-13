/* Proves the generated single-file build is a working game, not just valid
   syntax: it extracts the script out of paper-round.html and plays it against
   the same stubbed canvas the module test uses. Run with `npm test`. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installDom } from './stub-dom.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BUILT = path.join(ROOT, 'paper-round.html');

assert.ok(fs.existsSync(BUILT), 'paper-round.html is missing — run `npm run build` first');

const html = fs.readFileSync(BUILT, 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(script, 'built file should carry exactly one inline script');

installDom();
let api = null;
globalThis.__HOOK__ = a => { api = a; };

const context = vm.createContext(globalThis);
new vm.Script(script[1], { filename: 'paper-round.html' }).runInContext(context);

let passed = 0;
function test(name, fn){ fn(); console.log('  ok  ' + name); passed++; }

test('the built file exposes the __HOOK__ API', () => {
  assert.ok(api, '__HOOK__ should have been called');
  for (const k of ['S','update','render','buildLevel','startGame','toss','setLane','findTarget','landZ']) {
    assert.equal(typeof api[k], k === 'S' ? 'object' : 'function', '__HOOK__ exports ' + k);
  }
});

test('the built file has no leftover module plumbing', () => {
  assert.ok(!/^\s*import\s/m.test(script[1]), 'no import statements survive the build');
  assert.ok(!/^\s*export\s/m.test(script[1]), 'no export statements survive the build');
});

test('the built game boots, plays and delivers', () => {
  const { S, update, render, startGame, toss, findTarget, landZ } = api;
  assert.equal(S.mode, 'title');
  startGame();
  assert.equal(S.mode, 'play');
  S.lives = 99;

  const step = n => { for (let i = 0; i < n; i++){ update(1/60); render(); } };
  let delivered = false;
  for (let i = 0; i < 40000 && !delivered; i++){
    for (const side of [-1, 1]){
      const h = findTarget(side);
      if (h && Math.abs(h.z - landZ()) <= 0.5 && S.arm <= 0 && S.stun <= 0){
        const before = S.delivered;
        toss(side);
        step(29);
        if (S.delivered > before) delivered = true;
        break;
      }
    }
    if (!delivered) step(1);
    if (S.mode !== 'play') startGame();
  }
  assert.ok(delivered, 'the built game should land a paper on a house');
  assert.ok(S.score > 0);
});

console.log('\n' + passed + ' passing');
