/* Two jobs, both plain Node with no packages: `npm run build`.
 *
 * 1. Fold src/ back into a single, dependency-free paper-round.html, so the
 *    zero-dependency, no-server, double-click-it-open property survives the
 *    module split. It works because every module is nothing but top-level
 *    `var`/`function` declarations plus import/export lines: strip those,
 *    concatenate in dependency order inside one IIFE, and you get the
 *    original program back.
 *
 * 2. Assemble dist/ — exactly and only what a player's browser needs — for
 *    Cloudflare Pages to publish. The repo root also holds tests, this
 *    script, and the project notes; none of that belongs on the live site.
 *
 * site.json holds the public URL and copy. It is stamped into the <head> of
 * both outputs so the share card has an absolute image URL.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeIconPng } from './tools/icon.js';

const ROOT   = path.dirname(fileURLToPath(import.meta.url));
const SRC    = path.join(ROOT, 'src');
const PUBLIC = path.join(ROOT, 'public');
const DIST   = path.join(ROOT, 'dist');
const ENTRY  = path.join(SRC, 'main.js');
const SINGLE = path.join(ROOT, 'paper-round.html');

const read = f => fs.readFileSync(f, 'utf8');
const site = JSON.parse(read(path.join(ROOT, 'site.json')));

/* ---- 1. the single file ---------------------------------------------------- */

/* Depth-first walk of the import graph, deepest dependency emitted first. */
function order(entry){
  const seen = new Set(), out = [];
  (function visit(file){
    const key = path.resolve(file);
    if (seen.has(key)) return;
    seen.add(key);
    const src = read(key);
    for (const m of src.matchAll(/^import\s[^'"]*['"](\.[^'"]+)['"]/gm)) {
      visit(path.resolve(path.dirname(key), m[1]));
    }
    out.push(key);
  })(entry);
  return out;
}

/* Drop the module plumbing; keep every declaration exactly as written. */
function strip(src){
  return src
    .split('\n')
    .filter(l => !/^import\s/.test(l))
    .filter(l => !/^export\s*\{[^}]*\}\s*;?\s*$/.test(l))
    .filter(l => !/^\s*["']use strict["'];\s*$/.test(l))
    .join('\n')
    .replace(/^export\s+/gm, '')
    .trim();
}

/* The <head> is shared with index.html so both entry points carry the same
   noindex, icon and share-card tags. Everything between <head> and the
   stylesheet link is lifted straight out of index.html. */
function sharedHead(){
  const html = read(path.join(ROOT, 'index.html'));
  const m = html.match(/<head>([\s\S]*?)<link rel="stylesheet"/);
  return m ? m[1].trim() : '';
}

function stamp(text){
  return text
    .replace(/__SITE_URL__/g, site.url.replace(/\/$/, ''))
    .replace(/__SITE_TITLE__/g, site.title)
    .replace(/__SITE_DESCRIPTION__/g, site.description);
}

const files  = order(ENTRY);
const banner = files.map(f => ' *   ' + path.relative(ROOT, f).replace(/\\/g, '/')).join('\n');
const body   = files
  .map(f => '/* ---- ' + path.relative(SRC, f).replace(/\\/g, '/') + ' ---- */\n' + strip(read(f)))
  .join('\n\n');
const css = read(path.join(SRC, 'styles.css')).trim();

const single = stamp(`<!DOCTYPE html>
<html lang="en">
<head>
${sharedHead()}
<style>
${css}
</style>
</head>
<body>
<div id="wrap"><canvas id="game"></canvas></div>
<script>
/* GENERATED FILE — do not edit. Built from:
${banner}
 * Edit those and re-run: npm run build
 */
(function(){
"use strict";

${body}

})();
</script>
</body>
</html>
`);

fs.writeFileSync(SINGLE, single);
console.log('built paper-round.html  (' + files.length + ' modules, ' + single.split('\n').length + ' lines)');

/* ---- 2. dist/ for Cloudflare Pages ---------------------------------------- */

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

/* the module entry, stamped */
fs.writeFileSync(path.join(DIST, 'index.html'), stamp(read(path.join(ROOT, 'index.html'))));

/* the source modules it loads */
fs.cpSync(SRC, path.join(DIST, 'src'), { recursive: true });

/* the single file too, so /paper-round.html works as a fallback link */
fs.writeFileSync(path.join(DIST, 'paper-round.html'), single);

/* robots.txt, _headers */
fs.cpSync(PUBLIC, DIST, { recursive: true });

/* the icon: touch icon and share-card image */
fs.writeFileSync(path.join(DIST, 'icon.png'), makeIconPng(512));

const listing = [];
(function walk(d, rel){
  for (const e of fs.readdirSync(d, { withFileTypes: true })){
    const p = path.join(d, e.name), r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) walk(p, r); else listing.push(r);
  }
})(DIST, '');
console.log('built dist/  (' + listing.length + ' files) for ' + site.url);
